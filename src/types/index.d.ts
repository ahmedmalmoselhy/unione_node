// Global type definitions for UniOne Node.js Backend

export interface User {
  id: number;
  national_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  gender: 'male' | 'female';
  date_of_birth?: string | null;
  avatar_path?: string | null;
  is_active: boolean;
  email_verified_at?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  roles?: string[];
}

export interface Student {
  id: number;
  user_id: number;
  student_number: string;
  faculty_id: number;
  department_id: number;
  academic_year: number;
  semester: number;
  enrollment_status: 'active' | 'inactive' | 'graduated';
  gpa?: number | null;
  academic_standing?: 'good_standing' | 'probation' | 'dismissal' | null;
  enrolled_at?: string | null;
  graduated_at?: string | null;
}

export interface Professor {
  id: number;
  user_id: number;
  staff_number: string;
  department_id: number;
  academic_rank: string;
  specialization?: string | null;
  office?: string | null;
  hire_date?: string | null;
}

export interface Employee {
  id: number;
  user_id: number;
  staff_number: string;
  job_title?: string | null;
  employment_type?: string | null;
  salary?: number | null;
  hire_date?: string | null;
}

export interface Course {
  id: number;
  code: string;
  name: string;
  name_ar?: string | null;
  credit_hours: number;
  lecture_hours?: number | null;
  lab_hours?: number | null;
  level?: number | null;
  is_elective: boolean;
  is_active: boolean;
}

export interface Section {
  id: number;
  course_id: number;
  professor_id: number;
  academic_term_id: number;
  capacity: number;
  room?: string | null;
  schedule?: any[] | null;
  is_active: boolean;
}

export interface Enrollment {
  id: number;
  student_id: number;
  section_id: number;
  academic_term_id: number;
  status: 'registered' | 'completed' | 'dropped' | 'failed' | 'incomplete';
  registered_at: string;
  dropped_at?: string | null;
}

export interface Grade {
  id: number;
  enrollment_id: number;
  midterm?: number | null;
  final?: number | null;
  coursework?: number | null;
  total?: number | null;
  letter_grade?: string | null;
  grade_points?: number | null;
  graded_at?: string | null;
}

export interface Announcement {
  id: number;
  author_id: number;
  title: string;
  body: string;
  type: 'general' | 'academic' | 'administrative' | 'urgent';
  visibility: 'university' | 'faculty' | 'department' | 'section';
  target_id?: number | null;
  published_at?: string | null;
  expires_at?: string | null;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  body: string;
  type: string;
  payload?: any | null;
  read_at?: string | null;
  deleted_at?: string | null;
  created_at: string;
}

export interface Webhook {
  id: number;
  owner_id: number;
  url: string;
  events: string[];
  secret?: string | null;
  is_active: boolean;
  headers?: any | null;
}

export interface AuthRequest {
  user: User;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  status?: number;
}

export interface CacheStats {
  connected: boolean;
  keys_count?: number;
  memory_used?: string;
  error?: string;
}

export interface QueueStatus {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  response_time_ms?: number;
  error?: string;
  message?: string;
}
