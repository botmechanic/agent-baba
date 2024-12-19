import { dbService } from '../src/services/database';
import { SCHEMA } from '../src/db/schema';

async function initializeDatabase() {
  try {
    console.log('Testing database connection...');
    const testResult = await dbService.query('SELECT NOW() as time', []);
    console.log('Connected to database at:', testResult.rows[0].time);

    console.log('\nExecuting schema...');
    await dbService.query(SCHEMA, []);
    console.log('Schema executed successfully');

    // Verify setup
    const tables = await dbService.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `, []);
    console.log('\nCreated tables:', tables.rows.map(r => r.table_name));

  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  } finally {
    await dbService.close();
  }
}

initializeDatabase();