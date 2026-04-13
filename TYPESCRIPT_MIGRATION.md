# TypeScript Migration Guide

This document provides instructions for gradually migrating the UniOne Node.js backend from JavaScript to TypeScript.

---

## 🎯 Migration Strategy

We're using a **gradual migration** approach. The codebase supports both `.js` and `.ts` files simultaneously, allowing you to migrate one file at a time without breaking the application.

---

## ✅ What's Already Set Up

1. **TypeScript Configuration** (`tsconfig.json`)
   - Supports both `.js` and `.ts` files
   - Strict mode enabled
   - ESM module support
   - Path aliases (`@/*` maps to `src/*`)

2. **Type Definitions** (`src/types/index.d.ts`)
   - All major models typed (User, Student, Professor, etc.)
   - Request/Response interfaces
   - Common utility types

3. **Type Dependencies Installed**
   - `@types/node`
   - `@types/express`
   - `@types/bcryptjs`
   - `@types/jsonwebtoken`
   - `@types/multer`
   - `@types/cors`
   - `@types/morgan`

---

## 📝 How to Migrate a File

### Step 1: Rename the file
```bash
mv src/services/exampleService.js src/services/exampleService.ts
```

### Step 2: Add type annotations
```typescript
// Before (JavaScript)
export async function getUser(id) {
  return await db('users').where('id', id).first();
}

// After (TypeScript)
import { User } from '../types/index.d.ts';

export async function getUser(id: number): Promise<User | undefined> {
  return await db('users').where('id', id).first();
}
```

### Step 3: Update imports
```typescript
// Before
import db from '../config/knex.js';

// After (keep .js for now, will be removed later)
import db from '../config/knex.js';
import { User } from '../types/index.d.ts';
```

### Step 4: Run type check
```bash
npm run type-check
```

---

## 🚀 Migration Priority Order

### Phase 1: Types & Interfaces (Day 1)
- [x] Define all model interfaces (`src/types/index.d.ts`)
- [x] Define request/response types
- [ ] Add custom type guards

### Phase 2: Services (Days 2-5)
Priority order (easiest to hardest):
1. `src/services/cacheService.js` ✅ Already has good structure
2. `src/services/healthService.js`
3. `src/services/emailDeliveryService.js`
4. `src/services/bulkOperationService.js`
5. `src/services/dataPrivacyService.js`
6. `src/services/advancedAnalyticsService.js`

### Phase 3: Controllers (Days 6-10)
1. `src/controllers/healthController.js`
2. `src/controllers/cacheController.js`
3. `src/controllers/avatarController.js`
4. `src/controllers/monitoringController.js`
5. Other controllers...

### Phase 4: Middleware (Days 11-12)
1. `src/middleware/upload.js`
2. `src/middleware/cache.js`
3. `src/middleware/authenticate.js`
4. `src/middleware/authorize.js`

### Phase 5: Routes & Config (Days 13-14)
1. Route files
2. Config files
3. Server entry point

---

## 🔧 NPM Scripts

```bash
# Type check without compiling
npm run type-check

# Build TypeScript to JavaScript
npm run build

# Build and watch for changes
npm run build:watch

# Run with ts-node (development)
npm run dev:ts
```

---

## 📊 Migration Progress Tracker

| Category | Total Files | Migrated | Percentage |
|----------|-------------|----------|------------|
| **Types** | 1 | 1 | 100% |
| **Services** | 15 | 0 | 0% |
| **Controllers** | 25 | 0 | 0% |
| **Middleware** | 8 | 0 | 0% |
| **Routes** | 25 | 0 | 0% |
| **Config** | 5 | 0 | 0% |
| **Total** | **79** | **1** | **1.3%** |

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Cannot find module"
**Solution**: Add `.js` extension to imports temporarily
```typescript
import db from '../config/knex.js'; // Keep .js for now
```

### Issue 2: "Implicit any type"
**Solution**: Add explicit type annotation
```typescript
// Before
const result = await db('users').first();

// After
const result: User | undefined = await db('users').first();
```

### Issue 3: "Module has no default export"
**Solution**: Check if the module exports correctly
```typescript
// If the JS file uses `export default`
import something from './module.js'; // ✅

// If the JS file uses `module.exports`
import * as something from './module.js'; // ✅
```

---

## 🎯 Migration Checklist Per File

- [ ] Rename `.js` to `.ts`
- [ ] Add type imports from `src/types/index.d.ts`
- [ ] Type function parameters
- [ ] Type function return values
- [ ] Type variables where needed
- [ ] Run `npm run type-check`
- [ ] Fix any type errors
- [ ] Test the functionality
- [ ] Commit changes

---

## 📝 Example Migration

### Before: `src/services/exampleService.js`
```javascript
import db from '../config/knex.js';

export async function getUser(id) {
  return await db('users').where('id', id).first();
}

export default {
  getUser,
};
```

### After: `src/services/exampleService.ts`
```typescript
import db from '../config/knex.js';
import { User } from '../types/index.d.ts';

export async function getUser(id: number): Promise<User | undefined> {
  return await db('users').where('id', id).first() as User | undefined;
}

export default {
  getUser,
};
```

---

## 🚀 Future: Full TypeScript

Once all files are migrated:

1. Update `package.json`:
   ```json
   {
     "main": "dist/server.js",
     "scripts": {
       "build": "tsc",
       "start": "node dist/server.js"
     }
   }
   ```

2. Update `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "allowJs": false,
       "checkJs": false
     }
   }
   ```

3. Remove all `.js` files

---

**Last Updated**: April 12, 2026  
**Status**: Foundation Complete - Ready for Gradual Migration
