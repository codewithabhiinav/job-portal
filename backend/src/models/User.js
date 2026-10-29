import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const profileSchema = new mongoose.Schema({
  headline: { type: String, trim: true, maxlength: 120, default: '' },
  phone: { type: String, trim: true, maxlength: 30, default: '' },
  location: { type: String, trim: true, maxlength: 120, default: '' },
  bio: { type: String, trim: true, maxlength: 1200, default: '' },
  skills: { type: [String], default: [] },
  resumeUrl: { type: String, trim: true, default: '' },
  companyName: { type: String, trim: true, maxlength: 160, default: '' },
  companyWebsite: { type: String, trim: true, maxlength: 240, default: '' },
  industry: { type: String, trim: true, maxlength: 120, default: '' },
  companySize: { type: String, trim: true, maxlength: 60, default: '' },
  jobTitle: { type: String, trim: true, maxlength: 120, default: '' },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, enum: ['admin', 'recruiter', 'applicant'], default: 'applicant' },
  avatar: { url: String, publicId: String },
  profile: { type: profileSchema, default: () => ({}) },
}, { timestamps: true });
userSchema.methods.matchesPassword = function matchesPassword(password) { return bcrypt.compare(password, this.password); };
export default mongoose.model('User', userSchema);
