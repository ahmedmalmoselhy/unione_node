# UniOne Frontend Implementation Guide

## Quick Overview

The UniOne frontend is a React-based web application that provides three main portals:
1. **Student Portal** - Course enrollment, grades, schedule, attendance
2. **Professor Portal** - Grade submission, attendance tracking, announcements
3. **Admin Portal** - System management, webhooks, audit logs

---

## Technology Stack

```
Frontend Framework:  React 18+ (TypeScript)
Build Tool:         Vite
State Management:   Redux Toolkit + TanStack Query
Styling:           Tailwind CSS + Shadcn/ui
Routing:           React Router v6
HTTP Client:        Axios
Forms:             React Hook Form + Zod
UI Components:     Shadcn/ui, Radix UI
Icons:             Lucide React
Charts:            Recharts
Calendar:          React Calendar
PDF:               jsPDF + html2canvas
Notifications:    Sonner Toast
Testing:          Jest + React Testing Library + Cypress
```

---

## Project Setup Commands

```bash
# Create new Vite + React + TypeScript project
npm create vite@latest unione_frontend -- --template react-ts

# Install dependencies
cd unione_frontend
npm install

# Install UI libraries
npm install -D tailwindcss postcss autoprefixer
npm install @radix-ui/react-* lucide-react recharts
npm install redux @reduxjs/toolkit react-redux
npm install @tanstack/react-query
npm install react-hook-form zod @hookform/resolvers
npm install axios sonner react-calendar
npm install jspdf html2canvas

# Development mode
npm run dev

# Production build
npm run build
```

---

## Folder Structure at a Glance

```
src/
├── components/          # Reusable React components
│   ├── Auth/           # Login, password reset
│   ├── Student/        # Student portal components
│   ├── Professor/      # Professor portal components
│   ├── Admin/          # Admin portal components
│   ├── Common/         # Layout, header, footer
│   └── Shared/         # Announcements, notifications
├── pages/              # Page-level components
├── hooks/              # Custom React hooks
├── store/              # Redux configuration
├── services/           # API service methods
├── utils/              # Helper functions
├── types/              # TypeScript type definitions
├── styles/             # Global CSS
└── App.tsx            # Root component
```

---

## Architecture Pattern

### Redux Flow
```
User Action → Component → Dispatch Action → Reducer → State → Component Rerender
```

### Service Pattern
```
Component → Hook (useQuery/useState) → Service → API → Backend
```

### Authentication Flow
```
1. User opens app
2. Check localStorage for token
3. If token exists, validate with /auth/me
4. If valid, load user data → StudentContext/Redux
5. If invalid, redirect to login
6. Token refresh on 401 response (interceptor)
```

---

## Component Template Examples

### Functional Component with Hooks
```typescript
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { studentService } from '@/services';

interface StudentEnrollmentsProps {
  studentId: string;
}

export const StudentEnrollments = ({ studentId }: StudentEnrollmentsProps) => {
  const [search, setSearch] = useState('');
  
  const { data: enrollments, isLoading, error } = useQuery({
    queryKey: ['enrollments', studentId],
    queryFn: () => studentService.getEnrollments(studentId),
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error.message} />;

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search courses..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2 border rounded"
      />
      <div className="grid gap-4">
        {enrollments?.map((enrollment) => (
          <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
        ))}
      </div>
    </div>
  );
};
```

### Protected Route Example
```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const PrivateRoute = ({ children, requiredRole }: PrivateRouteProps) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !user?.roles?.includes(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
```

---

## API Service Pattern

```typescript
import axios from '@/utils/axios';
import { User, Student, Enrollment } from '@/types';

export const studentService = {
  // Get student profile
  getProfile: async (): Promise<Student> => {
    const { data } = await axios.get('/student/profile');
    return data.data;
  },

  // Get enrollments
  getEnrollments: async (status?: string): Promise<Enrollment[]> => {
    const { data } = await axios.get('/student/enrollments', {
      params: { status },
    });
    return data.data;
  },

  // Enroll in course
  enrollCourse: async (sectionId: number): Promise<Enrollment> => {
    const { data } = await axios.post('/student/enrollments', {
      section_id: sectionId,
    });
    return data.data;
  },

  // Drop course
  dropCourse: async (enrollmentId: number): Promise<void> => {
    await axios.delete(`/student/enrollments/${enrollmentId}`);
  },
};
```

---

## Redux Slice Example

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Student, Enrollment } from '@/types';

interface StudentState {
  profile: Student | null;
  enrollments: Enrollment[];
  loading: boolean;
  error: string | null;
}

const initialState: StudentState = {
  profile: null,
  enrollments: [],
  loading: false,
  error: null,
};

const studentSlice = createSlice({
  name: 'student',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<Student>) => {
      state.profile = action.payload;
    },
    setEnrollments: (state, action: PayloadAction<Enrollment[]>) => {
      state.enrollments = action.payload;
    },
    addEnrollment: (state, action: PayloadAction<Enrollment>) => {
      state.enrollments.push(action.payload);
    },
    removeEnrollment: (state, action: PayloadAction<number>) => {
      state.enrollments = state.enrollments.filter((e) => e.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setProfile,
  setEnrollments,
  addEnrollment,
  removeEnrollment,
  setLoading,
  setError,
} = studentSlice.actions;

export default studentSlice.reducer;
```

---

## Key Hooks to Build

### useAuth
```typescript
interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
```

### useStudent
```typescript
interface UseStudentReturn {
  student: Student | null;
  enrollments: Enrollment[];
  grades: Grade[];
  loading: boolean;
  enrollCourse: (sectionId: number) => Promise<void>;
  dropCourse: (enrollmentId: number) => Promise<void>;
}
```

### useProfessor
```typescript
interface UseProfessorReturn {
  professor: Professor | null;
  sections: Section[];
  students: Student[];
  loading: boolean;
  submitGrades: (sectionId: number, grades: any[]) => Promise<void>;
}
```

### useNotifications
```typescript
interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
}
```

---

## Important Features to Implement

### 1. Authentication
- [x] Login page with email/password
- [x] Token storage in localStorage/sessionStorage
- [x] Token refresh on 401
- [x] Logout functionality
- [x] Protected routes

### 2. Student Features
- [x] Course enrollment
- [x] Drop courses
- [x] View grades
- [x] View transcript
- [x] Download transcript as PDF
- [x] View schedule (calendar view)
- [x] Export schedule as iCal
- [x] Track attendance
- [x] Submit course ratings
- [x] Manage waitlist
- [x] Academic history

### 3. Professor Features
- [x] View sections
- [x] View enrolled students
- [x] Submit grades (bulk)
- [x] Create attendance sessions
- [x] Record attendance
- [x] Create section announcements
- [x] View class schedule

### 4. Admin Features
- [x] Webhook management
- [x] Audit logs viewer
- [x] System statistics

### 5. Shared Features
- [x] Announcements
- [x] Notifications (real-time)
- [x] Profile update
- [x] Change password

---

## Styling Guidelines

### Tailwind CSS Classes (Common)

```typescript
// Spacing (4px base unit)
p-4, m-2, gap-6, space-y-4

// Colors
bg-blue-500, text-gray-700, border-red-200

// Sizing
w-full, h-screen, max-w-2xl

// Flexbox
flex, justify-center, items-center, gap-4

// Grid
grid, grid-cols-3, gap-4

// Responsive
md:w-1/2, lg:grid-cols-4

// Hover/Active states
hover:bg-blue-600, active:scale-95

// Shadows
shadow-md, shadow-lg

// Rounded
rounded-lg, rounded-full
```

### Component Styling Example
```typescript
// Button component with variants
export const Button = ({ variant = 'primary', ...props }) => {
  const variants = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };

  return (
    <button
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${variants[variant]}`}
      {...props}
    />
  );
};
```

---

## Common Patterns

### Form Handling with React Hook Form
```typescript
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(enrollmentSchema),
});

<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register('courseCode')} />
  {errors.courseCode && <span>{errors.courseCode.message}</span>}
  <button type="submit">Enroll</button>
</form>
```

### Loading State Management
```typescript
const { isLoading } = useQuery({
  queryKey: ['enrollments'],
  queryFn: studentService.getEnrollments,
});

if (isLoading) return <SkeletonLoader rows={5} />;
```

### Error Handling
```typescript
const { error } = useQuery({
  queryKey: ['enrollments'],
  queryFn: studentService.getEnrollments,
});

if (error) return <Alert type="error" message={error.message} />;
```

---

## Performance Tips

1. **Code Splitting**: Use React.lazy for route components
2. **Memoization**: Wrap components with React.memo if re-rendering often
3. **useCallback**: Memoize event handlers passed to children
4. **Image Optimization**: Use next/image or lazy loading
5. **Bundle Analysis**: Check with webpack-bundle-analyzer
6. **Caching**: Set appropriate cache headers for API responses

---

## Testing Patterns

### Component Test
```typescript
import { render, screen } from '@testing-library/react';
import { StudentDashboard } from './StudentDashboard';

describe('StudentDashboard', () => {
  it('should display student name', () => {
    render(<StudentDashboard student={{ name: 'John' }} />);
    expect(screen.getByText('John')).toBeInTheDocument();
  });
});
```

### Hook Test
```typescript
import { renderHook, act } from '@testing-library/react';
import { useStudent } from '@/hooks/useStudent';

it('should enroll in course', async () => {
  const { result } = renderHook(() => useStudent());
  
  await act(async () => {
    await result.current.enrollCourse(123);
  });
  
  expect(result.current.enrollments).toHaveLength(1);
});
```

---

## Deployment

### Build for Production
```bash
npm run build
# Creates optimized bundle in /dist
```

### Docker
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

### Environment Variables
```
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=UniOne
```

---

## Quick Checklist Before Launch

- [ ] All routes working
- [ ] Authentication flow complete
- [ ] All API endpoints integrated
- [ ] Loading states visible
- [ ] Error handling in place
- [ ] Form validation working
- [ ] Mobile responsive
- [ ] Accessibility checks passed
- [ ] Tests running successfully
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Environment variables configured

---

## Resources

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Redux Toolkit](https://redux-toolkit.js.org)
- [React Query](https://tanstack.com/query)
- [React Hook Form](https://react-hook-form.com)
- [Shadcn/ui Components](https://ui.shadcn.com)

---

## Support & Debugging

### Common Issues

1. **401 Unauthorized**: Token expired or invalid → Request new token
2. **CORS Error**: Backend not allowing origin → Check CORS config
3. **API Not Found**: Endpoint doesn't exist → Check backend routes
4. **State Not Updating**: Redux dispatch not called → Check action creators

### Debug Mode
```typescript
// Enable Redux DevTools
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      window.__REDUX_DEVTOOLS_EXTENSION__ ? 
        window.__REDUX_DEVTOOLS_EXTENSION__() : 
        (f) => f
    ),
});
```
