import { useState } from 'react'; import { ArrowRight } from 'lucide-react'; import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'; import { Brand } from '../components/Navbar'; import { useAuth } from '../context/AuthContext'; import { mockCredentials } from '../services/mock-auth.service'; import { roleRedirect } from '../utils/roleRedirect';
type LocationState = { from?: string };
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { user, login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as (LocationState & { message?: string }) | null;
  const sessionMessage = locationState?.message;
  const oauthError = new URLSearchParams(location.search).get('oauthError');

  if (user) {
    const from = locationState?.from;
    return <Navigate to={from || roleRedirect(user.role)} replace />;
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.');
    if (!password) return setError('Password is required.');
    try {
      const signedInUser = await login(email, password);
      const from = locationState?.from;
      // If user came from a specific page like /vote or a seminar detail, redirect there!
      const destination = from || roleRedirect(signedInUser.role);
      navigate(destination, { replace: true });
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Sign in failed');
    }
  };

  return (
    <section className="auth-page grid min-h-dvh min-[761px]:grid-cols-2">
      <form className="auth-panel mx-auto w-[min(440px,calc(100%-32px))]" onSubmit={submit}>
        <Brand />
        <span className="eyebrow">JUSA STUDENT &amp; STAFF PORTAL</span>
        <h1>Welcome back</h1>
        <p>Sign in to manage your seminars, vote, and reserve seats.</p>
        {(sessionMessage || oauthError) && <p className="form-error" role="status">{sessionMessage || oauthError}</p>}
        <button
          type="button"
          className="google-button"
          onClick={() => window.location.assign(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`)}
        >
          G <span>Continue with Google</span>
        </button>
        <div className="or">OR</div>
        <label>
          Email address
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </label>
        <label>
          Password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
            required
            placeholder="Enter your password"
          />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button auth-button" disabled={isLoading}>
          {isLoading ? 'Signing in…' : <>Sign in <ArrowRight /></>}
        </button>
        <Link className="forgot" to="/forgot-password" state={location.state}>Forgot password?</Link>
        <p className="auth-switch">
          Don't have an account? <Link to="/register" state={location.state}>Create account</Link>
        </p>
        {import.meta.env.VITE_USE_MOCK_AUTH === 'true' && <p className="test-credentials">Development test: {mockCredentials}</p>}
      </form>
      <AuthArt />
    </section>
  );
}

export function AuthArt() { return <div className="auth-art"><div><span className="eyebrow light">JUSA EVENTS</span><h2>Every event is a new way to move forward.</h2><p>Learn, connect and build your future with the JUST student community.</p></div></div>; }
