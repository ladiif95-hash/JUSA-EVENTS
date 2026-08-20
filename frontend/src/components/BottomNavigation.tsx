import { CalendarDays, Compass, Home, UserRound, Vote } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function BottomNavigation() {
  const { user } = useAuth();
  if (!user || user.role === 'ADMIN') return null;
  const links = [[ '/', 'Home', Home ], ['/seminars', 'Explore', Compass], ['/vote', 'Vote', Vote], ['/my-events', 'My events', CalendarDays], ['/profile', 'Profile', UserRound]] as const;
  return <nav className="bottom-nav" aria-label="Student navigation">{links.map(([to, label, Icon]) => <NavLink end={to === '/'} to={to} key={to}><Icon /><span>{label}</span></NavLink>)}</nav>;
}
