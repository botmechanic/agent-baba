// scripts/check-db.ts
import { dbService } from '../src/services/database';

async function checkDatabase() {
  try {
    console.log('Checking database state...');

    // Check if tables exist
    const tables = await dbService.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `, []);
    console.log('\nTables:', tables.rows.map(r => r.table_name));

    // Check if functions exist
    const functions = await dbService.query(`
      SELECT routine_name, routine_type
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
    `, []);
    console.log('\nFunctions:', functions.rows.map(r => r.routine_name));

    // Check if type exists
    const types = await dbService.query(`
      SELECT typname
      FROM pg_type 
      WHERE typname = 'trade_status'
    `, []);
    console.log('\nTypes:', types.rows.map(r => r.typname));

  } catch (error) {
    console.error('Database check failed:', error);
  } finally {
    await dbService.close();
  }
}

checkDatabase();