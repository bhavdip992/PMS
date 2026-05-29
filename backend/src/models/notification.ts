import mongoose from 'mongoose';

// ─── Notification Types ───────────────────────────────────────────────────────
export type NotificationType =
  // Task
  | 'task:assigned' | 'task:reassigned' | 'task:status_changed'
  | 'task:due_soon' | 'task:overdue' | 'task:completed'
  // Subtask
  | 'subtask:assigned' | 'subtask:status_changed'
  | 'subtask:due_soon' | 'subtask:overdue'
  // Comment / Communication
  | 'comment:added' | 'mention:created'
  | 'communication:new' | 'communication:updated'
  // Project
  | 'project:assigned' | 'project:status_changed'
  | 'milestone:completed' | 'sprint:started' | 'sprint:completed'
  // System
  | 'system:announcement' | 'system:maintenance' | 'system:account';

// ─── Priority ─────────────────────────────────────────────────────────────────
export type NotificationPriority = 'high' | 'medium' | 'low';

const PRIORITY_MAP: Record<NotificationType, NotificationPriority> = {
  // HIGH
  'task:assigned':        'high',
  'task:reassigned':      'high',
  'task:overdue':         'high',
  'subtask:overdue':      'high',
  'mention:created':      'high',
  'communication:new':    'high',
  'system:announcement':  'high',
  // MEDIUM
  'task:status_changed':     'medium',
  'task:due_soon':           'medium',
  'task:completed':          'medium',
  'subtask:assigned':        'medium',
  'subtask:status_changed':  'medium',
  'subtask:due_soon':        'medium',
  'comment:added':           'medium',
  'communication:updated':   'medium',
  'project:assigned':        'medium',
  'project:status_changed':  'medium',
  'milestone:completed':     'medium',
  'sprint:started':          'medium',
  'sprint:completed':        'medium',
  // LOW
  'system:maintenance': 'low',
  'system:account':     'low',
};

// ─── Entity Types ─────────────────────────────────────────────────────────────
export type EntityType = 'task' | 'subtask' | 'project' | 'comment' | 'communication' | 'sprint' | 'milestone';

// ─── Schema ───────────────────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Notification must have a recipient'],
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: {
      values: [
        'task:assigned', 'task:reassigned', 'task:status_changed',
        'task:due_soon', 'task:overdue', 'task:completed',
        'subtask:assigned', 'subtask:status_changed',
        'subtask:due_soon', 'subtask:overdue',
        'comment:added', 'mention:created',
        'communication:new', 'communication:updated',
        'project:assigned', 'project:status_changed',
        'milestone:completed', 'sprint:started', 'sprint:completed',
        'system:announcement', 'system:maintenance', 'system:account',
        // Legacy support
        'Task_Assign', 'Mention', 'Due_Reminder', 'Comm_Update', 'System',
        'task:assigned', 'task:updated', 'task:commented', 'task:overdue',
        'task:status_changed', 'file:uploaded', 'sprint:updated',
        'mention:created', 'communication:updated', 'Task_Update',
      ],
      message: 'Invalid notification type'
    },
    required: [true, 'Notification type is required']
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true
  },
  // Where to navigate on click
  link: { type: String, trim: true },
  // Entity reference for click routing
  entityType: {
    type: String,
    enum: ['task', 'subtask', 'project', 'comment', 'communication', 'sprint', 'milestone'],
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId
  },
  channel: {
    type: [String],
    enum: ['inApp', 'email', 'push'],
    default: ['inApp']
  },
  isRead: { type: Boolean, default: false, index: true },
  readAt: { type: Date },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true
});

// Compound index for fast unread queries per user
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export { PRIORITY_MAP };
export default Notification;
