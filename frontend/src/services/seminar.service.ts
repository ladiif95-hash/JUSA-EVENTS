import { api } from './api';
import type { Seminar } from '../types/seminar.types';
import type { Registration } from '../types/registration.types';

function formatClock(value: Date) {
  return value.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function mapSeminar(raw: Seminar & { _id?: string; coverImage?: string; registered?: number; myRegistration?: { id?: string; _id?: string; status: string } | null }): Seminar {
  const start = raw.startDateTime ? new Date(raw.startDateTime) : null;
  const end = raw.endDateTime ? new Date(raw.endDateTime) : null;
  const reserved = raw.reserved ?? raw.registered ?? 0;
  const mine = raw.myRegistration;
  return {
    ...raw,
    id: raw.id || raw._id || '',
    image: raw.image || raw.coverImage || '',
    reserved,
    remainingSeats: raw.remainingSeats ?? Math.max(0, raw.capacity - reserved),
    date: start ? start.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : raw.date,
    time: start ? (end ? `${formatClock(start)} – ${formatClock(end)}` : formatClock(start)) : raw.time,
    speaker: raw.speaker || 'JUSA',
    speakerPosition: raw.speakerPosition || 'Guest speaker',
    myRegistration: mine ? { id: mine.id || mine._id || '', status: mine.status } : null,
  };
}

export type DashboardData = {
  totalSeminars: number;
  upcomingSeminars: number;
  registrations: number;
  attendance: number;
  waitlisted: number;
  cancelled: number;
  totalApplicants: number;
  semesterStats: { semester: string; count: number; percentage: number }[];
  genderStats: { gender: string; rawGender?: string; count: number; percentage: number }[];
};

export const seminarService = {
  list: () => api<{ data: Seminar[] }>('/seminars'),
  get: (slug: string) => api<{ data: Seminar }>(`/seminars/${slug}`),
  register: (id: string) => api<{ data: Registration }>(`/seminars/${id}/register`, { method: 'POST' }),
  cancel: (id: string) => api(`/seminars/${id}/cancel`, { method: 'POST' }),
  myEvents: () => api<{ data: Registration[] }>('/my-events'),
  qr: (id: string) => api<{ dataUrl: string; registration: { reference?: string; seminarId?: { title?: string; venue?: string; startDateTime?: string; endDateTime?: string }; userId?: { fullName?: string } } }>(`/registrations/${id}/qr`),
  adminList: () => api<{ data: Seminar[] }>('/admin/seminars'),
  dashboard: () => api<{ data: DashboardData }>('/admin/dashboard'),
  create: (payload: Record<string, unknown>) => api<{ data: Seminar }>('/admin/seminars', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: Record<string, unknown>) => api<{ data: Seminar }>(`/admin/seminars/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  participants: (id: string, status?: string) => api<{ data: unknown[] }>(`/admin/seminars/${id}/participants${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  report: (id: string) => api<{ data: { capacity: number; registered: number; waitlisted: number; cancelled: number; attended: number; absent: number; attendanceRate: number } }>(`/admin/reports/${id}`),
};
