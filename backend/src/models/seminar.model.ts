import { Schema, model } from 'mongoose';

const seminarSchema = new Schema({
  title: { type: String, required: true, trim: true }, slug: { type: String, required: true, unique: true, lowercase: true }, shortDescription: { type: String, required: true }, description: { type: String, required: true }, coverImage: String,
  category: { type: String, required: true }, speaker: String, speakerPosition: String, organizer: { type: String, default: 'JUSA' }, venue: { type: String, required: true },
  startDateTime: { type: Date, required: true }, endDateTime: { type: Date, required: true }, capacity: { type: Number, min: 1, required: true },
  registrationOpenAt: Date, registrationCloseAt: { type: Date, required: true }, cancellationCloseAt: { type: Date, required: true },
  waitlistEnabled: { type: Boolean, default: true }, reminderEnabled: { type: Boolean, default: true }, featured: { type: Boolean, default: false },
  status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED', 'ARCHIVED'], default: 'DRAFT' }, createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
seminarSchema.index({ status: 1, startDateTime: 1 });
export const Seminar = model('Seminar', seminarSchema);
