import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Brand } from '../components/Navbar';
import { AuthArt } from './Login';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { from?: string } | null;
  const from = locationState?.from;
  const { register, isLoading } = useAuth();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    try {
      await register(form.fullName, form.email, form.password, form.phone);
      // If user came from a specific action (like /vote), take them back there directly!
      navigate(from || '/complete-profile', { replace: true, state: locationState });
    } catch (issue) {
      const message = issue instanceof Error ? issue.message : 'Unable to create account';
      setError(message === 'Email already registered' ? 'An account already exists with this email. Please sign in instead.' : message);
    }
  };

  return (
    <section className="auth-page grid min-h-dvh min-[761px]:grid-cols-2">
      <form className="auth-panel mx-auto w-[min(440px,calc(100%-32px))]" onSubmit={submit}>
        <Brand />
        <span className="eyebrow">STUDENT PORTAL</span>
        <h1>Create your account</h1>
        <p>Start discovering and voting for JUSA events today.</p>
        <button
          type="button"
          className="google-button"
          onClick={() => window.location.assign(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`)}
        >
          G <span>Continue with Google</span>
        </button>
        <div className="or">OR</div>
        <label>
          Full name
          <input
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required
            placeholder="Your full name"
          />
        </label>
        <label>
          Email address
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            type="email"
            placeholder="you@example.com"
          />
        </label>
        <label>
          Phone number
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
            type="tel"
            placeholder="+252 61 0000000"
          />
        </label>
        <label>
          Password
          <input
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={8}
            type="password"
            placeholder="At least 8 characters"
          />
        </label>
        <label>
          Confirm password
          <input
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            required
            type="password"
            placeholder="••••••••"
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error} {error.startsWith('An account') && <Link to="/login" state={location.state}>Sign in</Link>}
          </p>
        )}
        <button className="button auth-button" disabled={isLoading}>
          {isLoading ? 'Creating account…' : <>Create account <ArrowRight /></>}
        </button>
        <p className="auth-switch">
          Already have an account? <Link to="/login" state={location.state}>Sign in</Link>
        </p>
      </form>
      <AuthArt />
    </section>
  );
}

