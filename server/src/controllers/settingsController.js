const { query } = require('../config/db');

// GET /api/settings
const getSettings = async (req, res, next) => {
  try {
    const [settings] = await query('SELECT * FROM settings');
    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.setting_key] = s.setting_value;
    });

    res.status(200).json({
      success: true,
      settings: settingsMap,
      details: settings
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/settings
const updateSettings = async (req, res, next) => {
  try {
    const { borrowing_period_days, fine_rate_per_day, max_books_per_student } = req.body;

    if (borrowing_period_days !== undefined) {
      await query(
        `INSERT INTO settings (setting_key, setting_value, description)
         VALUES ('borrowing_period_days', ?, 'Default loan period in days')
         ON DUPLICATE KEY UPDATE setting_value = ?`,
        [String(borrowing_period_days), String(borrowing_period_days)]
      );
    }

    if (fine_rate_per_day !== undefined) {
      await query(
        `INSERT INTO settings (setting_key, setting_value, description)
         VALUES ('fine_rate_per_day', ?, 'Fine amount per overdue day in INR')
         ON DUPLICATE KEY UPDATE setting_value = ?`,
        [String(fine_rate_per_day), String(fine_rate_per_day)]
      );
    }

    if (max_books_per_student !== undefined) {
      await query(
        `INSERT INTO settings (setting_key, setting_value, description)
         VALUES ('max_books_per_student', ?, 'Maximum simultaneous books allowed per student')
         ON DUPLICATE KEY UPDATE setting_value = ?`,
        [String(max_books_per_student), String(max_books_per_student)]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Library configuration updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings
};
