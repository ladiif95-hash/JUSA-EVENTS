import { Schema, model } from 'mongoose';

const registrationSchema = new Schema({
  seminarId: { type: Schema.Types.ObjectId, ref: 'Seminar', required: true }, userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['REGISTERED', 'WAITLISTED', 'CANCELLED'], required: true }, reference: { type: String, unique: true, sparse: true }, qrTokenHash: String, qrToken: String,
  registeredAt: { type: Date, default: Date.now }, cancelledAt: Date, promotedFromWaitlistAt: Date,
}, { timestamps: true });
registrationSchema.index({ seminarId: 1, userId: 1 }, { unique: true });
registrationSchema.index({ seminarId: 1, status: 1, registeredAt: 1 });
export const Registration = model('Registration', registrationSchema);
