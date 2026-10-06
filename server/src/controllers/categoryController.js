const { query } = require('../config/db');

// GET /api/categories
const getAllCategories = async (req, res, next) => {
  try {
    const { search = '' } = req.query;

    let whereClause = '';
    let params = [];
    if (search.trim()) {
      whereClause = 'WHERE c.name LIKE ? OR c.description LIKE ?';
      const term = `%${search.trim()}%`;
      params = [term, term];
    }

    const [categories] = await query(
      `SELECT 
        c.id, c.name, c.description, c.created_at,
        COUNT(b.id) as book_count
       FROM categories c
       LEFT JOIN books b ON c.id = b.category_id
       ${whereClause}
       GROUP BY c.id
       ORDER BY c.name ASC`,
      params
    );

    res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/categories
const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    const [existing] = await query('SELECT id FROM categories WHERE name = ?', [name.trim()]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Category "${name.trim()}" already exists`
      });
    }

    const [result] = await query(
      'INSERT INTO categories (name, description, created_at) VALUES (?, ?, NOW())',
      [name.trim(), description ? description.trim() : null]
    );

    const [newCat] = await query(
      `SELECT c.*, 0 as book_count FROM categories c WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: newCat[0]
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/categories/:id
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Check duplicate
    const [duplicate] = await query('SELECT id FROM categories WHERE name = ? AND id != ?', [name.trim(), id]);
    if (duplicate.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Another category with name "${name.trim()}" already exists`
      });
    }

    const [result] = await query(
      'UPDATE categories SET name = ?, description = ? WHERE id = ?',
      [name.trim(), description !== undefined ? description.trim() : null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const [updated] = await query(
      `SELECT c.*, COUNT(b.id) as book_count 
       FROM categories c 
       LEFT JOIN books b ON c.id = b.category_id 
       WHERE c.id = ? GROUP BY c.id`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      category: updated[0]
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/categories/:id
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if books are assigned
    const [bookCount] = await query('SELECT COUNT(*) as count FROM books WHERE category_id = ?', [id]);
    if (bookCount[0].count > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete category because it contains ${bookCount[0].count} book(s). Please reassign or delete these books first.`
      });
    }

    const [result] = await query('DELETE FROM categories WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
