// ─── User ─────────────────────────────────────────────────────────────────────
export type UserRole = 'Super Admin' | 'Admin' | 'Project Manager' | 'Developer' | 'Designer' | 'QA' | 'Client';
export type Department = 'Engineering' | 'Design' | 'QA' | 'Management' | 'Operations' | 'Client';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  department: Department;
  avatar?: string;
  timezone: string;
  isActive: boolean;
  notificationPreferences: { inApp: boolean; email: boolean; popups: boolean };
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Project ─────────────────────────────────────────────────────────────────
export type ProjectStatus = 'Planning' | 'In Progress' | 'On Hold' | 'Review' | 'Completed' | 'Cancelled';
export type ProjectPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Project {
  _id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate?: string;
  endDate?: string;
  budgetHours: number;
  progress: number;
  client?: { name: string; email: string; company: string };
  members: User[];
  assignees: User[];
  tags: string[];
  createdBy: User | string;
  createdAt: string;
  updatedAt: string;
}

// ─── Task ─────────────────────────────────────────────────────────────────────
export type TaskStatus = 'Backlog' | 'Todo' | 'In Progress' | 'In Review' | 'QA Ready' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  project: Project | string;
  assignees: User[];
  createdBy: User | string;
  dueDate?: string;
  startDate?: string;
  estimatedHours: number;
  actualHours: number;
  tags: string[];
  sprint?: string;
  sprintId?: string;
  checklist: { _id?: string; title: string; isCompleted: boolean }[];
  requirements: {
    explanation: string;
    businessLogic: string;
    acceptanceCriteria: string[];
    technicalNotes: string;
    edgeCases: string[];
    testingInstructions: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ─── Subtask ─────────────────────────────────────────────────────────────────
export interface Subtask {
  _id: string;
  title: string;
  description?: string;
  status: 'Todo' | 'In Progress' | 'In Review' | 'Done';
  isCompleted: boolean;
  assignee?: User | string;
  dueDate?: string;
  estimatedHours: number;
  actualHours: number;
  parentTask: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export interface Notification {
  _id: string;
  recipient: string;
  sender?: User;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// ─── API Response ─────────────────────────────────────────────────────────────
export interface ApiResponse<T = any> {
  status: 'success' | 'fail' | 'error';
  message?: string;
  data?: T;
  token?: string;
  results?: number;
}

// ─── Auth Store ───────────────────────────────────────────────────────────────
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}
