const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const seedDatabase = async () => {
  console.log('[Seed] Starting database migration & seed...');
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'library_management';

  try {
    const conn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    });

    const schemaPath = path.join(__dirname, '../../../database/schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }

    const sql = fs.readFileSync(schemaPath, 'utf8');
    console.log('[Seed] Executing schema.sql script...');
    await conn.query(sql);

    console.log('✅ [Seed] Database tables created and realistic seed data inserted successfully!');
    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ [Seed] Error seeding database:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
