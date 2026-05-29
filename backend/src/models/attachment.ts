import mongoose from 'mongoose';

const versionSchema = new mongoose.Schema({
  version: {
    type: Number,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  sizeBytes: {
    type: Number
  },
  checksum: {
    type: String
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const attachmentCommentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

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
  subtask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subtask',
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
  mimeType: {
    type: String
  },
  sizeBytes: {
    type: Number
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Attachment must belong to an uploader']
  },
  version: {
    type: Number,
    default: 1
  },
  versionHistory: [versionSchema],
  checksum: {
    type: String
  },
  thumbnailUrl: {
    type: String
  },
  previewUrl: {
    type: String
  },
  permissions: {
    type: String,
    enum: ['public', 'private', 'internal'],
    default: 'public'
  },
  attachedTo: {
    id: {
      type: mongoose.Schema.Types.ObjectId
    },
    onModel: {
      type: String,
      enum: ['Project', 'Task', 'Subtask', 'Comment', 'Communication']
    }
  },
  comments: [attachmentCommentSchema],
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Attachment = mongoose.model('Attachment', attachmentSchema);
export default Attachment;
