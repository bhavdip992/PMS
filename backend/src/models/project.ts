import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A project must have a name'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: {
      values: ['Planning', 'In Progress', 'On Hold', 'Review', 'Completed', 'Cancelled'],
      message: 'Status must be one of: Planning, In Progress, On Hold, Review, Completed, Cancelled'
    },
    default: 'Planning',
    index: true
  },
  priority: {
    type: String,
    enum: {
      values: ['Low', 'Medium', 'High', 'Critical'],
      message: 'Priority must be one of: Low, Medium, High, Critical'
    },
    default: 'Medium'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  budgetHours: {
    type: Number,
    default: 0
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  client: {
    name: { type: String, trim: true },
    email: { type: String, trim: true },
    company: { type: String, trim: true }
  },
  teams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  assignees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  }],
  sprints: [{
    name: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    isActive: { type: Boolean, default: false }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A project must belong to a creator']
  }
}, {
  timestamps: true
});

// Full-text search index on projects
projectSchema.index({ name: 'text', description: 'text' });

const Project = mongoose.model('Project', projectSchema);
export default Project;
