import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Bell, CalendarDays, Compass, Home, Info, LogOut, Menu, Vote, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Brand() {
  return <Link to="/" className="brand"><img src="/images/jusa-logo.png" alt="Jamhuriya University Students Association logo"/><span><b>JUSA</b><small>STUDENT ASSOCIATION</small></span></Link>;
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const close = () => setOpen(false);
  return (
    <header className="site-header">
      <div className="nav">
        <div className="sidebar-top">
          <Brand />
          <button className="menu-button" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        </div>
        <nav className={open ? 'nav-links open' : 'nav-links'} aria-label="Main navigation">
          <span className="nav-label">DISCOVER</span>
          <NavLink end to="/" onClick={close}><Home /> <span>Home</span></NavLink>
          <NavLink to="/seminars" onClick={close}><Compass /> <span>Browse events</span></NavLink>
          <NavLink to="/vote" onClick={close}><Vote /> <span>Vote</span></NavLink>
          {user && <NavLink to="/my-events" onClick={close}><CalendarDays /> <span>My events</span></NavLink>}
          <NavLink to="/about" onClick={close}><Info /> <span>About JUSA</span></NavLink>
        </nav>
        <div className="sidebar-account">
          {user ? (
            <>
              <Link className="profile-nav" to="/profile" onClick={close}><span>{user.fullName.slice(0, 1)}</span><b>{user.fullName.split(' ')[0]}</b></Link>
              <div className="account-actions">
                <Link className="nav-icon" aria-label="My events" to="/my-events"><Bell /></Link>
                <button className="nav-logout" onClick={() => { logout(); close(); }}><LogOut /></button>
              </div>
            </>
          ) : (
            <>
              <p>Join JUSA to save events and manage your attendance.</p>
              <Link to="/register" className="button button-small" onClick={close}>Join JUSA</Link>
              <NavLink to="/login" className="login-link" onClick={close}>Sign in</NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
