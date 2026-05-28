import mongoose from 'mongoose';

const subtaskSchema = new mongoose.Schema({
  parentTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: [true, 'A subtask must belong to a parent task'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'A subtask must have a title'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Todo', 'In Progress', 'In Review', 'Done'],
    default: 'Todo',
    index: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dueDate: {
    type: Date
  },
  estimatedHours: {
    type: Number,
    default: 0
  },
  actualHours: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Subtask = mongoose.model('Subtask', subtaskSchema);
export default Subtask;
