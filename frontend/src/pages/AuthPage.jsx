import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
export default function AuthPage({ mode }) {
  const isLogin = mode === 'login';
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'applicant' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isLogin) {
        await login(form);
      } else {
        await client.post('/auth/register', form);
        await login(form);
      }
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (requestError) {
      const message = requestError.response?.data?.message;
      setError(message || (requestError.request
        ? 'Unable to connect to Career Seeker. Check that the backend is running and try again.'
        : requestError.message || 'Something went wrong. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-card">
      <p className="eyebrow">Welcome to Career Seeker</p>
      <h1>{isLogin ? 'Good to see you again.' : 'Start your next chapter.'}</h1>
      <form onSubmit={submit}>
        <label>Email<input type="email" required value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></label>
        {!isLogin && <>
          <label>Name<input required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
          <label>Joining as<select value={form.role} onChange={event => setForm({ ...form, role: event.target.value })}><option value="applicant">Applicant</option><option value="recruiter">Recruiter</option></select></label>
        </>}
        <label>Password<input type="password" minLength="8" required value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="button" type="submit" disabled={submitting}>{submitting ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}</button>
      </form>
      <p>{isLogin ? 'New here?' : 'Already have an account?'} <Link to={isLogin ? '/register' : '/login'}>{isLogin ? 'Create an account' : 'Sign in'}</Link></p>
    </section>
  );
}
