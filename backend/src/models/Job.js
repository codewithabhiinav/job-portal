import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  companyName: { type: String, required: true, trim: true },
  // Kept for compatibility with older documents created using the `company` field.
  company: { type: String, trim: true },
  logoUrl: { type: String, trim: true },
  companyAbout: { type: String, trim: true },
  companyWebsite: { type: String, trim: true },
  location: { type: String, required: true, trim: true },
  employmentType: { type: String, enum: ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance'], default: 'Full-time' },
  skills: [{ type: String, trim: true }],
  salary: { min: { type: Number, min: 0 }, max: { type: Number, min: 0 }, currency: { type: String, default: 'INR' } },
  salaryMin: Number,
  salaryMax: Number,
  description: { type: String, required: true },
  status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: true });

export default mongoose.model('Job', jobSchema);
