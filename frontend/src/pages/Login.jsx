import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError('Please fill in all fields.');
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main id="login-page" className="page flex-center" style={{ alignItems: 'center' }}>
        <div style={styles.card} className="card">
          <div style={styles.header}>
            <div style={styles.icon}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="8" fill="url(#lg2)" />
                <path d="M10 8l10 6-10 6V8z" fill="white" />
                <defs>
                  <linearGradient id="lg2" x1="0" y1="0" x2="28" y2="28">
                    <stop stopColor="#6366f1" />
                    <stop offset="1" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 style={styles.title}>Welcome back</h1>
            <p style={styles.subtitle}>Sign in to your StreamShare account</p>
          </div>

          <form id="login-form" onSubmit={handleSubmit} style={styles.form}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {error && <div className="error-msg" id="login-error">{error}</div>}

            <button
              id="login-submit-btn"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '13px', fontSize: '0.95rem' }}
            >
              {loading ? <span className="spinner spinner-sm" /> : 'Sign In'}
            </button>
          </form>

          <p style={styles.footer}>
            Don't have an account?{' '}
            <Link to="/register" id="go-register-link" style={{ color: 'var(--accent)', fontWeight: '600' }}>
              Sign Up
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}

const styles = {
  card: {
    width: '100%',
    maxWidth: '420px',
    padding: '40px 36px',
    margin: '0 24px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  icon: {
    display: 'inline-flex',
    marginBottom: '16px',
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  subtitle: {
    color: 'var(--text-muted)',
    fontSize: '0.875rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    marginBottom: '24px',
  },
  footer: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.875rem',
  },
};
