import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const emptyProfile = {
  headline: '', phone: '', location: '', bio: '', skills: [], resumeUrl: '',
  companyName: '', companyWebsite: '', industry: '', companySize: '', jobTitle: ''
};

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', ...emptyProfile, ...(user?.profile || {}) });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const isRecruiter = user?.role === 'recruiter';

  useEffect(() => {
    setForm({ name: user?.name || '', ...emptyProfile, ...(user?.profile || {}) });
  }, [user]);

  function change(event) {
    setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true); setMessage(''); setError('');
    const payload = { ...form };
    if (!isRecruiter) payload.skills = String(form.skills || '').split(',').map(skill => skill.trim()).filter(Boolean);
    try {
      const { data } = await client.patch('/auth/profile', payload);
      setUser(data.user);
      setMessage('Your profile has been saved successfully.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const initials = (user?.name || 'U').split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  const skillsValue = Array.isArray(form.skills) ? form.skills.join(', ') : form.skills;

  return <section className="profile-page">
    <div className="profile-topline"><div><p className="eyebrow">Account settings</p><h1>Your profile</h1><p className="lead">Make a strong first impression and keep your details up to date.</p></div><Link className="button secondary" to="/dashboard">← Back to dashboard</Link></div>
    <div className="profile-layout">
      <aside className="profile-summary">
        <div className="profile-avatar">{initials}</div>
        <h2>{form.name || user?.name}</h2>
        <p className="profile-email">{user?.email}</p>
        <span className="pill role-pill">{isRecruiter ? 'Recruiter' : user?.role === 'admin' ? 'Administrator' : 'Applicant'}</span>
        <div className="profile-summary-rule" />
        <p className="muted">{form.headline || (isRecruiter ? 'Build your team with Career Seeker.' : 'Your next opportunity starts with a complete profile.')}</p>
        <div className="profile-tip"><strong>Profile tip</strong><p>{isRecruiter ? 'Add your company details so candidates know who is hiring.' : 'Highlight your skills and add a resume link to help recruiters understand your experience.'}</p></div>
      </aside>
      <form className="profile-form" onSubmit={save}>
        <div className="profile-form-heading"><div><p className="eyebrow">Personal information</p><h2>{isRecruiter ? 'Recruiter profile' : 'Applicant profile'}</h2></div><span className="profile-lock">Private account details</span></div>
        {error && <p className="error form-notice" role="alert">{error}</p>}
        {message && <p className="success form-notice" role="status">{message}</p>}
        <div className="profile-fields">
          <label>Full name<input name="name" value={form.name} onChange={change} required maxLength="100" /></label>
          <label>Email address<input value={user?.email || ''} readOnly disabled /><span className="field-hint">Email cannot be changed here.</span></label>
          <label className="field-full">{isRecruiter ? 'Professional title' : 'Professional headline'}<input name="headline" value={form.headline || ''} onChange={change} maxLength="120" placeholder={isRecruiter ? 'e.g. Talent Acquisition Manager' : 'e.g. Frontend Developer | React'}/></label>
          <label>Phone number<input name="phone" value={form.phone || ''} onChange={change} type="tel" maxLength="30" placeholder="+91 98765 43210" /></label>
          <label>Location<input name="location" value={form.location || ''} onChange={change} maxLength="120" placeholder="City, country or remote" /></label>
          {isRecruiter ? <>
            <label>Company name<input name="companyName" value={form.companyName || ''} onChange={change} maxLength="160" placeholder="Your company" /></label>
            <label>Job title<input name="jobTitle" value={form.jobTitle || ''} onChange={change} maxLength="120" placeholder="Your role at the company" /></label>
            <label>Company website<input name="companyWebsite" value={form.companyWebsite || ''} onChange={change} type="url" placeholder="https://example.com" /></label>
            <label>Industry<input name="industry" value={form.industry || ''} onChange={change} maxLength="120" placeholder="e.g. Software / IT" /></label>
            <label className="field-full">Company size<select name="companySize" value={form.companySize || ''} onChange={change}><option value="">Choose company size</option><option>Just me</option><option>2–10 employees</option><option>11–50 employees</option><option>51–200 employees</option><option>201–1,000 employees</option><option>1,000+ employees</option></select></label>
          </> : <>
            <label className="field-full">Skills <span className="field-hint">Separate each skill with a comma.</span><input name="skills" value={skillsValue || ''} onChange={change} placeholder="React, JavaScript, Node.js" /></label>
            <label className="field-full">Resume link<input name="resumeUrl" value={form.resumeUrl || ''} onChange={change} type="url" placeholder="Paste a Google Drive or portfolio resume link" /></label>
          </>}
          <label className="field-full">{isRecruiter ? 'About you / your company' : 'About you'}<textarea name="bio" value={form.bio || ''} onChange={change} rows="5" maxLength="1200" placeholder={isRecruiter ? 'Tell candidates about your company, team and hiring focus.' : 'Summarize your experience, interests and the kind of role you are looking for.'} /></label>
        </div>
        <div className="profile-form-footer"><span className="muted">Your profile is saved to your Career Seeker account.</span><button className="button" type="submit" disabled={saving}>{saving ? 'Saving changes…' : 'Save profile changes'}</button></div>
      </form>
    </div>
  </section>;
}
