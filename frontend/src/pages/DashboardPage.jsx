import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { getApplications, updateApplicationStatusInSession } from '../utils/sessionStorage';

const initialJobForm = {
  title: '',
  companyName: '',
  companyLogo: '',
  companyAbout: '',
  location: '',
  employmentType: 'Full-time',
  skills: '',
  minSalary: '',
  maxSalary: '',
  description: '',
};

export default function DashboardPage() {
  const { user } = useAuth();

  // Recruiter jobs state
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [formData, setFormData] = useState(initialJobForm);
  const [editingJobId, setEditingJobId] = useState(null);
  const [submittingJob, setSubmittingJob] = useState(false);
  const [jobError, setJobError] = useState('');
  const [jobSuccess, setJobSuccess] = useState('');

  // Applications list and active selected job filter
  const [sessionApps, setSessionApps] = useState([]);
  const [activeJobSubmissions, setActiveJobSubmissions] = useState(null);

  // Load recruiter's jobs and applications
  const loadRecruiterData = () => {
    client
      .get('/jobs')
      .then(({ data }) => setJobs(data.jobs || []))
      .catch((e) => console.error('Failed to load jobs', e))
      .finally(() => setLoadingJobs(false));

    setSessionApps(getApplications());
  };

  useEffect(() => {
    loadRecruiterData();

    // Sync across both same tab and other tabs automatically
    const handleUpdate = () => setSessionApps(getApplications());
    window.addEventListener('session_applications_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('session_applications_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user]);

  // Form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Start Editing a Job
  const handleStartEdit = (job) => {
    setEditingJobId(job._id);
    setJobError('');
    setJobSuccess('');
    setFormData({
      title: job.title || '',
      companyName: job.companyName || job.company || '',
      companyLogo: job.companyLogo || '',
      companyAbout: job.companyAbout || '',
      location: job.location || '',
      employmentType: job.employmentType || 'Full-time',
      skills: Array.isArray(job.skills) ? job.skills.join(', ') : job.skills || '',
      minSalary: job.salary?.min || '',
      maxSalary: job.salary?.max || '',
      description: job.description || '',
    });
  };

  // Cancel Editing
  const handleCancelEdit = () => {
    setEditingJobId(null);
    setFormData(initialJobForm);
    setJobError('');
  };

  // Publish New Job or Save Changes
  const handleJobSubmit = async (e) => {
    e.preventDefault();
    setSubmittingJob(true);
    setJobError('');
    setJobSuccess('');

    const payload = {
      title: formData.title,
      companyName: formData.companyName,
      companyLogo: formData.companyLogo,
      companyAbout: formData.companyAbout,
      location: formData.location,
      employmentType: formData.employmentType,
      skills: formData.skills.split(',').map((s) => s.trim()).filter(Boolean),
      salary: {
        min: formData.minSalary ? Number(formData.minSalary) : undefined,
        max: formData.maxSalary ? Number(formData.maxSalary) : undefined,
      },
      description: formData.description,
    };

    try {
      if (editingJobId) {
        await client.put(`/jobs/${editingJobId}`, payload);
        setJobSuccess('Job post updated successfully!');
        setEditingJobId(null);
      } else {
        await client.post('/jobs', payload);
        setJobSuccess('New role published successfully!');
      }
      setFormData(initialJobForm);
      loadRecruiterData();
    } catch (err) {
      setJobError(err.response?.data?.message || 'Could not save job. Please try again.');
    } finally {
      setSubmittingJob(false);
    }
  };

  // Recruiter Status Decision (Approve / Reject)
  const handleStatusChange = (appId, newStatus) => {
    const updated = updateApplicationStatusInSession(appId, newStatus);
    setSessionApps([...updated]);
  };

  // Helper: check if application belongs to the job
  const isAppForJob = (app, job) => {
    if (!app || !job) return false;
    const jId = String(job._id);
    return (
      String(app.jobId) === jId ||
      String(app.job?._id) === jId ||
      (app.job?.title && job.title && app.job.title.toLowerCase() === job.title.toLowerCase())
    );
  };

  if (!user) {
    return (
      <section className="job-detail-page">
        <h1>Please sign in</h1>
        <p className="muted">You need to sign in to access your workspace.</p>
        <Link className="button" to="/login">Sign In</Link>
      </section>
    );
  }

  // ========================================================
  // RECRUITER DASHBOARD
  // ========================================================
  if (user.role === 'recruiter') {
    return (
      <div className="dashboard-container" style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', alignItems: 'start' }}>
          
          {/* ================= LEFT: Post or Edit a Role ================= */}
          <div style={{ background: '#fff', border: '1px solid #e7e6e0', borderRadius: '8px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <p style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600, color: '#a05c2a', margin: 0 }}>
                Job Management
              </p>
              {editingJobId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}
                >
                  Cancel edit
                </button>
              )}
            </div>

            <h2 style={{ fontSize: '1.8rem', fontFamily: 'serif', marginTop: '0.2rem', marginBottom: '1.5rem', color: '#1a1a1a' }}>
              {editingJobId ? 'Edit job post' : 'Post a new role'}
            </h2>

            {jobSuccess && <p style={{ color: '#166534', background: '#dcfce7', padding: '0.6rem 0.8rem', borderRadius: '4px', fontSize: '0.85rem' }}>{jobSuccess}</p>}
            {jobError && <p style={{ color: '#991b1b', background: '#fee2e2', padding: '0.6rem 0.8rem', borderRadius: '4px', fontSize: '0.85rem' }}>{jobError}</p>}

            <form onSubmit={handleJobSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#444', marginBottom: '0.25rem' }}>Job title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#444', marginBottom: '0.25rem' }}>Company name</label>
                  <input
                    type="text"
                    name="companyName"
                    required
                    value={formData.companyName}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#444', marginBottom: '0.25rem' }}>
                  Company logo URL <span style={{ color: '#888' }}>optional</span>
                </label>
                <input
                  type="text"
                  name="companyLogo"
                  value={formData.companyLogo}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#444', marginBottom: '0.25rem' }}>
                  About the company <span style={{ color: '#888' }}>shown on job detail page</span>
                </label>
                <textarea
                  name="companyAbout"
                  rows="3"
                  value={formData.companyAbout}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#444', marginBottom: '0.25rem' }}>Location</label>
                  <input
                    type="text"
                    name="location"
                    required
                    value={formData.location}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#444', marginBottom: '0.25rem' }}>Employment type</label>
                  <select
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.55rem', border: '1px solid #ccc', borderRadius: '4px', background: '#fff' }}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#444', marginBottom: '0.25rem' }}>Skills comma-separated</label>
                <input
                  type="text"
                  name="skills"
                  placeholder="React, CSS, JavaScript, express"
                  value={formData.skills}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#444', marginBottom: '0.25rem' }}>Minimum salary</label>
                  <input
                    type="number"
                    name="minSalary"
                    value={formData.minSalary}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#444', marginBottom: '0.25rem' }}>Maximum salary</label>
                  <input
                    type="number"
                    name="maxSalary"
                    value={formData.maxSalary}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#444', marginBottom: '0.25rem' }}>Role description</label>
                <textarea
                  name="description"
                  rows="4"
                  required
                  value={formData.description}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>

              <button
                type="submit"
                disabled={submittingJob}
                style={{
                  background: '#234338',
                  color: '#fff',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  marginTop: '0.5rem',
                }}
              >
                {submittingJob ? 'Saving…' : editingJobId ? 'Save changes' : 'Publish job'}
              </button>
            </form>
          </div>

          {/* ================= RIGHT: Job Submissions ================= */}
          <div style={{ background: '#fff', border: '1px solid #e7e6e0', borderRadius: '8px', padding: '2rem' }}>
            <p style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600, color: '#a05c2a', margin: 0 }}>
              Applications
            </p>
            <h2 style={{ fontSize: '1.8rem', fontFamily: 'serif', marginTop: '0.2rem', marginBottom: '0.3rem', color: '#1a1a1a' }}>
              Job submissions
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1.5rem' }}>
              Choose a role to see its applicants.
            </p>

            {loadingJobs ? (
              <p style={{ color: '#888', fontSize: '0.9rem' }}>Loading posted roles…</p>
            ) : jobs.length === 0 ? (
              <p style={{ color: '#888', fontSize: '0.9rem' }}>No roles posted yet. Use the form on the left to publish a job.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {jobs.map((j) => {
                  const jobApps = sessionApps.filter((a) => isAppForJob(a, j));
                  const isSelected = activeJobSubmissions?._id === j._id;

                  return (
                    <div
                      key={j._id}
                      style={{
                        border: isSelected ? '1.5px solid #234338' : '1px solid #eee',
                        borderRadius: '6px',
                        padding: '0.9rem 1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: isSelected ? '#f8faf8' : '#fafafa',
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.95rem', display: 'block', color: '#111' }}>{j.title}</strong>
                        <span style={{ fontSize: '0.8rem', color: '#666' }}>
                          {j.companyName || j.company || 'Company'} · {j.location}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(j)}
                          style={{
                            background: '#fff',
                            border: '1px solid #ccc',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            color: '#333',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveJobSubmissions(isSelected ? null : j)}
                          style={{
                            background: isSelected ? '#234338' : '#fff',
                            color: isSelected ? '#fff' : '#8c5024',
                            border: '1px solid #8c5024',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          Submissions ({jobApps.length})
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ================= DRAWER: View Candidates for Selected Job ================= */}
        {activeJobSubmissions && (
          <div style={{ marginTop: '2.5rem', background: '#fff', border: '1px solid #e0dfd5', borderRadius: '8px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'serif', fontSize: '1.4rem' }}>
                  Submissions for: {activeJobSubmissions.title}
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
                  Candidate details & résumés submitted.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveJobSubmissions(null)}
                style={{ background: '#eee', border: 'none', padding: '0.3rem 0.7rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Close View ✕
              </button>
            </div>

            {sessionApps.filter((a) => isAppForJob(a, activeJobSubmissions)).length === 0 ? (
              <p style={{ color: '#888', fontStyle: 'italic', padding: '1rem 0' }}>
                No candidate applications received for this role yet.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f4f6f0', borderBottom: '1px solid #e0dfd5' }}>
                      <th style={{ padding: '0.6rem 0.8rem' }}>Candidate</th>
                      <th style={{ padding: '0.6rem 0.8rem' }}>Cover Letter</th>
                      <th style={{ padding: '0.6rem 0.8rem' }}>Résumé</th>
                      <th style={{ padding: '0.6rem 0.8rem' }}>Status</th>
                      <th style={{ padding: '0.6rem 0.8rem' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionApps
                      .filter((a) => isAppForJob(a, activeJobSubmissions))
                      .map((app) => (
                        <tr key={app._id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '0.6rem 0.8rem' }}>
                            <strong>{app.applicantName}</strong>
                            <div style={{ color: '#666', fontSize: '0.75rem' }}>{app.applicantEmail}</div>
                          </td>
                          <td style={{ padding: '0.6rem 0.8rem', maxWidth: '240px' }}>
                            {app.coverLetter || <span style={{ color: '#aaa' }}>No cover letter</span>}
                          </td>
                          <td style={{ padding: '0.6rem 0.8rem' }}>
                            {app.resumeUrl ? (
                              <a
                                href={app.resumeUrl}
                                download={app.resumeFileName || 'resume.pdf'}
                                style={{ color: '#1f4e38', fontWeight: 600, textDecoration: 'underline' }}
                              >
                                Download / View
                              </a>
                            ) : (
                              <span style={{ color: '#aaa' }}>No file</span>
                            )}
                          </td>
                          <td style={{ padding: '0.6rem 0.8rem' }}>
                            <span
                              style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background:
                                  app.status === 'Approved' ? '#e2f4e8' : app.status === 'Rejected' ? '#fde8e8' : '#fef3c7',
                                color:
                                  app.status === 'Approved' ? '#1f703e' : app.status === 'Rejected' ? '#b91c1c' : '#92400e',
                              }}
                            >
                              {app.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.6rem 0.8rem' }}>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(app._id, 'Approved')}
                                style={{
                                  background: '#234338',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                }}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(app._id, 'Rejected')}
                                style={{
                                  background: '#b91c1c',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                }}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // APPLICANT WORKSPACE
  // ==========================================
  const myApplications = sessionApps.filter(
    (app) => app.applicantEmail === user.email || !user.email
  );

  return (
    <section className="dashboard-page" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
      <p className="eyebrow" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8c5024' }}>
        Applicant Workspace
      </p>
      <h1 style={{ fontSize: '2rem', margin: '0.2rem 0 1.5rem' }}>My Applied Roles</h1>

      {myApplications.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#fcfbf7', border: '1px dashed #ccc', borderRadius: '8px' }}>
          <h3>No applications submitted yet</h3>
          <p className="muted" style={{ color: '#777', marginBottom: '1rem' }}>
            Find a job role and apply to track your submission status here.
          </p>
          <Link className="button" to="/jobs">Explore Open Roles</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {myApplications.map((app) => (
            <div
              key={app._id}
              style={{
                background: '#fff',
                border: '1px solid #e0dfd5',
                borderRadius: '8px',
                padding: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{app.job?.title || 'Open Position'}</h3>
                <p style={{ margin: '0.25rem 0', color: '#666', fontSize: '0.9rem' }}>
                  {app.job?.company} · {app.job?.location}
                </p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#999' }}>
                  Submitted on {new Date(app.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div>
                <span
                  style={{
                    padding: '0.35rem 0.8rem',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    background:
                      app.status === 'Approved' ? '#e2f4e8' : app.status === 'Rejected' ? '#fde8e8' : '#fef3c7',
                    color:
                      app.status === 'Approved' ? '#1f703e' : app.status === 'Rejected' ? '#b91c1c' : '#92400e',
                  }}
                >
                  Status: {app.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}