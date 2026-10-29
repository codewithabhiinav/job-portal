import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { addApplication } from '../utils/sessionStorage';

export default function JobDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [applicantName, setApplicantName] = useState(user?.name || '');
  const [applicantEmail, setApplicantEmail] = useState(user?.email || '');
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeBase64, setResumeBase64] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    client
      .get(`/jobs/${id}`)
      .then(({ data }) => {
        if (active) setJob(data.job);
      })
      .catch((e) => {
        if (active) setError(e.response?.data?.message || 'This job could not be found.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (user) {
      if (!applicantName) setApplicantName(user.name || '');
      if (!applicantEmail) setApplicantEmail(user.email || '');
    }
  }, [user]);

  // Convert uploaded resume into memory Base64 string
  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    setError('');
    if (!file) {
      setResumeFile(null);
      setResumeBase64('');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5 MB. Please select a smaller file.');
      return;
    }

    setResumeFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setResumeBase64(reader.result);
    };
    reader.onerror = () => {
      setError('Could not process this résumé file. Please try again.');
    };
    reader.readAsDataURL(file);
  }

  async function apply(event) {
    event.preventDefault();

    if (user && user.role !== 'applicant') {
      setError('Only applicant accounts can submit applications.');
      return;
    }

    if (!applicantName.trim()) {
      setError('Please provide your name.');
      return;
    }

    if (!applicantEmail.trim()) {
      setError('Please provide your email address.');
      return;
    }

    if (!resumeFile || !resumeBase64) {
      setError('Please select a valid résumé file to upload.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const companyTitle = job?.companyName || job?.company || 'Company';

      // Create structured application matching both MongoDB ObjectId and string formats
      const newApplication = {
        _id: 'app_' + Date.now(),
        jobId: String(id),
        job: {
          _id: String(id),
          title: job?.title || 'Open Role',
          company: companyTitle,
          location: job?.location || 'Remote',
        },
        applicantName: applicantName.trim(),
        applicantEmail: applicantEmail.trim(),
        coverLetter: coverLetter.trim(),
        resumeUrl: resumeBase64,
        resumeFileName: resumeFile.name,
        status: 'Pending',
        createdAt: new Date().toISOString(),
      };

      // Store in shared storage
      addApplication(newApplication);

      setSuccess('Application submitted! You can track its status from your dashboard.');
      setCoverLetter('');
      setResumeFile(null);
      setResumeBase64('');
      const input = document.getElementById('resume-upload');
      if (input) input.value = '';
    } catch (e) {
      setError('Your application could not be submitted. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <section className="job-detail-page"><p className="muted">Loading role…</p></section>;
  if (!job) {
    return (
      <section className="job-detail-page">
        <p className="eyebrow">Role unavailable</p>
        <h1>We couldn't find this job.</h1>
        <p>{error}</p>
        <Link className="button" to="/jobs">Back to jobs</Link>
      </section>
    );
  }

  const company = job.companyName || job.company || 'Company';

  return (
    <section className="job-detail-page">
      <Link className="back-link" to="/jobs">← All open roles</Link>
      <div className="job-detail-layout">
        <article className="job-detail-main">
          <div className="job-detail-title">
            <div className="company-mark large">{company.slice(0, 1).toUpperCase()}</div>
            <div>
              <p className="eyebrow">{job.employmentType}</p>
              <h1>{job.title}</h1>
              <p className="job-company">{company} · {job.location}</p>
              <p className="muted">
                {job.createdAt ? `Posted ${new Date(job.createdAt).toLocaleDateString()}` : 'Open position'}
                {job.recruiter?.name ? ` · Posted by ${job.recruiter.name}` : ''}
              </p>
            </div>
          </div>
          <section className="detail-section">
            <h2>About the role</h2>
            <p className="job-description">{job.description}</p>
          </section>
          {job.skills?.length > 0 && (
            <section className="detail-section">
              <h2>Skills we're looking for</h2>
              <div className="skill-tags">
                {job.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </section>
          )}
          <section className="detail-section">
            <h2>About {company}</h2>
            {job.companyAbout ? (
              <p className="job-description">{job.companyAbout}</p>
            ) : (
              <p className="muted">Company information will be shared by the recruiter soon.</p>
            )}
            {job.companyWebsite && (
              <p className="company-website">
                <a href={job.companyWebsite} target="_blank" rel="noreferrer">
                  Visit company website ↗
                </a>
              </p>
            )}
          </section>
          {job.salary && (job.salary.min || job.salary.max) && (
            <section className="detail-section">
              <h2>Compensation</h2>
              <p>
                {job.salary.min ? `₹${Number(job.salary.min).toLocaleString('en-IN')}` : 'Salary'}
                {job.salary.max ? ` – ₹${Number(job.salary.max).toLocaleString('en-IN')}` : '+'} per year
              </p>
            </section>
          )}
        </article>

        <aside className="apply-card">
          <p className="eyebrow">Interested?</p>
          <h2>Make your move.</h2>
          <p className="apply-intro">Apply directly and keep track of your application from your workspace.</p>

          {user?.role === 'recruiter' ? (
            <p className="muted">Recruiter accounts cannot apply for jobs. Sign in with an applicant account to apply.</p>
          ) : user?.role === 'admin' ? (
            <p className="muted">Admin accounts cannot submit applications.</p>
          ) : (
            <>
              {success ? (
                <p className="success" role="status">{success}</p>
              ) : !showForm ? (
                <button
                  type="button"
                  className="button apply-button"
                  onClick={() => setShowForm(true)}
                >
                  Apply now
                </button>
              ) : (
                <form className="apply-form" onSubmit={apply}>
                  <label htmlFor="applicant-name">Full name</label>
                  <input
                    id="applicant-name"
                    type="text"
                    required
                    placeholder="e.g. Jane Doe"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                  />

                  <label htmlFor="applicant-email">Email address</label>
                  <input
                    id="applicant-email"
                    type="email"
                    required
                    placeholder="e.g. jane@example.com"
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                  />

                  <label htmlFor="cover-letter">
                    Cover letter <span className="field-hint">optional</span>
                  </label>
                  <textarea
                    id="cover-letter"
                    rows="4"
                    maxLength="3000"
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Tell the team why you're a great fit…"
                  />

                  <label htmlFor="resume-upload">
                    Résumé <span className="field-hint">PDF, DOC, or DOCX · 5 MB max</span>
                  </label>
                  <input
                    id="resume-upload"
                    type="file"
                    required
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                  />

                  {resumeFile && <p className="file-selected">Selected: {resumeFile.name}</p>}
                  {error && <p className="error" role="alert">{error}</p>}

                  <button
                    className="button apply-button"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting…' : 'Submit application'}
                  </button>
                </form>
              )}
            </>
          )}

          {error && user?.role !== 'applicant' && <p className="error" role="alert">{error}</p>}
          <p className="apply-footnote">Your application details are shared with the recruiter for this role.</p>
        </aside>
      </div>
    </section>
  );
}