import mongoose, { Schema, Model } from 'mongoose';
import { IAuditLog } from '../types/index.js';

const auditLogSchema = new Schema<IAuditLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  action: { type: String, required: true, index: true },
  resource: { type: String, required: true, index: true },
  resourceId: { type: Schema.Types.ObjectId },
  oldValue: { type: String },
  newValue: { type: String },
  ipAddress: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now, index: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' }
});

const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
export default AuditLog;
