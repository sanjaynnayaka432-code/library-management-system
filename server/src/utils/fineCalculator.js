const { query } = require('../config/db');

const getSetting = async (key, defaultValue) => {
  try {
    const [rows] = await query('SELECT setting_value FROM settings WHERE setting_key = ?', [key]);
    if (rows.length > 0) {
      return rows[0].setting_value;
    }
  } catch (err) {
    console.warn(`[Settings] Failed to fetch setting ${key}:`, err.message);
  }
  return defaultValue;
};

const calculateFine = async (dueDate, returnDate = new Date()) => {
  const rateStr = await getSetting('fine_rate_per_day', '5.00');
  const fineRate = parseFloat(rateStr) || 5.0;

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const ret = new Date(returnDate);
  ret.setHours(0, 0, 0, 0);

  const diffTime = ret.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return {
      isOverdue: true,
      lateDays: diffDays,
      fineRate,
      amount: parseFloat((diffDays * fineRate).toFixed(2))
    };
  }

  return {
    isOverdue: false,
    lateDays: 0,
    fineRate,
    amount: 0.00
  };
};

module.exports = {
  getSetting,
  calculateFine
};
