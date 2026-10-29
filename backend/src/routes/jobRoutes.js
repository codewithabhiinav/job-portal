import { Router } from 'express';
import {
  createJob,
  deleteJob,
  getJob,
  listJobApplications,
  listJobs,
  listMyJobs,
  updateJob,
} from '../controllers/jobController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';

const router = Router();

// Public: anyone can browse jobs
router.get('/', listJobs);

// Recruiter: must come before '/:id'
router.get('/mine', protect, authorize('recruiter', 'admin'), listMyJobs);

router.get('/:id', getJob);
router.get('/:id/applications', protect, authorize('recruiter', 'admin'), listJobApplications);

router.post('/', protect, authorize('recruiter', 'admin'), createJob);
router.patch('/:id', protect, authorize('recruiter', 'admin'), updateJob);
router.delete('/:id', protect, authorize('recruiter', 'admin'), deleteJob);

export default router;