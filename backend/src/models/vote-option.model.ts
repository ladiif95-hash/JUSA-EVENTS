import { Schema, model } from 'mongoose';

const voteOptionSchema = new Schema({
  pollId: { type: Schema.Types.ObjectId, ref: 'VotePoll', required: true, index: true },
  title: { type: String, required: true, trim: true },
  speaker: { type: String, default: '' },
  description: { type: String, default: '' },
  date: { type: String, default: '' },
  image: { type: String, default: '' },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

export const VoteOption = model('VoteOption', voteOptionSchema);
