const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { JWT_SECRET } = require('../config/jwt');

// Helper to optionally extract user ID from Authorization header
const getUserIdFromReq = (req) => {
  if (req.user && req.user.id) return req.user.id;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded.id;
    } catch {
      return null;
    }
  }
  return null;
};

// GET /api/books - Advanced search, filtering, sorting, pagination
const getAllBooks = async (req, res, next) => {
  try {
    const { 
      search = '', 
      category = '', 
      author = '',
      publisher = '',
      language = '',
      book_format = '',
      format = '',
      year = '',
      publication_year = '',
      availability = 'all', 
      sortBy = 'recent',
      sort = '',
      page = 1, 
      limit = 20 
    } = req.query;

    const currentUserId = getUserIdFromReq(req);
    const activeSort = sort || sortBy || 'recent';
    const activeFormat = book_format || format || '';
    const activeYear = publication_year || year || '';

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let whereClauses = [];
    let params = [];

    // 1. Search Query (Title, Author, ISBN, Publisher, Description)
    if (search && search.trim()) {
      whereClauses.push('(b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ? OR b.publisher LIKE ? OR b.description LIKE ?)');
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // 2. Author Filter
    if (author && author.trim()) {
      whereClauses.push('b.author LIKE ?');
      params.push(`%${author.trim()}%`);
    }

    // 3. Publisher Filter
    if (publisher && publisher.trim()) {
      whereClauses.push('b.publisher LIKE ?');
      params.push(`%${publisher.trim()}%`);
    }

    // 4. Category Filter (by ID or name)
    if (category && category !== 'all' && category !== '') {
      const parsedCatId = parseInt(category, 10);
      if (!isNaN(parsedCatId) && parsedCatId > 0) {
        whereClauses.push('b.category_id = ?');
        params.push(parsedCatId);
      } else {
        whereClauses.push('c.name = ?');
        params.push(category.trim());
      }
    }

    // 5. Language Filter
    if (language && language !== 'all' && language !== '') {
      whereClauses.push('b.language = ?');
      params.push(language.trim());
    }

    // 6. Book Format Filter
    if (activeFormat && activeFormat !== 'all' && activeFormat !== '') {
      whereClauses.push('b.book_format = ?');
      params.push(activeFormat.trim());
    }

    // 7. Publication Year Filter (exact or 2020+)
    if (activeYear && activeYear !== 'all' && activeYear !== '') {
      if (String(activeYear).endsWith('+')) {
        const minYear = parseInt(activeYear, 10);
        if (!isNaN(minYear)) {
          whereClauses.push('b.publication_year >= ?');
          params.push(minYear);
        }
      } else {
        const exactYear = parseInt(activeYear, 10);
        if (!isNaN(exactYear)) {
          whereClauses.push('b.publication_year = ?');
          params.push(exactYear);
        }
      }
    }

    // 8. Availability Filter
    if (availability === 'available') {
      whereClauses.push('b.available_copies > 0');
    } else if (availability === 'unavailable') {
      whereClauses.push('b.available_copies <= 0');
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // 9. Sorting
    let orderSql = 'ORDER BY b.created_at DESC';
    if (activeSort === 'title_asc') orderSql = 'ORDER BY b.title ASC';
    else if (activeSort === 'title_desc') orderSql = 'ORDER BY b.title DESC';
    else if (activeSort === 'author_asc') orderSql = 'ORDER BY b.author ASC';
    else if (activeSort === 'year_desc') orderSql = 'ORDER BY b.publication_year DESC';
    else if (activeSort === 'year_asc') orderSql = 'ORDER BY b.publication_year ASC';
    else if (activeSort === 'most_borrowed') orderSql = 'ORDER BY borrow_count DESC, b.created_at DESC';
    else if (activeSort === 'most_available') orderSql = 'ORDER BY b.available_copies DESC';
    else if (activeSort === 'highest_rated') orderSql = 'ORDER BY b.rating_avg DESC, b.rating_count DESC';
    else if (activeSort === 'recent' || activeSort === 'newest') orderSql = 'ORDER BY b.created_at DESC';

    // Count total query
    const [countRows] = await query(
      `SELECT COUNT(DISTINCT b.id) as total 
       FROM books b 
       LEFT JOIN categories c ON b.category_id = c.id
       ${whereSql}`,
      params
    );
    const total = countRows[0].total;

    // Optional user favorite join
    let favSelect = '0 as is_favorite';
    let favJoin = '';
    let queryParams = [...params];

    if (currentUserId) {
      favSelect = 'IF(f.id IS NOT NULL, 1, 0) as is_favorite';
      favJoin = `LEFT JOIN favorites f ON b.id = f.book_id AND f.user_id = ${parseInt(currentUserId, 10)}`;
    }

    // Data query with borrow count and category
    const [books] = await query(
      `SELECT 
        b.id, b.title, b.isbn, b.author, b.publisher, b.publication_year, 
        b.category_id, c.name as category_name, b.description, b.cover_image, 
        b.total_copies, b.available_copies, b.shelf_location, b.language, b.book_format,
        b.pages, b.rating_avg, b.rating_count, b.created_at, b.updated_at,
        COUNT(DISTINCT t.id) as borrow_count,
        ${favSelect}
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       LEFT JOIN transactions t ON b.id = t.book_id
       ${favJoin}
       ${whereSql}
       GROUP BY b.id, c.name
       ${orderSql}
       LIMIT ? OFFSET ?`,
      [...queryParams, limitNum, offset]
    );

    // Retrieve unique available languages and formats for quick frontend filter chips
    const [langRows] = await query("SELECT DISTINCT language FROM books WHERE language IS NOT NULL AND language != '' ORDER BY language ASC");
    const [formatRows] = await query("SELECT DISTINCT book_format FROM books WHERE book_format IS NOT NULL AND book_format != '' ORDER BY book_format ASC");

    res.status(200).json({
      success: true,
      books,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1
      },
      filterOptions: {
        languages: langRows.map(r => r.language),
        formats: formatRows.map(r => r.book_format)
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/books/:id
const getBookById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = getUserIdFromReq(req);

    let favSelect = '0 as is_favorite';
    let favJoin = '';
    if (currentUserId) {
      favSelect = 'IF(f.id IS NOT NULL, 1, 0) as is_favorite';
      favJoin = `LEFT JOIN favorites f ON b.id = f.book_id AND f.user_id = ${parseInt(currentUserId, 10)}`;
    }

    const [books] = await query(
      `SELECT 
        b.*, c.name as category_name,
        (SELECT COUNT(*) FROM reservations WHERE book_id = b.id AND status = 'WAITING') as waiting_reservations_count,
        (SELECT COUNT(*) FROM transactions WHERE book_id = b.id AND status IN ('ISSUED', 'OVERDUE')) as active_borrowed_count,
        (SELECT COUNT(*) FROM transactions WHERE book_id = b.id) as borrow_count,
        ${favSelect}
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       ${favJoin}
       WHERE b.id = ?`,
      [id]
    );

    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    const book = books[0];

    // Fetch top approved reviews for this book
    const [reviews] = await query(
      `SELECT 
        r.id, r.user_id, r.rating, r.review_text, r.created_at,
        u.name as user_name, u.role as user_role
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.book_id = ? AND r.status = 'APPROVED'
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [id]
    );

    // Generate QR code data URL (encodes book info and link)
    const qrData = JSON.stringify({
      id: book.id,
      title: book.title,
      isbn: book.isbn,
      shelf: book.shelf_location,
      url: `/books/${book.id}`
    });
    const qrCodeUrl = await QRCode.toDataURL(qrData, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    res.status(200).json({
      success: true,
      book: {
        ...book,
        qrCodeUrl,
        reviews
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/books/discovery - Curated discovery sections
const getDiscoverySections = async (req, res, next) => {
  try {
    const currentUserId = getUserIdFromReq(req);
    let favSelect = '0 as is_favorite';
    let favJoin = '';
    if (currentUserId) {
      favSelect = 'IF(f.id IS NOT NULL, 1, 0) as is_favorite';
      favJoin = `LEFT JOIN favorites f ON b.id = f.book_id AND f.user_id = ${parseInt(currentUserId, 10)}`;
    }

    const baseFields = `
      b.id, b.title, b.isbn, b.author, b.publisher, b.publication_year, 
      b.category_id, c.name as category_name, b.description, b.cover_image, 
      b.total_copies, b.available_copies, b.shelf_location, b.language, b.book_format,
      b.rating_avg, b.rating_count,
      ${favSelect}
    `;

    // 1. Popular Books (highest rating & borrow activity)
    const [popularBooks] = await query(
      `SELECT ${baseFields}
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       ${favJoin}
       ORDER BY b.rating_avg DESC, b.available_copies ASC
       LIMIT 10`
    );

    // 2. Recently Added
    const [recentlyAdded] = await query(
      `SELECT ${baseFields}
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       ${favJoin}
       ORDER BY b.created_at DESC
       LIMIT 10`
    );

    // 3. Highly Rated
    const [highlyRated] = await query(
      `SELECT ${baseFields}
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       ${favJoin}
       WHERE b.rating_avg >= 4.7
       ORDER BY b.rating_avg DESC, b.rating_count DESC
       LIMIT 10`
    );

    // 4. Academic & Textbooks
    const [academicTextbooks] = await query(
      `SELECT ${baseFields}
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       ${favJoin}
       WHERE b.book_format IN ('Textbook', 'Reference', 'Hardcover')
          OR c.name IN ('Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Engineering')
       ORDER BY b.publication_year DESC
       LIMIT 10`
    );

    // 5. Technology
    const [technology] = await query(
      `SELECT ${baseFields}
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       ${favJoin}
       WHERE c.name IN ('Programming', 'Software Engineering', 'Computer Networks', 'Cloud Computing', 'DevOps', 'Web Development', 'Operating Systems', 'Database Systems', 'Cybersecurity')
       ORDER BY b.rating_avg DESC
       LIMIT 10`
    );

    // 6. AI & Machine Learning
    const [aiAndMl] = await query(
      `SELECT ${baseFields}
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       ${favJoin}
       WHERE c.name IN ('Artificial Intelligence', 'Machine Learning', 'Deep Learning', 'Data Science')
       ORDER BY b.rating_avg DESC
       LIMIT 10`
    );

    // 7. Literature (World, Indian, Kannada, Hindi)
    const [literature] = await query(
      `SELECT ${baseFields}
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       ${favJoin}
       WHERE c.name IN ('Literature', 'English Literature', 'Indian Literature', 'Kannada Literature', 'Hindi Literature')
       ORDER BY b.rating_avg DESC
       LIMIT 10`
    );

    // 8. Business & Management
    const [businessAndManagement] = await query(
      `SELECT ${baseFields}
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       ${favJoin}
       WHERE c.name IN ('Business', 'Management', 'Finance', 'Economics', 'Entrepreneurship', 'Marketing')
       ORDER BY b.rating_avg DESC
       LIMIT 10`
    );

    // 9. Self Development
    const [selfDevelopment] = await query(
      `SELECT ${baseFields}
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       ${favJoin}
       WHERE c.name IN ('Self Help', 'Personal Development', 'Psychology', 'Philosophy', 'Health & Fitness')
       ORDER BY b.rating_avg DESC
       LIMIT 10`
    );

    // 10. Science
    const [science] = await query(
      `SELECT ${baseFields}
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       ${favJoin}
       WHERE c.name IN ('Physics', 'Chemistry', 'Biology', 'Mathematics', 'Statistics')
       ORDER BY b.rating_avg DESC
       LIMIT 10`
    );

    // 11. Most Borrowed
    const [mostBorrowed] = await query(
      `SELECT ${baseFields}, COUNT(t.id) as borrow_count
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       LEFT JOIN transactions t ON b.id = t.book_id
       ${favJoin}
       GROUP BY b.id, c.name
       ORDER BY borrow_count DESC, b.created_at DESC
       LIMIT 10`
    );

    // 12. New Arrivals (Latest publication years & additions)
    const [newArrivals] = await query(
      `SELECT ${baseFields}
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       ${favJoin}
       ORDER BY b.publication_year DESC, b.created_at DESC
       LIMIT 10`
    );

    res.status(200).json({
      success: true,
      sections: [
        { id: 'popular', title: '🔥 Popular Books', books: popularBooks },
        { id: 'recent', title: '📚 Recently Added', books: recentlyAdded },
        { id: 'highest_rated', title: '⭐ Highly Rated', books: highlyRated },
        { id: 'academic', title: '🎓 Academic & Textbooks', books: academicTextbooks },
        { id: 'tech', title: '💻 Technology', books: technology },
        { id: 'ai', title: '🤖 AI & Machine Learning', books: aiAndMl },
        { id: 'lit', title: '📖 Literature', books: literature },
        { id: 'biz', title: '📈 Business & Management', books: businessAndManagement },
        { id: 'self_help', title: '🧠 Self Development', books: selfDevelopment },
        { id: 'sci', title: '🔬 Science', books: science },
        { id: 'most_borrowed', title: '🏆 Most Borrowed', books: mostBorrowed },
        { id: 'new_arrivals', title: '🆕 New Arrivals', books: newArrivals }
      ]
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/books/catalog-stats - Admin Catalog Statistics (Section 15)
const getCatalogStats = async (req, res, next) => {
  try {
    const [bookCount] = await query(
      `SELECT 
        COUNT(*) as total_books, 
        COALESCE(SUM(total_copies), 0) as total_copies,
        COALESCE(SUM(available_copies), 0) as available_copies
       FROM books`
    );

    const [issuedCount] = await query(
      "SELECT COUNT(*) as issued_copies FROM transactions WHERE status IN ('ISSUED', 'OVERDUE')"
    );

    const [reservedCount] = await query(
      "SELECT COUNT(*) as reserved_books FROM reservations WHERE status = 'WAITING'"
    );

    const [catCount] = await query('SELECT COUNT(*) as total_categories FROM categories');

    const [mostBorrowed] = await query(
      `SELECT b.id, b.title, b.author, b.isbn, COUNT(t.id) as borrow_count
       FROM books b
       JOIN transactions t ON b.id = t.book_id
       GROUP BY b.id
       ORDER BY borrow_count DESC
       LIMIT 1`
    );

    const [mostActiveCategory] = await query(
      `SELECT c.id, c.name, COUNT(t.id) as borrow_count, COUNT(DISTINCT b.id) as book_count
       FROM categories c
       JOIN books b ON c.id = b.category_id
       LEFT JOIN transactions t ON b.id = t.book_id
       GROUP BY c.id
       ORDER BY borrow_count DESC, book_count DESC
       LIMIT 1`
    );

    const [categoryDistribution] = await query(
      `SELECT c.id, c.name, COUNT(b.id) as count
       FROM categories c
       LEFT JOIN books b ON c.id = b.category_id
       GROUP BY c.id
       HAVING count > 0
       ORDER BY count DESC
       LIMIT 12`
    );

    const [languageDistribution] = await query(
      `SELECT language, COUNT(*) as count 
       FROM books 
       WHERE language IS NOT NULL 
       GROUP BY language 
       ORDER BY count DESC`
    );

    const [formatDistribution] = await query(
      `SELECT book_format, COUNT(*) as count 
       FROM books 
       WHERE book_format IS NOT NULL 
       GROUP BY book_format 
       ORDER BY count DESC`
    );

    const [topBorrowed] = await query(
      `SELECT b.title as name, COUNT(t.id) as borrow_count
       FROM books b
       JOIN transactions t ON b.id = t.book_id
       GROUP BY b.id
       ORDER BY borrow_count DESC
       LIMIT 8`
    );

    // Normalize language distribution for chart (add name field)
    const languageDistributionNormalized = languageDistribution.map(r => ({
      name: r.language,
      count: r.count
    }));

    const formatDistributionNormalized = formatDistribution.map(r => ({
      name: r.book_format,
      count: r.count
    }));

    res.status(200).json({
      success: true,
      stats: {
        totalBooks: bookCount[0].total_books || 0,
        totalCopies: bookCount[0].total_copies || 0,
        availableCopies: bookCount[0].available_copies || 0,
        issuedCopies: issuedCount[0].issued_copies || 0,
        reservedBooks: reservedCount[0].reserved_books || 0,
        categoriesCount: catCount[0].total_categories || 0,
        mostBorrowedBook: mostBorrowed[0] || null,
        mostActiveCategory: mostActiveCategory[0] || null
      },
      charts: {
        categoryDistribution,
        languageDistribution: languageDistributionNormalized,
        formatDistribution: formatDistributionNormalized,
        topBorrowed
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/books - Admin Create Book
const createBook = async (req, res, next) => {
  try {
    const {
      title,
      isbn,
      author,
      publisher,
      publication_year,
      category_id,
      description,
      cover_image,
      total_copies,
      shelf_location,
      language = 'English',
      book_format = 'Paperback',
      pages = 320
    } = req.body;

    if (!title || !isbn || !author || !category_id || total_copies === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Title, ISBN, Author, Category, and Total Copies are required'
      });
    }

    const copies = parseInt(total_copies, 10);
    if (isNaN(copies) || copies < 1) {
      return res.status(400).json({
        success: false,
        message: 'Total copies must be a positive integer'
      });
    }

    // Check ISBN uniqueness
    const [existingIsbn] = await query('SELECT id FROM books WHERE isbn = ?', [isbn.trim()]);
    if (existingIsbn.length > 0) {
      return res.status(409).json({
        success: false,
        message: `A book with ISBN "${isbn.trim()}" already exists`
      });
    }

    // Check category exists
    const [category] = await query('SELECT id FROM categories WHERE id = ?', [category_id]);
    if (category.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Selected category does not exist'
      });
    }

    const [result] = await query(
      `INSERT INTO books 
       (title, isbn, author, publisher, publication_year, category_id, description, 
        cover_image, total_copies, available_copies, shelf_location, language, book_format, pages, rating_avg, rating_count, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 4.50, 0, NOW())`,
      [
        title.trim(),
        isbn.trim(),
        author.trim(),
        publisher ? publisher.trim() : null,
        publication_year ? parseInt(publication_year, 10) : null,
        category_id,
        description ? description.trim() : null,
        cover_image ? cover_image.trim() : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
        copies,
        copies, // Available copies equals total copies initially
        shelf_location ? shelf_location.trim() : 'Block A, Aisle 1, Shelf A1',
        language ? language.trim() : 'English',
        book_format ? book_format.trim() : 'Paperback',
        pages ? parseInt(pages, 10) : 320
      ]
    );

    const [newBook] = await query(
      `SELECT b.*, c.name as category_name 
       FROM books b 
       LEFT JOIN categories c ON b.category_id = c.id 
       WHERE b.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      book: newBook[0]
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/books/bulk - Bulk add books
const bulkCreateBooks = async (req, res, next) => {
  try {
    const { books } = req.body;
    if (!Array.isArray(books) || books.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide a non-empty array of books' });
    }

    let inserted = 0;
    let errors = [];

    for (const b of books) {
      if (!b.title || !b.isbn || !b.author) {
        errors.push(`Skipped row missing title/isbn/author`);
        continue;
      }

      try {
        const [existing] = await query('SELECT id FROM books WHERE isbn = ?', [b.isbn.trim()]);
        if (existing.length > 0) {
          errors.push(`ISBN ${b.isbn} already exists`);
          continue;
        }

        const copies = parseInt(b.total_copies || 4, 10);
        await query(
          `INSERT INTO books 
           (title, isbn, author, publisher, publication_year, category_id, description, 
            cover_image, total_copies, available_copies, shelf_location, language, book_format, pages, rating_avg, rating_count, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 4.5, 0, NOW())`,
          [
            b.title.trim(),
            b.isbn.trim(),
            b.author.trim(),
            b.publisher || 'Academic Press',
            b.publication_year ? parseInt(b.publication_year, 10) : 2024,
            b.category_id || 1,
            b.description || `${b.title} by ${b.author}`,
            b.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
            copies,
            copies,
            b.shelf_location || 'Block A, Aisle 1, Shelf A1',
            b.language || 'English',
            b.book_format || 'Paperback',
            b.pages ? parseInt(b.pages, 10) : 320
          ]
        );
        inserted++;
      } catch (err) {
        errors.push(`Error inserting "${b.title}": ${err.message}`);
      }
    }

    res.status(201).json({
      success: true,
      message: `Bulk import completed: ${inserted} books added successfully.`,
      insertedCount: inserted,
      errors
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/books/:id - Update Book
const updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      isbn,
      author,
      publisher,
      publication_year,
      category_id,
      description,
      cover_image,
      total_copies,
      available_copies,
      shelf_location,
      language,
      book_format,
      pages,
      rating_avg
    } = req.body;

    const [existing] = await query('SELECT * FROM books WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    const currentBook = existing[0];

    // ISBN duplicate check
    if (isbn && isbn.trim() !== currentBook.isbn) {
      const [duplicate] = await query('SELECT id FROM books WHERE isbn = ? AND id != ?', [isbn.trim(), id]);
      if (duplicate.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Another book already has ISBN "${isbn.trim()}"`
        });
      }
    }

    // Handle copies adjustment
    let newTotal = currentBook.total_copies;
    let newAvailable = currentBook.available_copies;

    if (total_copies !== undefined) {
      const parsedTotal = parseInt(total_copies, 10);
      if (isNaN(parsedTotal) || parsedTotal < 1) {
        return res.status(400).json({
          success: false,
          message: 'Total copies must be at least 1'
        });
      }

      // Check active loans
      const [loanCount] = await query(
        `SELECT COUNT(*) as active_loans FROM transactions WHERE book_id = ? AND status = 'ISSUED'`,
        [id]
      );
      const activeLoans = loanCount[0].active_loans;

      if (parsedTotal < activeLoans) {
        return res.status(400).json({
          success: false,
          message: `Cannot reduce total copies below active loans (${activeLoans} currently issued)`
        });
      }

      const diff = parsedTotal - currentBook.total_copies;
      newTotal = parsedTotal;
      newAvailable = Math.max(0, currentBook.available_copies + diff);
    }

    if (available_copies !== undefined) {
      newAvailable = Math.max(0, parseInt(available_copies, 10));
    }

    await query(
      `UPDATE books SET 
        title = COALESCE(?, title),
        isbn = COALESCE(?, isbn),
        author = COALESCE(?, author),
        publisher = COALESCE(?, publisher),
        publication_year = COALESCE(?, publication_year),
        category_id = COALESCE(?, category_id),
        description = COALESCE(?, description),
        cover_image = COALESCE(?, cover_image),
        total_copies = ?,
        available_copies = ?,
        shelf_location = COALESCE(?, shelf_location),
        language = COALESCE(?, language),
        book_format = COALESCE(?, book_format),
        pages = COALESCE(?, pages),
        rating_avg = COALESCE(?, rating_avg),
        updated_at = NOW()
       WHERE id = ?`,
      [
        title ? title.trim() : null,
        isbn ? isbn.trim() : null,
        author ? author.trim() : null,
        publisher ? publisher.trim() : null,
        publication_year ? parseInt(publication_year, 10) : null,
        category_id || null,
        description !== undefined ? description : null,
        cover_image || null,
        newTotal,
        newAvailable,
        shelf_location ? shelf_location.trim() : null,
        language || null,
        book_format || null,
        pages ? parseInt(pages, 10) : null,
        rating_avg ? parseFloat(rating_avg) : null,
        id
      ]
    );

    const [updated] = await query(
      `SELECT b.*, c.name as category_name 
       FROM books b 
       LEFT JOIN categories c ON b.category_id = c.id 
       WHERE b.id = ?`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      book: updated[0]
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/books/:id
const deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check active loans
    const [activeLoans] = await query(
      `SELECT COUNT(*) as count FROM transactions WHERE book_id = ? AND status IN ('ISSUED', 'OVERDUE')`,
      [id]
    );

    if (activeLoans[0].count > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete book while there are ${activeLoans[0].count} active issued copy/copies. Please return them first.`
      });
    }

    const [result] = await query('DELETE FROM books WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/books/:id/qrcode
const getBookQrCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [books] = await query('SELECT id, title, isbn, shelf_location FROM books WHERE id = ?', [id]);
    if (books.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    const book = books[0];
    const qrData = JSON.stringify({
      id: book.id,
      title: book.title,
      isbn: book.isbn,
      shelf: book.shelf_location,
      url: `/books/${book.id}`
    });

    const qrDataUrl = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });
    res.status(200).json({
      success: true,
      qrCodeUrl: qrDataUrl,
      qrDataUrl,
      book
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBooks,
  getBookById,
  getDiscoverySections,
  getCatalogStats,
  createBook,
  bulkCreateBooks,
  updateBook,
  deleteBook,
  getBookQrCode
};
