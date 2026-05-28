import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'A meeting must have a title'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    index: true
  },
  startTime: {
    type: Date,
    required: [true, 'A meeting must have a start time']
  },
  endTime: {
    type: Date,
    required: [true, 'A meeting must have an end time']
  },
  meetingLink: {
    type: String,
    required: [true, 'A meeting must have a link (e.g. Google Meet, Zoom)']
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A meeting must have a creator']
  }
}, {
  timestamps: true
});

const Meeting = mongoose.model('Meeting', meetingSchema);
export default Meeting;
