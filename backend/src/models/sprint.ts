import mongoose from 'mongoose';

const burndownSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  remainingPoints: { type: Number, default: 0 },
  remainingHours: { type: Number, default: 0 }
});

const sprintSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'A sprint must belong to a project'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'A sprint must have a name'],
    trim: true
  },
  goal: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    required: [true, 'A sprint must have a start date']
  },
  endDate: {
    type: Date,
    required: [true, 'A sprint must have an end date']
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'completed', 'cancelled'],
    default: 'planning',
    index: true
  },
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  velocity: {
    type: Number,
    default: 0
  },
  capacity: {
    type: Number,
    default: 0
  },
  burndownData: [burndownSchema]
}, {
  timestamps: true
});

const Sprint = mongoose.model('Sprint', sprintSchema);
export default Sprint;
