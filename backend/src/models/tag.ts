import mongoose, { Schema, Model } from 'mongoose';
import { ITag } from '../types/index.js';

const tagSchema = new Schema<ITag>({
  name: {
    type: String,
    required: [true, 'Please provide a tag name'],
    trim: true,
    unique: true
  },
  color: {
    type: String,
    default: '#8b5cf6'
  }
}, {
  timestamps: true
});

const Tag: Model<ITag> = mongoose.model<ITag>('Tag', tagSchema);
export default Tag;
