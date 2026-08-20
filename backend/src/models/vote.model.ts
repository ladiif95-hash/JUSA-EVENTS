import { Schema, model } from 'mongoose';

const voteSchema = new Schema({
  pollId: { type: Schema.Types.ObjectId, ref: 'VotePoll', required: true },
  optionId: { type: Schema.Types.ObjectId, ref: 'VoteOption', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

voteSchema.index({ pollId: 1, userId: 1 }, { unique: true });
voteSchema.index({ optionId: 1 });
export const Vote = model('Vote', voteSchema);
