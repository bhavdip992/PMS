import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'A task must belong to a project'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'A task must have a title'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: {
      values: ['Backlog', 'Todo', 'In Progress', 'In Review', 'QA Ready', 'Done'],
      message: 'Status must be one of: Backlog, Todo, In Progress, In Review, QA Ready, Done'
    },
    default: 'Todo',
    index: true
  },
  priority: {
    type: String,
    enum: {
      values: ['Low', 'Medium', 'High', 'Critical'],
      message: 'Priority must be one of: Low, Medium, High, Critical'
    },
    default: 'Medium',
    index: true
  },
  dueDate: {
    type: Date,
    index: true
  },
  startDate: {
    type: Date
  },
  estimatedHours: {
    type: Number,
    default: 0
  },
  actualHours: {
    type: Number,
    default: 0
  },
  assignees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  }],
  watchers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  milestone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone',
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    index: true
  }],
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrence: {
    frequency: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly']
    },
    interval: {
      type: Number,
      default: 1
    }
  },
  sprint: {
    type: String,
    trim: true
  },
  sprintId: {
    type: String,
    index: true
  },
  checklist: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    isCompleted: {
      type: Boolean,
      default: false
    }
  }],
  requirements: {
    explanation: { type: String, default: '' },
    businessLogic: { type: String, default: '' },
    acceptanceCriteria: [{ type: String }],
    technicalNotes: { type: String, default: '' },
    edgeCases: [{ type: String }],
    testingInstructions: { type: String, default: '' }
  },
  devTracking: {
    gitBranch: { type: String, default: '' },
    pullRequests: [{
      prNumber: { type: Number },
      prTitle: { type: String },
      prUrl: { type: String },
      status: { type: String, enum: ['Open', 'Merged', 'Closed'], default: 'Open' }
    }],
    deploymentUrl: { type: String, default: '' },
    qaStatus: { type: String, enum: ['Pending', 'Passed', 'Failed'], default: 'Pending' },
    qaFeedback: { type: String, default: '' }
  },
  deploymentNotes: {
    type: String,
    default: ''
  },
  requirementNotes: {
    type: String,
    default: ''
  },
  richDescription: {
    type: String,
    default: ''
  },
  breadcrumb: {
    type: String,
    default: ''
  },
  hierarchy: {
    parentTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null
    }
  },
  qaChecklist: [{
    item: {
      type: String,
      required: true,
      trim: true
    },
    isCompleted: {
      type: Boolean,
      default: false
    }
  }],
  lastCommentedAt: {
    type: Date,
    index: true
  },
  lastCommentedByClient: {
    type: Boolean,
    default: false,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A task must have a creator']
  }
}, {
  timestamps: true
});

// Compound & Search Indexes
taskSchema.index({ project: 1, status: 1, priority: 1 });
taskSchema.index({ assignees: 1, status: 1 });
taskSchema.index({ title: 'text', description: 'text' });

const Task = mongoose.model('Task', taskSchema);
export default Task;
