import mongoose, { Schema, Model } from 'mongoose';
import { ILoginHistory } from '../types/index.js';

const loginHistorySchema = new Schema<ILoginHistory>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  device: { type: String, default: '' },
  browser: { type: String, default: '' },
  os: { type: String, default: '' },
  status: { type: String, enum: ['success', 'failed'], required: true },
  timestamp: { type: Date, default: Date.now },
  location: { type: String, default: '' }
});

const LoginHistory: Model<ILoginHistory> = mongoose.model<ILoginHistory>('LoginHistory', loginHistorySchema);
export default LoginHistory;
