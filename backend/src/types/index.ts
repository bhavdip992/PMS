import mongoose from 'mongoose';

// ─── Auth & User ──────────────────────────────────────────────────────────────

export type UserRole = 'Super Admin' | 'Admin' | 'Project Manager' | 'Developer' | 'Designer' | 'QA' | 'Client';
export type Department = 'Engineering' | 'Design' | 'QA' | 'Management' | 'Operations' | 'Client';

export interface IUser extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: Department;
  avatar: string;
  timezone: string;
  isActive: boolean;
  notificationPreferences: { inApp: boolean; email: boolean; popups: boolean };
  lastLogin?: Date;
  comparePassword(candidate: string, hash: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;

  // Phase 1 additions
  refreshTokens?: string[];
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  passwordChangedAt?: Date;
  loginAttempts?: number;
  lockUntil?: Date;
  metadata?: {
    phone?: string;
    position?: string;
    bio?: string;
  };
}

export interface ISession extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  refreshToken: string; // hashed
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  lastActive: Date;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILoginHistory extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
  browser?: string;
  os?: string;
  status: 'success' | 'failed';
  timestamp: Date;
  location?: string;
}

export interface IAuditLog extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: mongoose.Types.ObjectId;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface IRole extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  permissions: string[];
  description?: string;
  isSystem: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface JwtPayload {
  id: string;
  role: UserRole;
  email: string;
  iat?: number;
  exp?: number;
}

// ─── Project ──────────────────────────────────────────────────────────────────

export type ProjectStatus = 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Cancelled';
export type ProjectPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface IProject extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate?: Date;
  endDate?: Date;
  members: mongoose.Types.ObjectId[];
  assignees: mongoose.Types.ObjectId[];
  tags: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export type TaskStatus = 'Backlog' | 'Todo' | 'In Progress' | 'In Review' | 'Done' | 'Cancelled';
export type TaskPriority = 'No Priority' | 'Low' | 'Medium' | 'High' | 'Critical';

export interface ITask extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  project: mongoose.Types.ObjectId;
  assignees: mongoose.Types.ObjectId[];
  reporter: mongoose.Types.ObjectId;
  dueDate?: Date;
  estimatedHours?: number;
  loggedHours?: number;
  tags: string[];
  subtasks: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Subtask ──────────────────────────────────────────────────────────────────

export interface ISubtask extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  task: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  assignees: mongoose.Types.ObjectId[];
  dueDate?: Date;
  estimatedHours?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export type NotificationType = 'task_assigned' | 'task_updated' | 'task_commented' | 'task_due_soon' | 'task_overdue' | 'mention' | 'file_uploaded' | 'sprint_updated' | 'status_changed' | 'communication_update';

export interface INotification extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  sender?: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

// ─── Time Log ─────────────────────────────────────────────────────────────────

export interface ITimeLog extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  task: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  description?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  isBillable: boolean;
  createdAt: Date;
}

// ─── Team ─────────────────────────────────────────────────────────────────────

export interface ITeam extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  lead: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  projects: mongoose.Types.ObjectId[];
  createdAt: Date;
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

export interface IActivityLog extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  action: string;
  resource: string;
  resourceId: mongoose.Types.ObjectId;
  details?: string;
  createdAt: Date;
}

export interface RequestDeviceInfo {
  ipAddress: string;
  userAgent: string;
  device: string;
  browser: string;
  os: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      deviceInfo?: RequestDeviceInfo;
    }
  }
}

// ─── Repository Helpers ───────────────────────────────────────────────────────
export interface QueryOptions {
  page?: number;
  limit?: number;
  sort?: string;
  [key: string]: any;
}
