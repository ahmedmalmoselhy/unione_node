# UniOne Backend - Node.js Implementation

A Node.js backend implementation of the UniOne platform, using the same PostgreSQL database as the Laravel backend.

## Prerequisites

- Node.js 18.x or higher
- PostgreSQL 12.x or higher
- npm or yarn

## Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Configure environment variables by creating a `.env` file:

```bash
cp .env.example .env
```

3. Update `.env` with your database credentials (already configured for unione_db):

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=unione_db
DB_USER=unione
DB_PASSWORD=241996
```

## Database Connection

The project uses **PostgreSQL** as the database, configured to connect to the same database as the Laravel backend (`unione_db`).

Database configuration is managed through:
- `src/config/database.js` - Connection pooling and Knex configuration
- Environment variables in `.env` file

## Project Structure

```
unione_node/
├── src/
│   ├── config/          # Configuration files
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── controllers/     # Business logic
│   ├── models/          # Database models
│   ├── services/        # Business services
│   ├── utils/           # Utility functions
│   ├── validators/      # Input validation schemas
│   └── server.js        # Entry point
├── tests/               # Test files
├── .env                 # Environment variables
├── .env.example         # Example environment file
├── package.json         # Dependencies
└── README.md           # This file
```

## Available Scripts

- `npm start` - Run the production server
- `npm run dev` - Run the development server with live reload
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Lint the code
- `npm run lint:fix` - Fix linting issues

## Development

Start the development server:

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Database Migrations

Migrations are managed using Knex.js. To create and run migrations:

```bash
# Create a new migration
npx knex migrate:make migration_name

# Run migrations
npx knex migrate:latest

# Rollback migrations
npx knex migrate:rollback
```

## API Documentation

API routes are organized in `src/routes/`. Each route file documents its endpoints.

## Contributing

Please follow the code style and structure conventions established in the project.

## License

ISC
