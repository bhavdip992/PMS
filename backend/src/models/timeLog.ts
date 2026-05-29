import mongoose from 'mongoose';

const timeLogSchema = new mongoose.Schema({
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
    required: [true, 'Time log must belong to a user'],
    index: true
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // duration in minutes
    default: 0
  },
  description: {
    type: String,
    trim: true
  },
  isBillable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const TimeLog = mongoose.model('TimeLog', timeLogSchema);
export default TimeLog;
