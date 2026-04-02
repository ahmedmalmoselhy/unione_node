# UniOne Platform - Full-Stack Implementation

A complete academic management system with **Node.js backend** and **React frontend**, using the same PostgreSQL database as the original Laravel backend.

## 🎯 Project Overview

UniOne is a comprehensive university management platform featuring:

- **Student Portal**: Course enrollment, grades, transcripts, attendance tracking
- **Professor Portal**: Grade submission, attendance management, announcements
- **Admin Portal**: System management, webhooks, audit logs
- **Multi-tier Organization**: Universities → Faculties → Departments
- **6 User Roles**: Admin, Faculty Admin, Department Admin, Professor, Student, Employee
- **Advanced Features**: PDF transcripts, iCal schedules, real-time notifications, webhooks

### Technology Stack

**Backend**: Node.js + Express.js + PostgreSQL  
**Frontend**: React 18+ + Tailwind CSS + Redux Toolkit  
**Database**: PostgreSQL (same as Laravel backend)

## 📚 Documentation

**New to the project?** Start here:

1. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** ⚡ - **PRINT THIS!** Common commands, database info, API endpoints, quick answers
2. **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** 📑 - **READ THIS NEXT** - Complete guide to all documentation by role

For detailed information:

| Document | Purpose |
| ---------- | --------- |
| [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) | 📊 Complete project summary, architecture, timeline |
| [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) | 🎯 Detailed 8-phase implementation + UI specification |
| [FRONTEND_GUIDE.md](./FRONTEND_GUIDE.md) | ⚛️ React development guide, patterns, components |
| [API_ENDPOINTS.md](./API_ENDPOINTS.md) | 🔌 All 52+ endpoints documented |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | 🗄️ All 34 tables with relationships |
| [FEATURES_REFERENCE.md](./FEATURES_REFERENCE.md) | ✨ Feature matrix, roles, capabilities |
| [DEPENDENCIES_SETUP.md](./DEPENDENCIES_SETUP.md) | 📦 Backend dependencies installed |

**3,280+ lines of documentation** covering entire project specification.

## ⚡ Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **PostgreSQL** 12.x or higher
- **npm** or yarn package manager

### Backend Setup

```bash
# 1. Install dependencies (already done)
npm install

# 2. Configure environment (already configured for unione_db)
cp .env.example .env

# 3. Run migrations (when ready)
npx knex migrate:latest

# 4. Start development server
npm run dev
```

Server will be available at `http://localhost:3000`

### Frontend Setup (When Ready)

```bash
# Create React project
npm create vite@latest unione_frontend -- --template react-ts

# Install dependencies
cd unione_frontend
npm install

# Install UI libraries
npm install -D tailwindcss postcss autoprefixer
npm install @reduxjs/toolkit react-redux @tanstack/react-query
npm install // ... more packages

# Start dev server
npm run dev
```

Frontend will be available at `http://localhost:5173`

## 🏗️ Project Structure

### Backend

```bash
unione_node/
├── src/
│   ├── config/          # Database, Knex config
│   ├── middleware/      # Auth, validation, error handling
│   ├── models/          # 27 database models
│   ├── routes/          # API routes (52+ endpoints)
│   ├── controllers/     # Business logic
│   ├── services/        # GPA, Auth, Enrollment services
│   ├── utils/           # Helpers, validators, JWT
│   ├── validators/      # Input schemas (Joi)
│   ├── jobs/            # Async job queues
│   └── server.js        # Express entry point
├── migrations/          # Database migrations (34 tables)
├── seeds/               # Database seeders
└── tests/               # Unit & integration tests
```

### Frontend (To be created)

```bash
unione_frontend/
├── src/
│   ├── components/      # 120+ React components
│   ├── pages/           # Page-level components
│   ├── hooks/           # Custom React hooks
│   ├── store/           # Redux slices
│   ├── services/        # API service methods
│   ├── utils/           # Helper functions
│   ├── types/           # TypeScript definitions
│   └── styles/          # Tailwind CSS
├── tests/               # Component & E2E tests
└── public/              # Static assets
```

## 🚀 Available Scripts

### Backend Commands

```bash
npm start               # Production server
npm run dev            # Development with auto-reload
npm test               # Run tests
npm run test:watch    # Tests in watch mode
npm run lint           # Lint code
npm run lint:fix       # Auto-fix linting
```

### Database Commands

```bash
npx knex migrate:make  # Create migration
npx knex migrate:latest # Run migrations
npx knex migrate:rollback # Revert migrations
npx knex seed:make     # Create seeder
npx knex seed:run      # Run seeders
```

### Configuration Files

- `src/config/database.js` - PostgreSQL connection pooling
- `src/config/knex.js` - Knex query builder setup
- `.env` - Environment variables

### Creating Migrations

```bash
# Create migration file
npx knex migrate:make create_users_table

# Generated file (migrations/):
# 20260330_create_users_table.js

# Edit file with schema:
exports.up = function(knex) {
  return knex.schema.createTable('users', (table) => {
    table.increments('id');
    table.string('email').unique();
    table.string('password');
    table.timestamps();
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};

# Run migration
npx knex migrate:latest
```

## 🔐 Authentication

### Login Endpoint

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

### Response

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "roles": ["student"],
    "name": "John Doe"
  }
}
```

### Using Token

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/student/profile
```

## 📊 API Overview

### Public Routes (3 endpoints)

```bash
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Protected Routes (49+ endpoints)

```bash
Student:    /api/student/*         (15 endpoints)
Professor:  /api/professor/*       (13 endpoints)
Admin:      /api/admin/*           (5 endpoints)
Shared:     /api/announcements, /api/notifications (8 endpoints)
```

See [API_ENDPOINTS.md](./API_ENDPOINTS.md) for complete documentation.

## 🧪 Testing

### Run Tests

```bash
npm test                 # All tests once
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

### Test Structure

```bash
tests/
├── unit/                # Component/function tests
├── integration/         # API endpoint tests
└── fixtures/           # Test data
```

## 🐳 Docker Deployment

### Build Image

```bash
docker build -t unione-backend .
```

### Run Container

```bash
docker run -p 3000:3000 \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  unione-backend
```

### Docker Compose

```bash
docker-compose up -d
```

## 📈 Project Timeline

| Week | Focus |
| ------ | ------- |
| 1 | Foundation (Auth, Models, React setup) |
| 2 | Student Portal Core |
| 3 | Academic Records |
| 4 | Professor Portal |
| 5 | Communication & Webhooks |
| 6 | Admin & Advanced Features |
| 7 | Integration & Polish |
| 8 | Testing & Deployment |

**Total**: 7-8 weeks (parallel backend + frontend)

## 🆘 Troubleshooting

### Database Connection Failed

```bash
# Check PostgreSQL is running
psql -U unione -d unione_db

# Update .env with correct credentials
# Restart server
npm run dev
```

### API 401 Unauthorized

```bash
# Token expired or invalid
# Get new token:
curl -X POST http://localhost:3000/api/auth/login
```

### Port Already in Use

```bash
# Change port in .env or kill process
lsof -i :3000
kill -9 <PID>
```

## 📝 Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000

# Database (PostgreSQL)
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=unione_db
DB_USER=unione
DB_PASSWORD=241996

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Mail
MAIL_HOST=localhost
MAIL_PORT=1025

# Logging
LOG_LEVEL=debug
```

## 🤝 Contributing

1. Follow the code structure conventions
2. Write tests for new features
3. Update documentation
4. Reference issues in commits

## ✅ Implementation Status

- ✅ Backend dependencies installed
- ✅ Database configured
- ✅ Server scaffold ready
- ⏳ Phase 1: Authentication system (in progress)
- ⏳ Phase 2-8: Features (queued)
- ⏳ Frontend: React project scaffold (coming)

## 📞 Support Resources

- [Node.js Documentation](https://nodejs.org/docs)
- [Express.js Guide](https://expressjs.com)
- [Knex.js Documentation](https://knexjs.org)
- [PostgreSQL Docs](https://www.postgresql.org/docs)
- [React Documentation](https://react.dev)

## 📄 License

ISC
