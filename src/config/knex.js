import knex from 'knex';
import dotenv from 'dotenv';

dotenv.config();

const knexConfig = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'unione_db',
    user: process.env.DB_USER || 'unione',
    password: process.env.DB_PASSWORD || '241996',
  },
  migrations: {
    directory: './migrations',
    extension: 'js',
  },
  seeds: {
    directory: './seeds',
    extension: 'js',
  },
  pool: {
    min: 2,
    max: 10,
  },
};

const db = knex(knexConfig);

export default db;
