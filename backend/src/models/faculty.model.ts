import { Schema, model } from 'mongoose';

const facultySchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  departments: [{ name: { type: String, required: true, trim: true } }],
}, { timestamps: true });

export const Faculty = model('Faculty', facultySchema);
