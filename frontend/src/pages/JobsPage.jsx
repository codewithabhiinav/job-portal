import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];
export default function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({ keyword: '', location: '', employmentType: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async (event) => {
    event?.preventDefault(); setLoading(true); setError('');
    try { const { data } = await client.get('/jobs', { params: filters }); setJobs(data.jobs || []); }
    catch (e) { setError(e.response?.data?.message || 'Could not load jobs. Please try again.'); }
    finally { setLoading(false); }
  }, [filters]);
  useEffect(() => { load(); }, []); // Initial load; search is submitted explicitly.
  return <section className="jobs-page">
    <div className="page-heading"><p className="eyebrow">Open roles</p><h1>Find your next opportunity</h1><p className="lead">Thoughtful teams. Meaningful work. Your next move starts here.</p></div>
    <form className="filters" onSubmit={load}>
      <input aria-label="Search jobs" value={filters.keyword} placeholder="Title, skill, or company" onChange={e => setFilters({ ...filters, keyword: e.target.value })} />
      <input aria-label="Location" value={filters.location} placeholder="Location" onChange={e => setFilters({ ...filters, location: e.target.value })} />
      <select aria-label="Employment type" value={filters.employmentType} onChange={e => setFilters({ ...filters, employmentType: e.target.value })}><option value="">Any type</option>{employmentTypes.map(type => <option key={type}>{type}</option>)}</select>
      <button className="button" type="submit">Search</button>
    </form>
    <div className="results-heading"><span>{loading ? 'Searching opportunities…' : `${jobs.length} ${jobs.length === 1 ? 'opportunity' : 'opportunities'}`}</span>{filters.keyword || filters.location || filters.employmentType ? <button className="text-link" type="button" onClick={async () => { const empty = { keyword: '', location: '', employmentType: '' }; setFilters(empty); setLoading(true); try { const { data } = await client.get('/jobs'); setJobs(data.jobs || []); setError(''); } catch (e) { setError(e.response?.data?.message || 'Could not load jobs. Please try again.'); } finally { setLoading(false); } }}>Clear filters</button> : null}</div>
    {error && <p className="error" role="alert">{error}</p>}
    <div className="job-list">{jobs.map(job => <article className="job-card job-list-card" key={job._id}>
      <div className="company-mark">{(job.companyName || job.company || 'C').slice(0, 1).toUpperCase()}</div>
      <div className="job-card-content"><div className="job-card-meta"><span className="pill">{job.employmentType}</span><span className="muted">{job.createdAt ? `Posted ${new Date(job.createdAt).toLocaleDateString()}` : 'New opening'}</span></div>
        <h2><Link to={`/jobs/${job._id}`}>{job.title}</Link></h2><p className="job-company">{job.companyName || job.company || 'Company'} · {job.location}</p>
        {job.skills?.length > 0 && <div className="skill-tags">{job.skills.slice(0, 5).map(skill => <span key={skill}>{skill}</span>)}</div>}
      </div><Link className="button job-view-button" to={`/jobs/${job._id}`}>View role ↗</Link>
    </article>)}{!loading && !jobs.length && !error && <div className="empty-jobs"><p className="eyebrow">No matches yet</p><h2>Your next opportunity is still out there.</h2><p>Try a different title, skill, or location.</p></div>}</div>
    {user?.role === 'recruiter' && <p className="jobs-recruiter-note">Hiring? <Link to="/dashboard">Post a role from your recruiter workspace ↗</Link></p>}
  </section>;
}
