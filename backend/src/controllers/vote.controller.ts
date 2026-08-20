import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Vote } from '../models/vote.model';
import { VoteOption } from '../models/vote-option.model';
import { VotePoll } from '../models/vote-poll.model';
import * as XLSX from 'xlsx';

function asId(value: { id?: string; _id?: unknown }) {
  return value.id || String(value._id);
}

function parseOptions(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const option = item as Record<string, unknown>;
    return {
      title: String(option.title || '').trim(),
      speaker: String(option.speaker || '').trim(),
      description: String(option.description || '').trim(),
      date: String(option.date || '').trim(),
      image: String(option.image || '').trim(),
      sortOrder: Number(option.sortOrder ?? index),
    };
  }).filter((option) => option.title);
}

async function serializePoll(poll: { id?: string; _id?: unknown; toJSON?: () => object }, userId?: string) {
  const pollId = asId(poll);
  const options = await VoteOption.find({ pollId }).sort({ sortOrder: 1, createdAt: 1 });
  const counts = await Vote.aggregate<{ _id: mongoose.Types.ObjectId; votes: number }>([
    { $match: { pollId: new mongoose.Types.ObjectId(pollId) } },
    { $group: { _id: '$optionId', votes: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((row) => [String(row._id), row.votes]));
  const withVotes = options.map((option) => ({
    ...option.toJSON(),
    id: option.id,
    votes: countMap.get(option.id) || 0,
  }));
  const totalVotes = withVotes.reduce((sum, option) => sum + option.votes, 0);
  const maxVotes = Math.max(0, ...withVotes.map((option) => option.votes));
  const winners = maxVotes > 0 ? withVotes.filter((option) => option.votes === maxVotes) : [];
  const mine = userId ? await Vote.findOne({ pollId, userId }) : null;
  return {
    ...(typeof poll.toJSON === 'function' ? poll.toJSON() : poll),
    id: pollId,
    totalVotes,
    myVoteOptionId: mine ? String(mine.optionId) : null,
    winner: winners.length === 1 ? winners[0] : null,
    tiedWinners: winners.length > 1 ? winners : [],
    options: withVotes,
  };
}

export async function currentPoll(request: Request, response: Response) {
  const poll = await VotePoll.findOne({ status: 'OPEN' }).sort({ createdAt: -1 });
  if (!poll) return response.json({ data: null });
  return response.json({ data: await serializePoll(poll, request.user?.id) });
}

export async function castVote(request: Request, response: Response) {
  if (request.user?.role !== 'STUDENT') {
    return response.status(403).json({ message: 'Only students can vote for the next seminar.' });
  }
  const poll = await VotePoll.findById(request.params.pollId);
  if (!poll || poll.status !== 'OPEN') return response.status(404).json({ message: 'This vote is closed or not available.' });
  const optionId = String(request.body.optionId || '');
  const option = await VoteOption.findOne({ _id: optionId, pollId: poll.id });
  if (!option) return response.status(400).json({ message: 'Choose a valid seminar option.' });
  try {
    await Vote.create({ pollId: poll.id, optionId: option.id, userId: request.user.id });
  } catch (error) {
    const duplicate = error && typeof error === 'object' && 'code' in error && error.code === 11000;
    if (duplicate) return response.status(409).json({ message: 'You have already voted. Each student can vote only once.' });
    throw error;
  }
  return response.status(201).json({ data: await serializePoll(poll, request.user.id) });
}

export async function listPolls(_request: Request, response: Response) {
  const polls = await VotePoll.find().sort({ createdAt: -1 });
  const data = await Promise.all(polls.map((poll) => serializePoll(poll)));
  return response.json({ data });
}

export async function createPoll(request: Request, response: Response) {
  const options = parseOptions(request.body.options);
  if (options.length < 2) return response.status(400).json({ message: 'Add at least two seminar options.' });
  const title = String(request.body.title || 'Choose the next seminar').trim();
  await VotePoll.updateMany({ status: 'OPEN' }, { status: 'CLOSED' });
  const poll = await VotePoll.create({
    title,
    description: String(request.body.description || 'Vote for the seminar you want to attend. You can vote only once.'),
    status: request.body.status === 'CLOSED' ? 'CLOSED' : 'OPEN',
    createdBy: request.user!.id,
  });
  await VoteOption.insertMany(options.map((option) => ({ ...option, pollId: poll.id })));
  return response.status(201).json({ data: await serializePoll(poll) });
}

export async function updatePoll(request: Request, response: Response) {
  const poll = await VotePoll.findById(request.params.id);
  if (!poll) return response.status(404).json({ message: 'Vote not found' });
  if (request.body.title) poll.title = String(request.body.title).trim();
  if (request.body.description != null) poll.description = String(request.body.description);
  if (request.body.status === 'OPEN' || request.body.status === 'CLOSED') {
    if (request.body.status === 'OPEN') await VotePoll.updateMany({ _id: { $ne: poll.id }, status: 'OPEN' }, { status: 'CLOSED' });
    poll.status = request.body.status;
  }
  await poll.save();
  const incoming = parseOptions(request.body.options);
  if (incoming.length) {
    const existing = await VoteOption.find({ pollId: poll.id }).sort({ sortOrder: 1, createdAt: 1 });
    for (const [index, option] of incoming.entries()) {
      const current = existing[index];
      if (current) {
        current.title = option.title;
        current.speaker = option.speaker;
        current.description = option.description;
        current.date = option.date;
        current.image = option.image;
        current.sortOrder = option.sortOrder;
        await current.save();
      } else {
        await VoteOption.create({ ...option, pollId: poll.id });
      }
    }
  }
  return response.json({ data: await serializePoll(poll) });
}

export async function deletePoll(request: Request, response: Response) {
  const poll = await VotePoll.findById(request.params.id);
  if (!poll) return response.status(404).json({ message: 'Vote not found' });
  await Vote.deleteMany({ pollId: poll.id });
  await VoteOption.deleteMany({ pollId: poll.id });
  await VotePoll.findByIdAndDelete(poll.id);
  return response.status(204).send();
}

export async function exportVoteReport(request: Request, response: Response) {
  const poll = await VotePoll.findById(request.params.id);
  if (!poll) return response.status(404).json({ message: 'Vote not found' });
  const serialized = await serializePoll(poll);
  
  const summaryRows = [
    { Field: 'Vote Title', Value: poll.title },
    { Field: 'Status', Value: poll.status },
    { Field: 'Total Votes Cast', Value: serialized.totalVotes },
    { Field: 'Winner', Value: serialized.winner ? (serialized.winner as any).title : 'No winner yet' },
  ];

  const optionRows = serialized.options.map((option, idx) => ({
    Rank: idx + 1,
    'Option Title': option.title,
    'Votes Count': option.votes,
    'Percentage (%)': serialized.totalVotes > 0 ? Number(((option.votes / serialized.totalVotes) * 100).toFixed(1)) : 0,
  }));

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(summaryRows), 'Summary');
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(optionRows), 'Results');
  const buffer = XLSX.write(book, { type: 'buffer', bookType: 'xlsx' });
  response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  response.setHeader('Content-Disposition', `attachment; filename="jusa-vote-results-${poll.id}.xlsx"`);
  return response.send(buffer);
}
