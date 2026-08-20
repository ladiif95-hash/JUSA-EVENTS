import { Schema, model } from 'mongoose';
const notificationSchema = new Schema({ userId: { type: Schema.Types.ObjectId, ref: 'User' }, seminarId: { type: Schema.Types.ObjectId, ref: 'Seminar' }, type: String, channel: { type: String, default: 'EMAIL' }, recipient: String, subject: String, status: { type: String, enum: ['PENDING', 'SENT', 'FAILED'], default: 'PENDING' }, sentAt: Date, failedAt: Date, errorMessage: String }, { timestamps: true });
export const Notification = model('Notification', notificationSchema);
