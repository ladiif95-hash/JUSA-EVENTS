import mongoose from 'mongoose';
import QRCode from 'qrcode';
import { Attendance } from '../models/attendance.model';
import { Registration } from '../models/registration.model';
import { Seminar } from '../models/seminar.model';
import { User } from '../models/user.model';
import { createQrToken, hashToken } from '../utils/auth';

function referenceFor(id: string) {
  return `JUSA-${id.slice(-8).toUpperCase()}`;
}

async function runWithOptionalTransaction<T>(work: (session: mongoose.ClientSession | null) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result!: T;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (/transaction|replica set|mongos/i.test(message)) return work(null);
    throw error;
  } finally {
    await session.endSession();
  }
}

export async function registerForSeminar(seminarId: string, userId: string) {
  return runWithOptionalTransaction(async (session) => {
    const seminar = await Seminar.findById(seminarId).session(session);
    if (!seminar || seminar.status !== 'PUBLISHED') throw new Error('Seminar is not available');
    const now = new Date();
    if (seminar.registrationOpenAt && seminar.registrationOpenAt > now) throw new Error('Registration is not open yet');
    if (seminar.registrationCloseAt < now) throw new Error('Registration has closed');
    const existing = await Registration.findOne({ seminarId, userId }).session(session);
    if (existing && existing.status !== 'CANCELLED') throw new Error('You already have a registration for this seminar');
    const registered = await Registration.countDocuments({ seminarId, status: 'REGISTERED' }).session(session);
    if (registered >= seminar.capacity && !seminar.waitlistEnabled) throw new Error('Seminar is full');
    const status = registered < seminar.capacity ? 'REGISTERED' : 'WAITLISTED';
    const qrToken = status === 'REGISTERED' ? createQrToken() : undefined;
    const payload = {
      status,
      registeredAt: now,
      cancelledAt: undefined,
      qrToken,
      qrTokenHash: qrToken ? hashToken(qrToken) : undefined,
    };
    let registration;
    if (existing) {
      registration = await Registration.findByIdAndUpdate(existing._id, payload, { new: true, session });
    } else {
      const created = await Registration.create([{ seminarId, userId, ...payload }], { session });
      registration = created[0];
    }
    if (!registration) throw new Error('Unable to create registration');
    if (!registration.reference) {
      registration.reference = referenceFor(String(registration._id));
      await registration.save({ session });
    }
    if (status === 'REGISTERED') {
      await Attendance.findOneAndUpdate(
        { registrationId: registration._id },
        { seminarId, userId, registrationId: registration._id, status: 'NOT_CHECKED_IN' },
        { upsert: true, session },
      );
    }
    const waitlistPosition = status === 'WAITLISTED'
      ? await Registration.countDocuments({ seminarId, status: 'WAITLISTED', registeredAt: { $lte: registration.registeredAt } }).session(session)
      : undefined;
    return { registration, waitlistPosition };
  });
}

export async function cancelRegistration(idOrSeminarId: string, userId: string) {
  return runWithOptionalTransaction(async (session) => {
    let registration = await Registration.findOne({ seminarId: idOrSeminarId, userId, status: { $in: ['REGISTERED', 'WAITLISTED'] } }).session(session);
    if (!registration) {
      registration = await Registration.findOne({ _id: idOrSeminarId, userId, status: { $in: ['REGISTERED', 'WAITLISTED'] } }).session(session);
    }
    if (!registration) throw new Error('Active registration not found');
    const seminar = await Seminar.findById(registration.seminarId).session(session);
    if (!seminar) throw new Error('Seminar not found');
    if (registration.status === 'REGISTERED' && seminar.cancellationCloseAt && seminar.cancellationCloseAt < new Date()) {
      throw new Error('Cancellation period has ended.');
    }
    const seminarId = String(seminar._id);
    const wasRegistered = registration.status === 'REGISTERED';
    registration.status = 'CANCELLED';
    registration.cancelledAt = new Date();
    registration.qrToken = undefined;
    registration.qrTokenHash = undefined;
    await registration.save({ session });
    let promoted: { userId: string; registrationId: string } | undefined;
    if (wasRegistered && seminar.status === 'PUBLISHED') {
      const waitlisted = await Registration.findOne({ seminarId, status: 'WAITLISTED' }).sort({ registeredAt: 1 }).session(session);
      if (waitlisted) {
        const token = createQrToken();
        waitlisted.status = 'REGISTERED';
        waitlisted.promotedFromWaitlistAt = new Date();
        waitlisted.qrToken = token;
        waitlisted.qrTokenHash = hashToken(token);
        await waitlisted.save({ session });
        await Attendance.findOneAndUpdate(
          { registrationId: waitlisted._id },
          { seminarId, userId: waitlisted.userId, registrationId: waitlisted._id, status: 'NOT_CHECKED_IN' },
          { upsert: true, session },
        );
        promoted = { userId: String(waitlisted.userId), registrationId: String(waitlisted._id) };
      }
    }
    return { registration, promoted };
  });
}

export async function getQrDataUrl(registrationId: string, userId: string) {
  const registration = await Registration.findOne({ _id: registrationId, userId }).populate('seminarId').populate('userId', 'fullName email');
  if (!registration || registration.status === 'CANCELLED') throw new Error('This Registration Was Cancelled');
  if (registration.status !== 'REGISTERED' || !registration.qrToken) throw new Error('QR pass is unavailable');
  const dataUrl = await QRCode.toDataURL(registration.qrToken, { width: 360, margin: 2, color: { dark: '#087346', light: '#FFFFFFFF' } });
  const attendance = await Attendance.findOne({ registrationId: registration._id });
  return { dataUrl, registration, attendance };
}

export async function waitlistPosition(seminarId: string, registration: { registeredAt: Date }) {
  return Registration.countDocuments({ seminarId, status: 'WAITLISTED', registeredAt: { $lte: registration.registeredAt } });
}

export async function seatCounts(seminarId: string) {
  const [registered, waitlisted, cancelled] = await Promise.all([
    Registration.countDocuments({ seminarId, status: 'REGISTERED' }),
    Registration.countDocuments({ seminarId, status: 'WAITLISTED' }),
    Registration.countDocuments({ seminarId, status: 'CANCELLED' }),
  ]);
  return { registered, waitlisted, cancelled };
}

export async function notifyPromotion(promoted?: { userId: string; registrationId: string }) {
  if (!promoted) return;
  const user = await User.findById(promoted.userId);
  const registration = await Registration.findById(promoted.registrationId).populate('seminarId');
  return { user, registration };
}
