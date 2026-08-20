import type { Request, Response } from 'express';
import { Registration } from '../models/registration.model';
import { Seminar } from '../models/seminar.model';
import { seatCounts } from '../services/registration.service';

const PLACEHOLDER = 'https://www.just.edu.so/assets/images/slider3.jpg';

export async function withCounts(seminar: { id?: string; _id?: unknown; capacity: number; coverImage?: string | null; toJSON?: () => object }) {
  const counts = await seatCounts(seminar.id ?? String(seminar._id));
  const remainingSeats = Math.max(0, seminar.capacity - counts.registered);
  return {
    ...(typeof seminar.toJSON === 'function' ? seminar.toJSON() : seminar),
    coverImage: seminar.coverImage || PLACEHOLDER,
    ...counts,
    remainingSeats,
  };
}

export async function listSeminars(request: Request, response: Response) {
  const now = new Date();
  const filter: Record<string, unknown> = {};
  const status = String(request.query.status || 'upcoming');
  if (status === 'past') {
    filter.$or = [{ status: { $in: ['COMPLETED', 'ARCHIVED'] } }, { startDateTime: { $lt: now }, status: { $ne: 'DRAFT' } }];
  } else if (status === 'all') {
    filter.status = { $in: ['PUBLISHED', 'COMPLETED', 'CANCELLED'] };
  } else {
    filter.status = 'PUBLISHED';
    filter.startDateTime = { $gte: now };
  }
  if (request.query.category && request.query.category !== 'All') filter.category = request.query.category;
  if (request.query.search) {
    filter.$and = [{ $or: [{ title: new RegExp(String(request.query.search), 'i') }, { description: new RegExp(String(request.query.search), 'i') }, { shortDescription: new RegExp(String(request.query.search), 'i') }] }];
  }
  if (request.query.featured === 'true') filter.featured = true;
  const seminars = await Seminar.find(filter).sort(request.query.sort === 'latest' ? { createdAt: -1 } : { startDateTime: 1 });
  const data = await Promise.all(seminars.map((seminar) => withCounts(seminar)));
  return response.json({ data });
}

export async function seminarDetails(request: Request, response: Response) {
  const seminar = await Seminar.findOne({ slug: request.params.slug });
  if (!seminar) return response.status(404).json({ message: 'Seminar not found' });
  const data = await withCounts(seminar);
  let myRegistration = null;
  if (request.user) {
    myRegistration = await Registration.findOne({ seminarId: seminar.id, userId: request.user.id });
  }
  return response.json({ data: { ...data, myRegistration } });
}
