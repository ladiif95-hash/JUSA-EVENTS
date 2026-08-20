import type { Request, Response } from 'express';
import { Attendance } from '../models/attendance.model';
import { AuditLog } from '../models/audit-log.model';
import { Registration } from '../models/registration.model';
import { Seminar } from '../models/seminar.model';
import { User } from '../models/user.model';
import { hashToken } from '../utils/auth';
import { withCounts } from './seminar.controller';
import * as XLSX from 'xlsx';
import bcrypt from 'bcryptjs';

const audit = (request: Request, action: string, entityType: string, entityId: string) => AuditLog.create({ adminId: request.user!.id, action, entityType, entityId, metadata: request.body });

function extractQrToken(raw: string) {
  const value = String(raw || '').trim();
  if (!value) return '';
  try {
    const url = new URL(value);
    return url.searchParams.get('token') || url.searchParams.get('qr') || value;
  } catch {
    const prefixed = value.match(/^JUSA1:(.+)$/i);
    return prefixed?.[1] || value;
  }
}

function studentPayload(user: any) {
  return {
    fullName: user?.fullName || 'JUSA Student',
    email: user?.email || '',
    phone: user?.phone || '',
    faculty: user?.faculty || '',
    department: user?.department || '',
    semester: user?.semester || '',
    gender: user?.gender || '',
  };
}
export async function dashboard(_request: Request, response: Response) {
  const [totalSeminars, registrations, waitlisted, cancelled, attendance, upcomingSeminars] = await Promise.all([
    Seminar.countDocuments(),
    Registration.countDocuments({ status: 'REGISTERED' }),
    Registration.countDocuments({ status: 'WAITLISTED' }),
    Registration.countDocuments({ status: 'CANCELLED' }),
    Attendance.countDocuments({ status: 'CHECKED_IN' }),
    Seminar.countDocuments({ status: 'PUBLISHED', startDateTime: { $gt: new Date() } }),
  ]);

  // Semester breakdown across registrations
  const regSemesterRaw = await Registration.aggregate<{ _id: string; count: number }>([
    { $match: { status: { $in: ['REGISTERED', 'WAITLISTED'] } } },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $group: {
        _id: { $ifNull: ['$user.semester', 'Unspecified'] },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const userSemesterRaw = await User.aggregate<{ _id: string; count: number }>([
    { $match: { role: 'STUDENT', semester: { $exists: true, $ne: '' } } },
    { $group: { _id: '$semester', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const activeSemesterSource = regSemesterRaw.length > 0 ? regSemesterRaw : userSemesterRaw;
  const totalSemesterCount = activeSemesterSource.reduce((acc, s) => acc + s.count, 0);
  const semesterStats = activeSemesterSource.map((item) => ({
    semester: item._id || 'Unspecified',
    count: item.count,
    percentage: totalSemesterCount > 0 ? Math.round((item.count / totalSemesterCount) * 100) : 0,
  }));

  // Gender breakdown across registrations
  const regGenderRaw = await Registration.aggregate<{ _id: string; count: number }>([
    { $match: { status: { $in: ['REGISTERED', 'WAITLISTED'] } } },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $group: {
        _id: { $ifNull: ['$user.gender', 'OTHER'] },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const userGenderRaw = await User.aggregate<{ _id: string; count: number }>([
    { $match: { role: 'STUDENT', gender: { $exists: true, $ne: '' } } },
    { $group: { _id: '$gender', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const activeGenderSource = regGenderRaw.length > 0 ? regGenderRaw : userGenderRaw;
  const totalGenderCount = activeGenderSource.reduce((acc, g) => acc + g.count, 0);
  const genderStats = activeGenderSource.map((item) => ({
    gender: item._id === 'MALE' ? 'Male' : item._id === 'FEMALE' ? 'Female' : 'Other',
    rawGender: item._id,
    count: item.count,
    percentage: totalGenderCount > 0 ? Math.round((item.count / totalGenderCount) * 100) : 0,
  }));

  return response.json({
    data: {
      totalSeminars,
      upcomingSeminars,
      registrations,
      attendance,
      waitlisted,
      cancelled,
      semesterStats,
      genderStats,
      totalApplicants: totalSemesterCount,
    },
  });
}

export async function listSeminars(_request: Request, response: Response) {
  const seminars = await Seminar.find().sort({ startDateTime: -1 });
  const data = await Promise.all(seminars.map((seminar) => withCounts(seminar)));
  return response.json({ data });
}

export async function createSeminar(request: Request, response: Response) {
  const title = String(request.body.title || '').trim();
  const capacity = Number(request.body.capacity);
  if (!title || !request.body.startDateTime || !capacity) {
    return response.status(400).json({ message: 'Title, start date and capacity are required' });
  }
  const startDateTime = new Date(request.body.startDateTime);
  const endDateTime = request.body.endDateTime ? new Date(request.body.endDateTime) : new Date(startDateTime.getTime() + 3 * 60 * 60 * 1000);
  const description = String(request.body.description || request.body.shortDescription || title);
  const shortDescription = String(request.body.shortDescription || description).slice(0, 220);
  const slug = String(request.body.slug || title).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const seminar = await Seminar.create({
    title,
    slug,
    shortDescription,
    description,
    coverImage: request.body.coverImage || undefined,
    category: request.body.category || 'Education',
    speaker: request.body.speaker || 'JUSA',
    speakerPosition: request.body.speakerPosition || 'Guest speaker',
    organizer: request.body.organizer || 'JUSA',
    venue: request.body.venue || 'JUST Main Campus',
    startDateTime,
    endDateTime,
    capacity,
    registrationOpenAt: request.body.registrationOpenAt ? new Date(request.body.registrationOpenAt) : new Date(),
    registrationCloseAt: request.body.registrationCloseAt ? new Date(request.body.registrationCloseAt) : startDateTime,
    cancellationCloseAt: request.body.cancellationCloseAt ? new Date(request.body.cancellationCloseAt) : startDateTime,
    waitlistEnabled: request.body.waitlistEnabled !== false,
    featured: Boolean(request.body.featured),
    status: request.body.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
    createdBy: request.user!.id,
  });
  await audit(request, 'CREATE', 'SEMINAR', seminar.id);
  return response.status(201).json({ data: seminar });
}
export async function updateSeminar(request: Request, response: Response) { const seminar = await Seminar.findByIdAndUpdate(request.params.id, request.body, { new: true, runValidators: true }); if (!seminar) return response.status(404).json({ message: 'Seminar not found' }); await audit(request, 'UPDATE', 'SEMINAR', seminar.id); return response.json({ data: seminar }); }
export async function participants(request: Request, response: Response) { const filter: any = { seminarId: String(request.params.id) }; if (request.query.status) filter.status = String(request.query.status); const data = await Registration.find(filter).populate('userId', 'fullName email phone faculty department semester').populate('seminarId', 'title').sort({ registeredAt: 1 }); return response.json({ data }); }
export async function checkIn(request: Request, response: Response) {
  const qrToken = extractQrToken(String(request.body.qrToken || ''));
  if (!qrToken) return response.status(400).json({ message: 'QR token is required' });
  const query: Record<string, unknown> = { qrTokenHash: hashToken(qrToken), status: 'REGISTERED' };
  if (request.body.seminarId) query.seminarId = request.body.seminarId;
  const registration = await Registration.findOne(query)
    .populate('userId', 'fullName email phone faculty department semester gender')
    .populate('seminarId', 'title venue startDateTime');
  if (!registration) {
    return response.status(404).json({ code: 'INVALID_TOKEN', message: 'This QR pass is invalid or expired.' });
  }
  const seminar = registration.seminarId as { title?: string; venue?: string; startDateTime?: Date };
  const student = studentPayload(registration.userId);
  const payload = {
    student,
    seminar: { title: seminar?.title || 'JUSA Seminar', venue: seminar?.venue || '', startDateTime: seminar?.startDateTime },
    registration: { id: registration.id, reference: registration.reference, status: registration.status },
  };
  const existing = await Attendance.findOne({ registrationId: registration.id });
  if (existing?.status === 'CHECKED_IN') {
    return response.json({
      message: 'Already checked in',
      data: { ...payload, attendance: existing, alreadyCheckedIn: true },
    });
  }
  const attendance = await Attendance.findOneAndUpdate(
    { registrationId: registration.id },
    {
      seminarId: registration.seminarId,
      userId: registration.userId,
      registrationId: registration.id,
      status: 'CHECKED_IN',
      checkedInAt: new Date(),
      checkInMethod: request.body.method === 'MANUAL' ? 'MANUAL' : 'QR',
      checkedInBy: request.user!.id,
    },
    { new: true, upsert: true },
  );
  await audit(request, 'CHECK_IN', 'REGISTRATION', registration.id);
  return response.json({
    message: 'Check-in successful',
    data: { ...payload, attendance, alreadyCheckedIn: false },
  });
}
export async function report(request: Request, response: Response) { const seminar = await Seminar.findById(request.params.seminarId); if (!seminar) return response.status(404).json({ message: 'Seminar not found' }); const [registered, waitlisted, cancelled, attended] = await Promise.all([Registration.countDocuments({ seminarId: seminar.id, status: 'REGISTERED' }), Registration.countDocuments({ seminarId: seminar.id, status: 'WAITLISTED' }), Registration.countDocuments({ seminarId: seminar.id, status: 'CANCELLED' }), Attendance.countDocuments({ seminarId: seminar.id, status: 'CHECKED_IN' })]); return response.json({ data: { capacity: seminar.capacity, registered, waitlisted, cancelled, attended, absent: Math.max(0, registered - attended), attendanceRate: registered ? Number((attended / registered * 100).toFixed(1)) : 0 } }); }
export async function users(request: Request, response: Response) {
  const isSuperAdmin = request.user?.role === 'SUPER_ADMIN';
  // SUPER_ADMIN sees ADMIN + STAFF (students are public users, not managed here)
  // ADMIN sees STAFF only
  const filter = isSuperAdmin
    ? { role: { $in: ['ADMIN', 'STAFF'] } }
    : { role: 'STAFF' };
  return response.json({ data: await User.find(filter).select('-passwordHash').sort({ createdAt: -1 }) });
}

export async function createUser(request: Request, response: Response) {
  const fullName = String(request.body.fullName || '').trim();
  const email = String(request.body.email || '').trim().toLowerCase();
  const password = String(request.body.password || '');
  const requestedRole = String(request.body.role || 'STAFF').toUpperCase();
  const allowedRoles = ['STAFF', 'ADMIN', 'SUPER_ADMIN'];
  const role = allowedRoles.includes(requestedRole) ? requestedRole : 'STAFF';

  if (!fullName || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
    return response.status(400).json({ message: 'Name, valid email and a password of at least 8 characters are required' });
  }
  // ADMIN can only create STAFF; only SUPER_ADMIN can create ADMIN or SUPER_ADMIN
  if (request.user?.role !== 'SUPER_ADMIN' && role !== 'STAFF') {
    return response.status(403).json({ message: 'Only Super Administrators can create Admin accounts.' });
  }
  // Nobody can create another SUPER_ADMIN except an existing SUPER_ADMIN
  if (role === 'SUPER_ADMIN' && request.user?.role !== 'SUPER_ADMIN') {
    return response.status(403).json({ message: 'Only Super Administrators can assign the Super Admin role.' });
  }
  if (await User.exists({ email })) {
    return response.status(409).json({ message: 'A user with this email already exists' });
  }
  const user = await User.create({
    fullName,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role,
    status: 'ACTIVE',
    authProvider: 'LOCAL',
  });
  await audit(request, 'CREATE', 'USER', user.id);
  return response.status(201).json({ data: await User.findById(user.id).select('-passwordHash') });
}

export async function updateUser(request: Request, response: Response) {
  const userId = String(request.params.id);
  if (userId === request.user!.id) {
    return response.status(400).json({ message: 'You cannot modify your own account here.' });
  }
  const target = await User.findById(userId);
  if (!target) return response.status(404).json({ message: 'User not found' });
  // Only SUPER_ADMIN can edit ADMIN or SUPER_ADMIN accounts
  if ((target.role === 'SUPER_ADMIN' || target.role === 'ADMIN') && request.user?.role !== 'SUPER_ADMIN') {
    return response.status(403).json({ message: 'Only Super Administrators can edit Admin accounts.' });
  }
  // Prevent upgrading someone to SUPER_ADMIN unless requester is SUPER_ADMIN
  const newRole = String(request.body.role || target.role).toUpperCase();
  if (newRole === 'SUPER_ADMIN' && request.user?.role !== 'SUPER_ADMIN') {
    return response.status(403).json({ message: 'Only Super Administrators can assign the Super Admin role.' });
  }
  const allowedFields: Record<string, unknown> = {};
  if (request.body.fullName) allowedFields.fullName = String(request.body.fullName).trim();
  if (request.body.role) allowedFields.role = newRole;
  if (request.body.status) allowedFields.status = request.body.status;
  const updated = await User.findByIdAndUpdate(userId, allowedFields, { new: true }).select('-passwordHash');
  await audit(request, 'UPDATE', 'USER', userId);
  return response.json({ data: updated });
}



export async function deleteUser(request: Request, response: Response) {
  const userId = String(request.params.id);
  if (userId === request.user!.id) {
    return response.status(400).json({ message: 'You cannot delete your own administrator account.' });
  }
  const user = await User.findById(userId);
  if (!user) return response.status(404).json({ message: 'User not found' });
  if ((user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && request.user?.role !== 'SUPER_ADMIN') {
    return response.status(403).json({ message: 'Only Super Administrators can delete Administrator or Super Admin accounts.' });
  }
  if (await Registration.exists({ userId })) {
    return response.status(409).json({ message: 'This user has event registrations and cannot be deleted.' });
  }
  await User.findByIdAndDelete(userId);
  await audit(request, 'DELETE', 'USER', userId);
  return response.status(204).send();
}
export async function exportParticipants(request: Request, response: Response) { const records = await Registration.find({ seminarId: request.params.id }).populate('userId', 'fullName email phone faculty department semester').populate('seminarId', 'title').sort({ registeredAt: 1 }); const rows = records.map((record: any) => ({ Name: record.userId?.fullName, Email: record.userId?.email, Phone: record.userId?.phone, Faculty: record.userId?.faculty, Department: record.userId?.department, Semester: record.userId?.semester, 'Registration Status': record.status, 'Registered At': record.registeredAt?.toISOString() })); const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(rows), 'Participants'); const buffer = XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }); response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); response.setHeader('Content-Disposition', 'attachment; filename="jusa-participants.xlsx"'); return response.send(buffer); }
