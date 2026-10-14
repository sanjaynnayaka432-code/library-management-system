const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'library_management',
  multipleStatements: true
};

const CATEGORIES = [
  { name: 'Computer Science', description: 'Foundations of computation, algorithms, data structures and computer systems.' },
  { name: 'Programming', description: 'Practical coding, language idioms, syntax, and developer craft.' },
  { name: 'Software Engineering', description: 'Software design patterns, architectural principles, lifecycle, and methodologies.' },
  { name: 'Artificial Intelligence', description: 'Autonomous agents, cognitive systems, neural computation, and NLP.' },
  { name: 'Machine Learning', description: 'Supervised, unsupervised, statistical learning algorithms and predictive modeling.' },
  { name: 'Deep Learning', description: 'Deep neural networks, transformers, convolutional architectures, and generative AI.' },
  { name: 'Data Science', description: 'Data wrangling, statistical inference, feature engineering, and exploratory analytics.' },
  { name: 'Data Analytics', description: 'Business intelligence, metric visualization, dashboarding, and KPI evaluation.' },
  { name: 'Database Systems', description: 'Relational databases, SQL, NoSQL document stores, transactions, and distributed consensus.' },
  { name: 'Cybersecurity', description: 'Network defense, cryptography, penetration testing, security auditing, and threat analysis.' },
  { name: 'Computer Networks', description: 'OSI protocols, TCP/IP, distributed routing, socket communication, and wireless networks.' },
  { name: 'Cloud Computing', description: 'AWS, Azure, GCP, serverless architecture, multi-tenancy, and cloud native design.' },
  { name: 'DevOps', description: 'CI/CD automation, containerization with Docker, Kubernetes orchestration, and observability.' },
  { name: 'Web Development', description: 'Frontend architectures, modern JavaScript/TypeScript, CSS layouts, and full-stack frameworks.' },
  { name: 'Mobile App Development', description: 'Native and cross-platform mobile development with React Native, Flutter, Swift, and Kotlin.' },
  { name: 'Operating Systems', description: 'Kernel internals, scheduling, memory virtualization, concurrency, and file systems.' },
  { name: 'Computer Architecture', description: 'Processor microarchitecture, memory hierarchies, pipelining, and assembly language.' },
  { name: 'Algorithms & Data Structures', description: 'Complexity theory, graph traversals, dynamic programming, and data structures.' },
  { name: 'Theory of Computation', description: 'Automata theory, computability, Turing machines, P vs NP, and formal languages.' },
  { name: 'Mathematics', description: 'Pure and applied mathematics, calculus, linear algebra, and discrete mathematics.' },
  { name: 'Statistics', description: 'Probability distributions, hypothesis testing, Bayesian inference, and regression analysis.' },
  { name: 'Physics', description: 'Classical mechanics, thermodynamics, quantum physics, electromagnetism, and relativity.' },
  { name: 'Chemistry', description: 'Organic synthesis, inorganic chemistry, physical chemistry, and molecular dynamics.' },
  { name: 'Biology', description: 'Molecular biology, genetics, evolutionary biology, cellular biology, and biotechnology.' },
  { name: 'Engineering', description: 'General engineering principles, systems engineering, modeling, and physical design.' },
  { name: 'Electronics', description: 'Semiconductor devices, analog/digital circuits, signal processing, and embedded hardware.' },
  { name: 'Mechanical Engineering', description: 'Thermodynamics, fluid mechanics, kinematics, machine design, and manufacturing.' },
  { name: 'Civil Engineering', description: 'Structural analysis, geotechnical engineering, environmental engineering, and surveying.' },
  { name: 'Electrical Engineering', description: 'Power systems, electrical machinery, high-voltage engineering, and control systems.' },
  { name: 'Business', description: 'Corporate strategy, enterprise operations, organizational dynamics, and trade.' },
  { name: 'Management', description: 'Leadership principles, project management, agile workflows, and organizational behavior.' },
  { name: 'Finance', description: 'Corporate finance, investment analysis, portfolio theory, banking, and capital markets.' },
  { name: 'Economics', description: 'Macroeconomics, microeconomics, game theory, behavioral economics, and fiscal policy.' },
  { name: 'Accounting', description: 'Financial accounting, managerial accounting, auditing, and tax compliance.' },
  { name: 'Entrepreneurship', description: 'Startup incubation, venture creation, pitch strategy, and growth modeling.' },
  { name: 'Marketing', description: 'Brand management, digital marketing, consumer psychology, and market research.' },
  { name: 'Psychology', description: 'Cognitive psychology, behavioral science, social psychology, and clinical neuroscience.' },
  { name: 'Philosophy', description: 'Epistemology, ethics, metaphysics, logic, existentialism, and Eastern philosophy.' },
  { name: 'Sociology', description: 'Social institutions, cultural anthropology, stratification, and social movements.' },
  { name: 'History', description: 'World history, civilizations, industrial revolutions, and political movements.' },
  { name: 'Geography', description: 'Physical geography, GIS mapping, geopolitical boundaries, and climatology.' },
  { name: 'Political Science', description: 'Comparative politics, governance, constitutional theory, and international relations.' },
  { name: 'Law', description: 'Jurisprudence, constitutional law, intellectual property, contract law, and cyber law.' },
  { name: 'Literature', description: 'World literature, literary criticism, modern and post-modern novels, and poetry.' },
  { name: 'English Literature', description: 'Classic British, American, and Commonwealth prose, drama, and anthologies.' },
  { name: 'Indian Literature', description: 'Contemporary and classical Indian fiction, essays, and regional translations.' },
  { name: 'Kannada Literature', description: 'Celebrated classic and modern Kannada novels, poetry, and folk literature.' },
  { name: 'Hindi Literature', description: 'Classic and modern Hindi fiction, drama, poetry, and literary anthologies.' },
  { name: 'Science Fiction', description: 'Speculative fiction, cybernetics, space operas, time travel, and futuristic tech.' },
  { name: 'Fantasy', description: 'High fantasy, mythological worldbuilding, magic realism, and legendary sagas.' },
  { name: 'Mystery & Thriller', description: 'Detective fiction, psychological thrillers, suspense, crime, and investigative novels.' },
  { name: 'Romance', description: 'Contemporary, historical, and dramatic romantic literature and relationship novels.' },
  { name: 'Biography', description: 'Authoritative life accounts of historical icons, scientists, and world leaders.' },
  { name: 'Autobiography', description: 'First-person memoirs, personal reflections, and introspective life stories.' },
  { name: 'Self Help', description: 'Habit building, productivity systems, mindset shifts, and resilience techniques.' },
  { name: 'Personal Development', description: 'Communication skills, emotional intelligence, leadership development, and career growth.' },
  { name: 'Health & Fitness', description: 'Nutrition science, exercise physiology, mental wellness, and preventative health.' },
  { name: "Children's Books", description: 'Illustrated stories, educational literature, folklore, and young adult adventures.' },
  { name: 'Competitive Exams', description: 'Preparation materials for UPSC, GATE, GRE, CAT, banking, and civil services.' },
  { name: 'Reference', description: 'Encyclopedias, handbooks, comprehensive compendiums, and technical standards.' },
  { name: 'General Knowledge', description: 'Yearbooks, almanacs, trivia, contemporary affairs, and quiz compendiums.' },
  { name: 'Newspapers & Magazines', description: 'Periodicals, research journals, academic bulletins, and quarterly reviews.' }
];

const COVERS = [
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1507842229452-646738580b33?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?auto=format&fit=crop&q=80&w=600'
];

async function run() {
  console.log('Connecting to MySQL...');
  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log('1. Checking and updating books schema...');
    
    // Check columns in books
    const [cols] = await connection.query("SHOW COLUMNS FROM books LIKE 'language'");
    if (cols.length === 0) {
      console.log('Adding column: language');
      await connection.query("ALTER TABLE books ADD COLUMN language VARCHAR(50) DEFAULT 'English'");
    }

    const [formatCols] = await connection.query("SHOW COLUMNS FROM books LIKE 'book_format'");
    if (formatCols.length === 0) {
      console.log('Adding column: book_format');
      await connection.query("ALTER TABLE books ADD COLUMN book_format VARCHAR(50) DEFAULT 'Paperback'");
    }

    const [ratingAvgCols] = await connection.query("SHOW COLUMNS FROM books LIKE 'rating_avg'");
    if (ratingAvgCols.length === 0) {
      console.log('Adding column: rating_avg');
      await connection.query("ALTER TABLE books ADD COLUMN rating_avg DECIMAL(3,2) DEFAULT 4.50");
    }

    const [ratingCountCols] = await connection.query("SHOW COLUMNS FROM books LIKE 'rating_count'");
    if (ratingCountCols.length === 0) {
      console.log('Adding column: rating_count');
      await connection.query("ALTER TABLE books ADD COLUMN rating_count INT DEFAULT 10");
    }

    const [pagesCols] = await connection.query("SHOW COLUMNS FROM books LIKE 'pages'");
    if (pagesCols.length === 0) {
      console.log('Adding column: pages');
      await connection.query("ALTER TABLE books ADD COLUMN pages INT DEFAULT 350");
    }

    console.log('2. Creating favorites table if not exists...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        book_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_book_fav (user_id, book_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
        INDEX idx_fav_user (user_id),
        INDEX idx_fav_book (book_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('3. Creating reviews table if not exists...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        book_id INT NOT NULL,
        rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        review_text TEXT DEFAULT NULL,
        status ENUM('APPROVED', 'PENDING', 'REJECTED') DEFAULT 'APPROVED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_book_review (user_id, book_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
        INDEX idx_review_book (book_id),
        INDEX idx_review_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('4. Syncing categories...');
    for (const cat of CATEGORIES) {
      await connection.query(
        `INSERT INTO categories (name, description) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE description = VALUES(description)`,
        [cat.name, cat.description]
      );
    }

    // Fetch all categories into a name -> id map
    const [catRows] = await connection.query('SELECT id, name FROM categories');
    const catMap = {};
    for (const row of catRows) {
      catMap[row.name] = row.id;
    }

    // Read the master book dataset
    const booksData = require('./bookDataset.js');
    console.log(`5. Inserting/Updating ${booksData.length} master books...`);

    let inserted = 0;
    let updated = 0;

    for (let i = 0; i < booksData.length; i++) {
      const b = booksData[i];
      const catId = catMap[b.category] || catMap['Computer Science'] || 1;
      const coverUrl = b.cover_image || COVERS[i % COVERS.length];

      const [existing] = await connection.query('SELECT id FROM books WHERE isbn = ?', [b.isbn]);
      if (existing.length === 0) {
        await connection.query(
          `INSERT INTO books 
           (title, isbn, author, publisher, publication_year, category_id, description, 
            cover_image, total_copies, available_copies, shelf_location, language, book_format, 
            pages, rating_avg, rating_count)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            b.title,
            b.isbn,
            b.author,
            b.publisher || 'Academic Press',
            b.publication_year || 2020,
            catId,
            b.description || `${b.title} by ${b.author}. Authoritative library edition.`,
            coverUrl,
            b.total_copies || 4,
            b.available_copies !== undefined ? b.available_copies : 4,
            b.shelf_location || `Block A, Aisle ${(i % 6) + 1}, Shelf ${(i % 5) + 1}`,
            b.language || 'English',
            b.book_format || 'Paperback',
            b.pages || 350,
            b.rating_avg || 4.5,
            b.rating_count || 12
          ]
        );
        inserted++;
      } else {
        // Update metadata
        await connection.query(
          `UPDATE books SET 
            title = ?, author = ?, publisher = ?, publication_year = ?, category_id = ?, 
            description = ?, cover_image = ?, shelf_location = ?, language = ?, 
            book_format = ?, pages = ?, rating_avg = ?, rating_count = ?
           WHERE id = ?`,
          [
            b.title,
            b.author,
            b.publisher || 'Academic Press',
            b.publication_year || 2020,
            catId,
            b.description,
            coverUrl,
            b.shelf_location || `Block A, Aisle ${(i % 6) + 1}, Shelf ${(i % 5) + 1}`,
            b.language || 'English',
            b.book_format || 'Paperback',
            b.pages || 350,
            b.rating_avg || 4.5,
            b.rating_count || 12,
            existing[0].id
          ]
        );
        updated++;
      }
    }

    console.log(`Master books synced: ${inserted} inserted, ${updated} updated.`);

    // Seed some initial reviews from student users
    const [users] = await connection.query("SELECT id, name FROM users WHERE role = 'STUDENT' LIMIT 5");
    const [books] = await connection.query('SELECT id, title FROM books LIMIT 15');

    if (users.length > 0 && books.length > 0) {
      console.log('6. Seeding realistic student book reviews...');
      const sampleReviews = [
        { rating: 5, text: 'Essential reading! Clear explanations and incredible depth for academic research.' },
        { rating: 5, text: 'One of the best books I have ever borrowed from this library. Highly recommended!' },
        { rating: 4, text: 'Very thorough and well structured. Great companion for coursework and exam prep.' },
        { rating: 4, text: 'Concise and practical. The examples are modern and easy to comprehend.' },
        { rating: 5, text: 'An absolute masterpiece of the discipline. Keep this on your reference desk.' }
      ];

      for (let i = 0; i < Math.min(books.length, 12); i++) {
        const u = users[i % users.length];
        const b = books[i];
        const r = sampleReviews[i % sampleReviews.length];
        await connection.query(
          `INSERT INTO reviews (user_id, book_id, rating, review_text, status)
           VALUES (?, ?, ?, ?, 'APPROVED')
           ON DUPLICATE KEY UPDATE rating = VALUES(rating), review_text = VALUES(review_text)`,
          [u.id, b.id, r.rating, r.text]
        );
      }
      console.log('Reviews seeded successfully.');
    }

    // Seed student favorites
    if (users.length > 0 && books.length > 0) {
      console.log('7. Seeding sample student favorites...');
      for (let i = 0; i < 6; i++) {
        await connection.query(
          `INSERT INTO favorites (user_id, book_id)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE created_at = NOW()`,
          [users[0].id, books[i].id]
        );
      }
      console.log('Favorites seeded successfully.');
    }

    const [totalBooks] = await connection.query('SELECT COUNT(*) as count FROM books');
    const [totalCats] = await connection.query('SELECT COUNT(*) as count FROM categories');
    console.log(`\n🎉 Success! Library now has ${totalBooks[0].count} books across ${totalCats[0].count} categories.`);

  } catch (err) {
    console.error('Error in expandCatalog:', err);
    throw err;
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  run().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { run };
