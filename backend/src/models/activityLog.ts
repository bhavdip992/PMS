import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'An activity log must belong to a project'],
    index: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    index: true
  },
  subtask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subtask',
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'An activity log must have a user context'],
    index: true
  },
  action: {
    type: String,
    required: [true, 'Action name is required'] // e.g. 'STATUS_CHANGE', 'ASSIGNED', 'COMMENT_ADDED'
  },
  details: {
    oldValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    fieldName: { type: String }
  }
}, {
  timestamps: true
});

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
