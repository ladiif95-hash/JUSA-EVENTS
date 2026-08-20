import '../config/env';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { User } from '../models/user.model';

async function seed() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required before creating a development admin account.');
  await connectDatabase();

  const accounts = [
    { fullName: 'JUSA Super Administrator (Admin-ka Ugu Weyn)', email: (process.env.SEED_ADMIN_EMAIL || 'admin1@jusa.test').toLowerCase(), password: process.env.SEED_ADMIN_PASSWORD || 'JusaAdmin2026!', role: 'SUPER_ADMIN' },
    { fullName: 'JUSA Administrator Two', email: 'admin2@jusa.test', password: 'JusaAdmin2026!', role: 'ADMIN' },
    { fullName: 'JUSA Student One', email: 'student1@jusa.test', password: 'JusaStudent2026!', role: 'STUDENT' },
    { fullName: 'JUSA Student Two', email: 'student2@jusa.test', password: 'JusaStudent2026!', role: 'STUDENT' },
    { fullName: 'JUSA Student Three', email: 'student3@jusa.test', password: 'JusaStudent2026!', role: 'STUDENT' },
  ] as const;
  for (const account of accounts) {
    await User.findOneAndUpdate(
      { email: account.email },
      { fullName: account.fullName, email: account.email, passwordHash: await bcrypt.hash(account.password, 12), role: account.role, status: 'ACTIVE', authProvider: 'LOCAL' },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }
  console.info(`Development accounts are ready: ${accounts.map(account => account.email).join(', ')}`);
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
