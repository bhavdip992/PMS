import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A milestone must have a name'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  dueDate: {
    type: Date
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'A milestone must belong to a project'],
    index: true
  },
  status: {
    type: String,
    enum: ['Active', 'Achieved'],
    default: 'Active'
  }
}, {
  timestamps: true
});

const Milestone = mongoose.model('Milestone', milestoneSchema);
export default Milestone;
