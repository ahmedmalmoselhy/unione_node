import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

/**
 * PostgreSQL connection pool configuration for unione_db
 * Uses the same database as the Laravel backend
 */
const pool = new pg.Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'unione_db',
  user: process.env.DB_USER || 'unione',
  password: process.env.DB_PASSWORD || '241996',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

/**
 * Query function that uses the connection pool
 * @param {string} text - SQL query
 * @param {array} params - Query parameters
 * @returns {Promise<object>} Query result
 */
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database query error', { text, error });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise<PoolClient>} Database client
 */
export const getClient = async () => {
  return pool.connect();
};

export default pool;
