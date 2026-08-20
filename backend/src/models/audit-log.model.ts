import { Schema, model } from 'mongoose';
const auditLogSchema = new Schema({ adminId: { type: Schema.Types.ObjectId, ref: 'User' }, action: String, entityType: String, entityId: String, metadata: Schema.Types.Mixed, timestamp: { type: Date, default: Date.now } });
export const AuditLog = model('AuditLog', auditLogSchema);
