import mongoose, { Schema, Model } from 'mongoose';
import { IRole } from '../types/index.js';

const roleSchema = new Schema<IRole>({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  permissions: [{ type: String }],
  description: { type: String, default: '' },
  isSystem: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const Role: Model<IRole> = mongoose.model<IRole>('Role', roleSchema);
export default Role;
