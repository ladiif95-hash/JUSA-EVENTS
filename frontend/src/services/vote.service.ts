import { api } from './api';

export type VoteOption = {
  id: string;
  title: string;
  speaker?: string;
  description?: string;
  date?: string;
  image?: string;
  votes: number;
};

export type VotePoll = {
  id: string;
  title: string;
  description?: string;
  status: 'OPEN' | 'CLOSED';
  totalVotes: number;
  myVoteOptionId: string | null;
  winner: VoteOption | null;
  tiedWinners: VoteOption[];
  options: VoteOption[];
};

export const voteService = {
  current: () => api<{ data: VotePoll | null }>('/votes/current'),
  cast: (pollId: string, optionId: string) => api<{ data: VotePoll }>(`/votes/${pollId}/cast`, { method: 'POST', body: JSON.stringify({ optionId }) }),
  adminList: () => api<{ data: VotePoll[] }>('/admin/votes'),
  create: (payload: Record<string, unknown>) => api<{ data: VotePoll }>('/admin/votes', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: Record<string, unknown>) => api<{ data: VotePoll }>(`/admin/votes/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  remove: (id: string) => api<void>(`/admin/votes/${id}`, { method: 'DELETE' }),
};
