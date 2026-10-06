const { query } = require('../config/db');

const createNotification = async (userId, title, message, type = 'INFO') => {
  try {
    const [result] = await query(
      `INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
       VALUES (?, ?, ?, ?, FALSE, NOW())`,
      [userId, title, message, type]
    );
    return result.insertId;
  } catch (error) {
    console.error('[NotificationService] Failed to create notification:', error.message);
    return null;
  }
};

const notifyAllAdmins = async (title, message, type = 'INFO') => {
  try {
    const [admins] = await query('SELECT id FROM users WHERE role = "ADMIN"');
    for (const admin of admins) {
      await createNotification(admin.id, title, message, type);
    }
  } catch (error) {
    console.error('[NotificationService] Failed to notify admins:', error.message);
  }
};

module.exports = {
  createNotification,
  notifyAllAdmins
};
