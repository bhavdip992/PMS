import mongoose, { Schema, Model } from 'mongoose';
import { ISession } from '../types/index.js';

const sessionSchema = new Schema<ISession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  refreshToken: { type: String, required: true, unique: true },
  deviceInfo: { type: String, default: '' },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  lastActive: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  isRevoked: { type: Boolean, default: false }
}, { timestamps: true });

const Session: Model<ISession> = mongoose.model<ISession>('Session', sessionSchema);
export default Session;
