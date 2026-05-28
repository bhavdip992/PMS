import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'An attachment must belong to a project'],
    index: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    index: true
  },
  name: {
    type: String,
    required: [true, 'Attachment name is required']
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required']
  },
  fileType: {
    type: String,
    required: [true, 'File type is required']
  },
  sizeBytes: {
    type: Number
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Attachment must belong to an uploader']
  }
}, {
  timestamps: true
});

const Attachment = mongoose.model('Attachment', attachmentSchema);
export default Attachment;
