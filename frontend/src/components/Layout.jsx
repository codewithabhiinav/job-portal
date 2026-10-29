import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  return <><header><Link className="brand" to="/">Career Seeker</Link><nav><NavLink to="/jobs">Find jobs</NavLink>{user ? <><NavLink to="/dashboard">Dashboard</NavLink><NavLink to="/profile">My Profile</NavLink><button className="link-button" onClick={logout}>Sign out</button></> : <><NavLink to="/login">Sign in</NavLink><Link className="button small" to="/register">Get started</Link></>}</nav></header><main>{children}</main><footer className="site-footer"><span>Coded by Code-with-Abhinav</span><span>© {new Date().getFullYear()} Career Seeker. All rights belong to Abhinav.</span></footer></>;
}
