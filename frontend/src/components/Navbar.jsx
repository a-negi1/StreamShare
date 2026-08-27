import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onSearch }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(query);
    else navigate(`/?search=${encodeURIComponent(query)}`);
  };

  const initial = user?.username?.[0]?.toUpperCase() || '?';

  return (
    <nav id="main-navbar" style={styles.nav}>
      <div style={styles.inner}>
        <Link to="/" style={styles.logo} id="nav-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="url(#lg)" />
            <path d="M10 8l10 6-10 6V8z" fill="white" />
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="28" y2="28">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
          <span style={styles.logoText}>StreamShare</span>
        </Link>

        <form onSubmit={handleSearch} style={styles.searchForm} id="search-form">
          <input
            id="search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search videos..."
            style={styles.searchInput}
          />
          <button type="submit" style={styles.searchBtn} id="search-btn" aria-label="Search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </form>

        <div style={styles.actions}>
          {user ? (
            <>
              <Link to="/upload" id="nav-upload-btn" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '8px 16px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Upload
              </Link>
              <div style={{ position: 'relative' }}>
                <button
                  id="nav-avatar-btn"
                  onClick={() => setMenuOpen(!menuOpen)}
                  style={styles.avatarBtn}
                  aria-label="User menu"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.username} style={{ ...styles.avatarImg }} className="avatar" />
                  ) : (
                    <div style={styles.avatarPlaceholder} className="avatar-placeholder">{initial}</div>
                  )}
                </button>
                {menuOpen && (
                  <div id="nav-dropdown" style={styles.dropdown}>
                    <Link to={`/channel/${user._id}`} id="nav-channel-link" style={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                      My Channel
                    </Link>
                    <button id="nav-logout-btn" style={styles.dropdownItemBtn} onClick={() => { logout(); setMenuOpen(false); navigate('/'); }}>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" id="nav-login-btn" className="btn btn-ghost" style={{ fontSize: '0.85rem', padding: '8px 16px' }}>Sign In</Link>
              <Link to="/register" id="nav-register-btn" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '8px 16px' }}>Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 'var(--nav-height)',
    background: 'rgba(9, 9, 15, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--border)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
  },
  inner: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 24px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
    textDecoration: 'none',
  },
  logoText: {
    fontSize: '1.1rem',
    fontWeight: '800',
    background: 'var(--accent-gradient)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  searchForm: {
    flex: 1,
    maxWidth: '480px',
    display: 'flex',
    gap: '0',
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRight: 'none',
    borderRadius: 'var(--radius) 0 0 var(--radius)',
    padding: '9px 16px',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    transition: 'var(--transition)',
  },
  searchBtn: {
    background: 'var(--accent-gradient)',
    border: 'none',
    borderRadius: '0 var(--radius) var(--radius) 0',
    padding: '9px 16px',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition)',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginLeft: 'auto',
    flexShrink: 0,
  },
  avatarBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    borderRadius: '50%',
  },
  avatarImg: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid var(--accent)',
  },
  avatarPlaceholder: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'var(--accent-gradient)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9rem',
    fontWeight: '700',
    color: 'white',
    border: '2px solid var(--accent)',
  },
  dropdown: {
    position: 'absolute',
    right: 0,
    top: 'calc(100% + 12px)',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    minWidth: '160px',
    boxShadow: 'var(--shadow-lg)',
    overflow: 'hidden',
    zIndex: 100,
  },
  dropdownItem: {
    display: 'block',
    padding: '12px 16px',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    transition: 'var(--transition)',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  dropdownItemBtn: {
    display: 'block',
    width: '100%',
    padding: '12px 16px',
    background: 'none',
    border: 'none',
    color: 'var(--error)',
    fontSize: '0.875rem',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
};
