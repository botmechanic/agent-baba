import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CONFIG } from '../src/config';

async function initializeDatabase() {
  const pool = new Pool(CONFIG.DATABASE);
  
  try {
    // Read schema file
    const schema = readFileSync(
      join(__dirname, '../src/db/schema.sql'),
      'utf-8'
    );
    
    // Execute schema
    await pool.query(schema);
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

initializeDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));