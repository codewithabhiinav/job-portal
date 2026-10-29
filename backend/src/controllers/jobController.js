import Application from '../models/Application.js';
import Job from '../models/Job.js';
export async function listJobs(req, res, next) { try { const { keyword, location, employmentType } = req.query; const query = { status: 'open' }; if (keyword) query.$or = ['title', 'companyName', 'description', 'skills'].map(field => ({ [field]: { $regex: keyword, $options: 'i' } })); if (location) query.location = { $regex: location, $options: 'i' }; if (employmentType) query.employmentType = employmentType; const jobs = await Job.find(query).sort({ createdAt: -1 }).populate('recruiter', 'name'); res.json({ jobs }); } catch (error) { next(error); } }
export async function getJob(req, res, next) {
  try {
    const job = await Job.findOne({ _id: req.params.id, status: 'open' }).populate('recruiter', 'name');
    if (!job) return res.status(404).json({ message: 'Open job not found' });
    res.json({ job });
  } catch (error) {
    next(error);
  }
}

export async function listMyJobs(req, res, next) {
  try {
    const jobs = await Job.find({ recruiter: req.user._id }).sort({ createdAt: -1 }).lean();
    const counts = await Application.aggregate([
      { $match: { job: { $in: jobs.map((job) => job._id) } } },
      { $group: { _id: '$job', count: { $sum: 1 } } }
    ]);
    const countByJob = new Map(counts.map(({ _id, count }) => [_id.toString(), count]));
    res.json({
      jobs: jobs.map((job) => ({ ...job, applicationCount: countByJob.get(job._id.toString()) || 0 }))
    });
  } catch (error) {
    next(error);
  }
}

export async function listJobApplications(req, res, next) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (req.user.role !== 'admin' && !job.recruiter.equals(req.user._id)) {
      return res.status(403).json({ message: 'You can only view applications for your own jobs' });
    }
    const applications = await Application.find({ job: job._id })
      .populate('applicant', 'name email')
      .populate('job', 'title companyName location')
      .sort({ createdAt: -1 });
    res.json({ applications });
  } catch (error) {
    next(error);
  }
}

export async function createJob(req, res, next) {
  try {
    const { title, companyName, description, location, employmentType, companyAbout, companyWebsite } = req.body;
    const requiredFields = { title, companyName, description, location, employmentType };
    const missingField = Object.entries(requiredFields).find(([, value]) => typeof value !== 'string' || !value.trim());
    if (missingField) return res.status(400).json({ message: `${missingField[0]} is required` });
    if (!['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'].includes(employmentType)) {
      return res.status(400).json({ message: 'Choose a valid employment type' });
    }

    const salaryMin = req.body.salary?.min === '' || req.body.salary?.min == null ? undefined : Number(req.body.salary.min);
    const salaryMax = req.body.salary?.max === '' || req.body.salary?.max == null ? undefined : Number(req.body.salary.max);
    if ([salaryMin, salaryMax].some((value) => value !== undefined && (!Number.isFinite(value) || value < 0))) {
      return res.status(400).json({ message: 'Salary values must be non-negative numbers' });
    }
    if (salaryMin !== undefined && salaryMax !== undefined && salaryMin > salaryMax) {
      return res.status(400).json({ message: 'Maximum salary must not be lower than minimum salary' });
    }

    const skills = Array.isArray(req.body.skills)
      ? req.body.skills.filter((skill) => typeof skill === 'string').map((skill) => skill.trim()).filter(Boolean)
      : typeof req.body.skills === 'string'
        ? req.body.skills.split(',').map((skill) => skill.trim()).filter(Boolean)
        : [];
    const job = await Job.create({
      title: title.trim(),
      companyName: companyName.trim(),
      company: companyName.trim(),
      companyAbout: typeof companyAbout === 'string' ? companyAbout.trim() : '',
      companyWebsite: typeof companyWebsite === 'string' ? companyWebsite.trim() : '',
      description: description.trim(),
      location: location.trim(),
      employmentType,
      skills,
      salary: { min: salaryMin, max: salaryMax, currency: 'INR' },
      salaryMin,
      salaryMax,
      recruiter: req.user._id
    });
    res.status(201).json({ job });
  } catch (error) {
    next(error);
  }
}
export async function updateJob(req, res, next) { try { const job = await Job.findById(req.params.id); if (!job) return res.status(404).json({ message: 'Job not found' }); if (req.user.role !== 'admin' && !job.recruiter.equals(req.user._id)) return res.status(403).json({ message: 'Not your job post' }); Object.assign(job, req.body); await job.save(); res.json({ job }); } catch (error) { next(error); } }
export async function deleteJob(req, res, next) { try { const job = await Job.findById(req.params.id); if (!job) return res.status(404).json({ message: 'Job not found' }); if (req.user.role !== 'admin' && !job.recruiter.equals(req.user._id)) return res.status(403).json({ message: 'Not your job post' }); await job.deleteOne(); res.status(204).send(); } catch (error) { next(error); } }
