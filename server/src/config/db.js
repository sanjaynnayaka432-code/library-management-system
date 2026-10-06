const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'library_management',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  decimalNumbers: true
};

let pool = null;

const getPool = () => {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
};

// Test and initialize connection
const initDatabase = async () => {
  try {
    const testPool = getPool();
    const connection = await testPool.getConnection();
    console.log(`[Database] Successfully connected to MySQL database: ${dbConfig.database}`);
    
    // Auto-update overdue transactions on startup
    try {
      const today = new Date().toISOString().split('T')[0];
      await connection.query(
        `UPDATE transactions 
         SET status = 'OVERDUE' 
         WHERE status = 'ISSUED' AND due_date < ?`,
        [today]
      );
    } catch (e) {
      console.warn('[Database] Overdue check warning:', e.message);
    }

    connection.release();
    return true;
  } catch (err) {
    console.error('[Database] Connection failed:', err.message);
    // If database does not exist, attempt to create it and load schema
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.log(`[Database] Database ${dbConfig.database} not found. Attempting to create it...`);
      try {
        const rootConn = await mysql.createConnection({
          host: dbConfig.host,
          port: dbConfig.port,
          user: dbConfig.user,
          password: dbConfig.password,
          multipleStatements: true
        });
        const schemaPath = path.join(__dirname, '../../../database/schema.sql');
        if (fs.existsSync(schemaPath)) {
          const sql = fs.readFileSync(schemaPath, 'utf8');
          await rootConn.query(sql);
          console.log('[Database] Database and schema created successfully!');
          await rootConn.end();
          return true;
        }
      } catch (createErr) {
        console.error('[Database] Failed to auto-create database:', createErr.message);
      }
    }
    return false;
  }
};

module.exports = {
  getPool,
  query: (sql, params) => getPool().query(sql, params),
  initDatabase
};
