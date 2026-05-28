import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, UserRole, Department } from '../types/index.js';

const userSchema = new Schema<IUser>({
  name: { type: String, required: [true, 'Please provide your name'], trim: true },
  email: {
    type: String, required: [true, 'Please provide your email'],
    unique: true, lowercase: true, trim: true, index: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: { type: String, required: [true, 'Please provide a password'], minlength: 6, select: false },
  role: {
    type: String,
    enum: { values: ['Super Admin', 'Admin', 'Project Manager', 'Developer', 'Designer', 'QA', 'Client'] as UserRole[], message: 'Invalid role' },
    default: 'Developer'
  },
  department: {
    type: String,
    enum: ['Engineering', 'Design', 'QA', 'Management', 'Operations', 'Client'] as Department[],
    default: 'Engineering'
  },
  avatar: { type: String, default: '' },
  timezone: { type: String, default: 'Asia/Kolkata' },
  isActive: { type: Boolean, default: true },
  notificationPreferences: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    popups: { type: Boolean, default: true }
  },
  lastLogin: { type: Date },
  
  // Phase 1 additions
  refreshTokens: [{ type: String }],
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  passwordChangedAt: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  metadata: {
    phone: { type: String, default: '' },
    position: { type: String, default: '' },
    bio: { type: String, default: '' }
  }
}, { timestamps: true });

userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (candidate: string, hash: string): Promise<boolean> {
  return bcrypt.compare(candidate, hash);
};

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
export default User;
