# UniOne Frontend Implementation Guide

**Date**: April 12, 2026  
**Backend**: Node.js API (Port 3000)  
**Status**: Ready for Implementation  
**Estimated Timeline**: 4-6 weeks  

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Phase 1: Setup & Authentication (Week 1)](#phase-1-setup--authentication)
5. [Phase 2: Student Portal (Week 2)](#phase-2-student-portal)
6. [Phase 3: Professor Portal (Week 3)](#phase-3-professor-portal)
7. [Phase 4: Admin Dashboard (Week 4)](#phase-4-admin-dashboard)
8. [Phase 5: Advanced Features (Week 5)](#phase-5-advanced-features)
9. [Phase 6: Polish & Testing (Week 6)](#phase-6-polish--testing)
10. [API Integration Guide](#api-integration-guide)
11. [Component Specifications](#component-specifications)
12. [State Management](#state-management)
13. [Real-time Features](#real-time-features)
14. [Deployment](#deployment)

---

## 📊 Project Overview

UniOne Frontend is a **React + TypeScript** single-page application that provides:
- **Student Portal**: Course enrollment, grades, transcripts, attendance
- **Professor Portal**: Grade submission, attendance management, announcements
- **Admin Dashboard**: Full CRUD operations, analytics, bulk operations
- **Employee Portal**: Basic profile and announcements

**Backend API**: `http://localhost:3000/api/v1`  
**Frontend Dev Server**: `http://localhost:5173`  
**Frontend Production**: Served via Nginx or static CDN

---

## 🛠️ Technology Stack

### Core
- **React 18** - UI library
- **TypeScript 5** - Type safety
- **Vite 5** - Build tool & dev server
- **React Router 6** - Client-side routing

### State Management
- **Redux Toolkit** - Global state
- **React Query** - Server state & caching
- **Zustand** - Lightweight local state (optional)

### UI
- **Tailwind CSS 3** - Utility-first styling
- **Headless UI** - Unstyled accessible components
- **Heroicons** - Icon library
- **React Hot Toast** - Notifications

### Forms & Validation
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **@hookform/resolvers** - React Hook Form + Zod integration

### API & Real-time
- **Axios** - HTTP client
- **Socket.io Client** - Real-time notifications

### Testing
- **Vitest** - Unit testing
- **React Testing Library** - Component testing
- **Playwright** - E2E testing
- **MSW** - API mocking

---

## 📁 Project Structure

```
unione_frontend/
├── public/                      # Static assets
│   ├── favicon.ico
│   └── logo.svg
├── src/
│   ├── assets/                  # Images, fonts, etc.
│   ├── components/              # Reusable components
│   │   ├── ui/                  # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   └── ...
│   │   ├── forms/               # Form components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── StudentForm.tsx
│   │   │   └── ...
│   │   ├── layout/              # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── ...
│   │   └── charts/              # Chart components
│   │       ├── EnrollmentChart.tsx
│   │       ├── GradeDistribution.tsx
│   │       └── ...
│   ├── pages/                   # Page components
│   │   ├── auth/                # Authentication pages
│   │   │   ├── LoginPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   └── ResetPasswordPage.tsx
│   │   ├── student/             # Student portal pages
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── EnrollmentsPage.tsx
│   │   │   ├── GradesPage.tsx
│   │   │   ├── TranscriptPage.tsx
│   │   │   ├── SchedulePage.tsx
│   │   │   └── AttendancePage.tsx
│   │   ├── professor/           # Professor portal pages
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── SectionsPage.tsx
│   │   │   ├── GradingPage.tsx
│   │   │   └── AttendancePage.tsx
│   │   └── admin/               # Admin dashboard pages
│   │       ├── DashboardPage.tsx
│   │       ├── StudentsPage.tsx
│   │       ├── ProfessorsPage.tsx
│   │       ├── CoursesPage.tsx
│   │       ├── SectionsPage.tsx
│   │       ├── AnalyticsPage.tsx
│   │       ├── BulkOperationsPage.tsx
│   │       └── SettingsPage.tsx
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useApi.ts
│   │   ├── useSocket.ts
│   │   └── ...
│   ├── services/                # API services
│   │   ├── api.ts               # Axios instance
│   │   ├── auth.ts
│   │   ├── student.ts
│   │   ├── professor.ts
│   │   ├── admin.ts
│   │   └── socket.ts
│   ├── store/                   # Redux store
│   │   ├── index.ts
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── notificationSlice.ts
│   │   │   └── uiSlice.ts
│   ├── types/                   # TypeScript types
│   │   ├── index.ts
│   │   ├── user.ts
│   │   ├── student.ts
│   │   ├── professor.ts
│   │   └── api.ts
│   ├── utils/                   # Utility functions
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   ├── App.tsx                  # Root component
│   ├── main.tsx                 # Entry point
│   └── vite-env.d.ts            # Vite types
├── tests/
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── e2e/                     # E2E tests
├── index.html                   # HTML template
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

---

## 🚀 Phase 1: Setup & Authentication (Week 1)

### Day 1-2: Project Scaffolding

```bash
# Create Vite + React + TypeScript project
npm create vite@latest unione_frontend -- --template react-ts
cd unione_frontend

# Install core dependencies
npm install react-router-dom @reduxjs/toolkit react-redux @tanstack/react-query axios

# Install UI dependencies
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

npm install @headlessui/react @heroicons/react
npm install react-hot-toast

# Install form dependencies
npm install react-hook-form @hookform/resolvers zod

# Install dev dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event msw
```

**Configure Tailwind** (`tailwind.config.js`):
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
}
```

### Day 3-4: API Service & Authentication

**Create Axios instance** (`src/services/api.ts`):
```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

**Auth Service** (`src/services/auth.ts`):
```typescript
import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    roles: string[];
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    localStorage.setItem('token', response.data.token);
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
  },

  async getProfile(): Promise<AuthResponse['user']> {
    const response = await api.get<AuthResponse['user']>('/auth/me');
    return response.data;
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await api.post('/auth/reset-password', { token, password });
  },
};
```

### Day 5-7: Login Page & Protected Routes

**Login Page** (`src/pages/auth/LoginPage.tsx`):
```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../../services/auth';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await authService.login(data);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Sign in to UniOne
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <input
              {...register('email')}
              type="email"
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Email address"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              {...register('password')}
              type="password"
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Password"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

**Protected Route Component** (`src/components/ProtectedRoute.tsx`):
```typescript
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
```

**App Router** (`src/App.tsx`):
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/auth/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import StudentDashboard from './pages/student/DashboardPage';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          {/* Add more protected routes */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## 🎓 Phase 2: Student Portal (Week 2)

### API Endpoints Used:
```
GET  /api/v1/student/profile
GET  /api/v1/student/enrollments
POST /api/v1/student/enrollments
DELETE /api/v1/student/enrollments/{id}
GET  /api/v1/student/grades
GET  /api/v1/student/transcript
GET  /api/v1/student/schedule
GET  /api/v1/student/schedule/ics
GET  /api/v1/student/attendance
GET  /api/v1/student/ratings
POST /api/v1/student/ratings
GET  /api/v1/notifications
POST /api/v1/notifications/read-all
```

### Key Components to Build:
1. **StudentDashboard** - Overview of enrollments, upcoming exams, recent grades
2. **EnrollmentsPage** - List current enrollments, add/drop courses
3. **GradesPage** - View grades by term, GPA calculation
4. **TranscriptPage** - Download PDF transcript
5. **SchedulePage** - Weekly schedule view, ICS export
6. **AttendancePage** - Attendance records by course
7. **ProfilePage** - Edit profile, change password

### Example: Enrollments Page

```typescript
// src/pages/student/EnrollmentsPage.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

interface Enrollment {
  id: number;
  status: 'registered' | 'completed' | 'dropped';
  course: {
    code: string;
    name: string;
    credit_hours: number;
  };
  section: {
    id: number;
    room: string;
    schedule: Array<{
      day: string;
      start_time: string;
      end_time: string;
    }>;
  };
  academic_term: {
    name: string;
    semester: string;
  };
}

export default function EnrollmentsPage() {
  const queryClient = useQueryClient();

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => api.get('/student/enrollments').then(res => res.data.enrollments),
  });

  const dropMutation = useMutation({
    mutationFn: (enrollmentId: number) => 
      api.delete(`/student/enrollments/${enrollmentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      toast.success('Course dropped successfully');
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">My Enrollments</h1>
      <div className="grid gap-4">
        {enrollments?.map((enrollment: Enrollment) => (
          <div key={enrollment.id} className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold">{enrollment.course.code} - {enrollment.course.name}</h3>
            <p className="text-sm text-gray-600">
              {enrollment.academic_term.name} - {enrollment.academic_term.semester}
            </p>
            <p className="text-sm">Status: {enrollment.status}</p>
            <p className="text-sm">Credits: {enrollment.course.credit_hours}</p>
            {enrollment.status === 'registered' && (
              <button
                onClick={() => dropMutation.mutate(enrollment.id)}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Drop Course
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 👨‍🏫 Phase 3: Professor Portal (Week 3)

### API Endpoints Used:
```
GET  /api/v1/professor/profile
GET  /api/v1/professor/sections
GET  /api/v1/professor/schedule
GET  /api/v1/professor/sections/{id}/students
GET  /api/v1/professor/sections/{id}/grades
POST /api/v1/professor/sections/{id}/grades
GET  /api/v1/professor/sections/{id}/attendance
POST /api/v1/professor/sections/{id}/attendance
GET  /api/v1/professor/sections/{id}/announcements
POST /api/v1/professor/sections/{id}/announcements
DELETE /api/v1/professor/sections/{id}/announcements/{id}
```

### Key Components:
1. **ProfessorDashboard** - Overview of sections, pending grading, announcements
2. **SectionsPage** - List assigned sections
3. **GradingPage** - Submit/update grades for students
4. **AttendancePage** - Mark attendance for sessions
5. **AnnouncementsPage** - Create/delete section announcements

### Example: Grade Submission

```typescript
// src/pages/professor/GradingPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../../services/api';

interface GradeInput {
  enrollment_id: number;
  midterm: number;
  final: number;
  coursework: number;
}

export default function GradingPage({ sectionId }: { sectionId: number }) {
  const queryClient = useQueryClient();
  const [students, setStudents] = useState<any[]>([]);

  const { data: sectionStudents } = useQuery({
    queryKey: ['section-students', sectionId],
    queryFn: () => 
      api.get(`/professor/sections/${sectionId}/students`)
        .then(res => res.data.students),
  });

  const gradeMutation = useMutation({
    mutationFn: (grades: GradeInput[]) =>
      api.post(`/professor/sections/${sectionId}/grades`, { grades }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['section-students', sectionId] });
      toast.success('Grades submitted successfully');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const grades = students.map(s => ({
      enrollment_id: s.enrollment_id,
      midterm: s.midterm,
      final: s.final,
      coursework: s.coursework,
    }));
    gradeMutation.mutate(grades);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Submit Grades</h1>
      <form onSubmit={handleSubmit}>
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="px-4 py-2">Student</th>
              <th className="px-4 py-2">Midterm (30)</th>
              <th className="px-4 py-2">Final (50)</th>
              <th className="px-4 py-2">Coursework (20)</th>
            </tr>
          </thead>
          <tbody>
            {sectionStudents?.map((student: any) => (
              <tr key={student.enrollment_id}>
                <td className="border px-4 py-2">{student.name}</td>
                <td className="border px-4 py-2">
                  <input
                    type="number"
                    max="30"
                    className="w-20 px-2 py-1 border rounded"
                    onChange={(e) => {/* update state */}}
                  />
                </td>
                {/* Similar inputs for final and coursework */}
              </tr>
            ))}
          </tbody>
        </table>
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          Submit Grades
        </button>
      </form>
    </div>
  );
}
```

---

## 👨‍💼 Phase 4: Admin Dashboard (Week 4)

### API Endpoints Used:
```
# CRUD Operations
GET/POST/PATCH/DELETE /api/v1/admin/students
GET/POST/PATCH/DELETE /api/v1/admin/professors
GET/POST/PATCH/DELETE /api/v1/admin/employees
GET/POST/PATCH/DELETE /api/v1/admin/courses
GET/POST/PATCH/DELETE /api/v1/admin/sections

# Bulk Operations
POST /api/v1/admin/bulk/enroll
POST /api/v1/admin/bulk/grades
POST /api/v1/admin/bulk/transfer

# Analytics
GET /api/v1/admin/analytics/enrollment-trends
GET /api/v1/admin/analytics/student-performance/{id}
GET /api/v1/admin/analytics/course-demand
GET /api/v1/admin/analytics/professor-workload

# Imports/Exports
GET/POST /api/v1/admin/imports/*
GET /api/v1/admin/exports/*
```

### Key Components:
1. **AdminDashboard** - Overview stats, recent activity
2. **StudentsPage** - CRUD table with search/filter
3. **ProfessorsPage** - CRUD table
4. **CoursesPage** - CRUD with prerequisites management
5. **SectionsPage** - CRUD with professor assignment
6. **AnalyticsPage** - Charts and predictions
7. **BulkOperationsPage** - Batch operations UI
8. **ImportsExportsPage** - CSV/Excel import/export

### Example: Admin Students CRUD

Use a data table library like `@tanstack/react-table` for efficient CRUD:

```typescript
// Install: npm install @tanstack/react-table
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
```

---

## 🎨 Phase 5: Advanced Features (Week 5)

### Real-time Notifications (Socket.io)

```typescript
// src/services/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function initializeSocket(token: string) {
  socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected');
  });

  socket.on('notification', (data) => {
    // Show toast notification
    toast(data.title, { icon: '🔔' });
  });

  socket.on('grade.updated', (data) => {
    toast(`Grade updated: ${data.course_name}`, { icon: '📊' });
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export { socket };
```

### File Upload (Avatar)

```typescript
// src/services/upload.ts
import api from './api';

export const uploadService = {
  async uploadAvatar(file: File): Promise<{ avatar_url: string }> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  },

  async deleteAvatar(): Promise<void> {
    await api.delete('/users/avatar');
  },
};
```

### Charts (Use Recharts or Chart.js)

```bash
npm install recharts
```

```typescript
// src/components/charts/EnrollmentChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface EnrollmentTrend {
  month: string;
  total_enrollments: number;
  active: number;
  dropped: number;
}

export default function EnrollmentChart({ data }: { data: EnrollmentTrend[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="total_enrollments" stroke="#3b82f6" />
        <Line type="monotone" dataKey="active" stroke="#10b981" />
        <Line type="monotone" dataKey="dropped" stroke="#ef4444" />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

---

## 🧪 Phase 6: Polish & Testing (Week 6)

### Unit Tests (Vitest + React Testing Library)

```typescript
// src/components/ui/Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### E2E Tests (Playwright)

```bash
npm install -D @playwright/test
npx playwright install
```

```typescript
// tests/e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test('user can login successfully', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'student@unione.local');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/student/dashboard');
  await expect(page.locator('text=Welcome')).toBeVisible();
});
```

---

## 🔌 API Integration Guide

### Authentication Flow

```typescript
// 1. User logs in
const { token, user } = await authService.login({ email, password });

// 2. Store token
localStorage.setItem('token', token);

// 3. Initialize socket
initializeSocket(token);

// 4. Navigate based on role
if (user.roles.includes('student')) {
  navigate('/student/dashboard');
} else if (user.roles.includes('professor')) {
  navigate('/professor/dashboard');
} else if (user.roles.includes('admin')) {
  navigate('/admin/dashboard');
}
```

### Error Handling

```typescript
// Global error handler in api.ts
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired - logout
      localStorage.removeItem('token');
      disconnectSocket();
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action');
    } else if (error.response?.status === 422) {
      // Validation error
      const errors = error.response.data.errors;
      Object.values(errors).forEach((err: any) => {
        toast.error(err.message || err);
      });
    } else {
      toast.error('An unexpected error occurred');
    }
    return Promise.reject(error);
  }
);
```

---

## 📦 State Management

### Redux Store Setup

```typescript
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import notificationReducer from './slices/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Auth Slice

```typescript
// src/store/slices/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    roles: string[];
  } | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: !!localStorage.getItem('token'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AuthState['user']>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
```

---

## 🔌 Real-time Features

### Socket.io Integration

```typescript
// src/hooks/useSocket.ts
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

export function useSocket(token: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_API_URL, {
      auth: { token },
    });

    socketRef.current.on('notification', (data) => {
      toast(data.title, { icon: '🔔' });
    });

    socketRef.current.on('grade.updated', (data) => {
      toast(`Grade updated: ${data.course_name}`, { icon: '📊' });
      // Invalidate React Query cache
      queryClient.invalidateQueries({ queryKey: ['grades'] });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token]);

  return socketRef.current;
}
```

---

## 🚀 Deployment

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/unione_frontend/dist;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket proxy
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Docker Deployment

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 📊 Component Specifications

### Required Components (120+)

#### UI Components (30+)
- Button, Input, Select, Textarea, Checkbox, Radio
- Modal, Dialog, Drawer, Tooltip, Popover
- Table, Pagination, SortableHeader
- Card, Badge, Avatar, Tag
- Alert, Toast, Progress, Spinner
- Tabs, Accordion, Breadcrumbs

#### Form Components (15+)
- LoginForm, RegisterForm, ForgotPasswordForm
- StudentForm, ProfessorForm, EmployeeForm
- CourseForm, SectionForm
- GradeSubmissionForm, AttendanceForm
- FileUpload, ImageCropper

#### Layout Components (10+)
- AppLayout, Header, Sidebar, Footer
- StudentLayout, ProfessorLayout, AdminLayout
- AuthLayout, ErrorBoundary

#### Page Components (20+)
- Auth: Login, ForgotPassword, ResetPassword
- Student: Dashboard, Profile, Enrollments, Grades, Transcript, Schedule, Attendance
- Professor: Dashboard, Sections, Grading, Attendance, Announcements
- Admin: Dashboard, Students, Professors, Employees, Courses, Sections, Analytics, Settings

#### Chart Components (10+)
- EnrollmentTrendChart, GradeDistributionChart
- AttendanceHeatmap, ProfessorWorkloadChart
- CourseDemandChart, GPA Trend Chart

#### Real-time Components (5+)
- NotificationBell, LiveUpdates
- SocketStatus, OnlineUsers

---

## 📝 Quick Start Checklist

- [ ] Run `npm create vite@latest unione_frontend -- --template react-ts`
- [ ] Install all dependencies (see Technology Stack)
- [ ] Configure Tailwind CSS
- [ ] Create project structure (see Project Structure)
- [ ] Set up API service with Axios
- [ ] Implement authentication flow
- [ ] Create protected routes
- [ ] Build Student Portal
- [ ] Build Professor Portal
- [ ] Build Admin Dashboard
- [ ] Add real-time notifications
- [ ] Add file upload support
- [ ] Add charts and analytics
- [ ] Write unit tests
- [ ] Write E2E tests
- [ ] Configure production build
- [ ] Deploy to production

---

## 🔗 Useful Resources

- **Backend API**: http://localhost:3000/api/v1
- **API Documentation**: http://localhost:3000/docs (when set up)
- **Postman Collection**: Available from backend
- **Design System**: Tailwind CSS + Headless UI
- **Icons**: Heroicons (https://heroicons.com)

---

**Last Updated**: April 12, 2026  
**Maintained By**: UniOne Development Team  
**Next Steps**: Begin Phase 1 (Setup & Authentication)
