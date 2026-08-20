import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  fullName: { type: String, required: true, trim: true }, email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: String, passwordHash: String, googleId: { type: String, unique: true, sparse: true }, authProvider: { type: String, enum: ['LOCAL', 'GOOGLE'], default: 'LOCAL' }, resetTokenHash: String, resetTokenExpiresAt: Date,
  faculty: String, department: String, semester: String, gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'] }, profilePhoto: String,
  role: { type: String, enum: ['STUDENT', 'ADMIN', 'STAFF', 'SUPER_ADMIN'], default: 'STUDENT' }, status: { type: String, enum: ['ACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
}, { timestamps: true });
export const User = model('User', userSchema);
