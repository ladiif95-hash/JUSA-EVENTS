import type { Request, Response } from 'express';
import { User } from '../models/user.model';
export async function getProfile(request: Request, response: Response) { const user = await User.findById(request.user!.id).select('-passwordHash'); return response.json({ data: user }); }
export async function updateProfile(request: Request, response: Response) { const allowed = ['fullName', 'phone', 'faculty', 'department', 'semester', 'gender', 'profilePhoto']; const updates = Object.fromEntries(Object.entries(request.body).filter(([key]) => allowed.includes(key))); const user = await User.findByIdAndUpdate(request.user!.id, updates, { new: true, runValidators: true }).select('-passwordHash'); return response.json({ data: user }); }
