import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: [
      function() { return !this.subtask; },
      'A comment must belong to either a task or a subtask'
    ],
    index: true
  },
  subtask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subtask',
    index: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A comment must have an author']
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isInternal: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

commentSchema.index({ task: 1, createdAt: 1 });
commentSchema.index({ subtask: 1, createdAt: 1 });

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
