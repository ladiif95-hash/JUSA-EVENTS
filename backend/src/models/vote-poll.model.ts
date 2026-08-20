import { Schema, model } from 'mongoose';

const votePollSchema = new Schema({
  title: { type: String, required: true, trim: true, default: 'Choose the next seminar' },
  description: { type: String, default: 'Vote for the seminar you want to attend. You can vote only once.' },
  status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

votePollSchema.index({ status: 1, createdAt: -1 });
export const VotePoll = model('VotePoll', votePollSchema);
