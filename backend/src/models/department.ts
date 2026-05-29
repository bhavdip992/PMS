import mongoose, { Schema, Model } from 'mongoose';
import { IDepartment } from '../types/index.js';

const departmentSchema = new Schema<IDepartment>({
  name: {
    type: String,
    required: [true, 'Please provide a department name'],
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    required: [true, 'Please provide a slug'],
    trim: true,
    unique: true,
    lowercase: true
  },
  head: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A department must have a head']
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

const Department: Model<IDepartment> = mongoose.model<IDepartment>('Department', departmentSchema);
export default Department;
