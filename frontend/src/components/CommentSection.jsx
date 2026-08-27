import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function CommentSection({ videoId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!videoId) return;
    API.get(`/videos/${videoId}/comments`)
      .then(({ data }) => setComments(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [videoId]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!text.trim() || posting) return;
    setPosting(true);
    try {
      const { data } = await API.post(`/videos/${videoId}/comments`, { text });
      setComments((prev) => [data, ...prev]);
      setText('');
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await API.delete(`/videos/${videoId}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="comment-section" style={styles.wrap}>
      <h3 style={styles.heading}>
        {comments.length} Comment{comments.length !== 1 ? 's' : ''}
      </h3>

      {user ? (
        <form id="comment-form" onSubmit={handlePost} style={styles.form}>
          <div style={styles.formRow}>
            {user.avatar ? (
              <img src={user.avatar} alt={user.username} style={styles.avatar} className="avatar" />
            ) : (
              <div style={styles.avatarPlaceholder} className="avatar-placeholder">
                {user.username[0].toUpperCase()}
              </div>
            )}
            <input
              id="comment-input"
              type="text"
              className="form-input"
              style={{ flex: 1 }}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment…"
              maxLength={500}
            />
            <button
              id="comment-submit-btn"
              type="submit"
              className="btn btn-primary"
              disabled={!text.trim() || posting}
              style={{ padding: '10px 20px', flexShrink: 0 }}
            >
              {posting ? <span className="spinner spinner-sm" /> : 'Post'}
            </button>
          </div>
        </form>
      ) : (
        <p style={styles.signInMsg}>
          <Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link> to leave a comment.
        </p>
      )}

      <div style={styles.list}>
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} style={styles.commentSkeleton} className="skeleton" />
          ))
        ) : comments.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '32px 0' }}>
            No comments yet. Be the first!
          </p>
        ) : (
          comments.map((c) => (
            <div key={c._id} id={`comment-${c._id}`} style={styles.comment}>
              <div style={styles.commentAvatar} className="avatar-placeholder">
                {c.username?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={styles.commentBody}>
                <div style={styles.commentMeta}>
                  <span style={styles.commentUser}>{c.username}</span>
                  <span style={styles.commentTime}>{timeAgo(c.createdAt)}</span>
                </div>
                <p style={styles.commentText}>{c.text}</p>
              </div>
              {user && user._id === c.user && (
                <button
                  id={`delete-comment-${c._id}`}
                  onClick={() => handleDelete(c._id)}
                  style={styles.deleteBtn}
                  title="Delete comment"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                  </svg>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    marginTop: '32px',
  },
  heading: {
    fontSize: '1rem',
    fontWeight: '700',
    marginBottom: '20px',
    color: 'var(--text-primary)',
  },
  form: {
    marginBottom: '28px',
  },
  formRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  avatar: {
    width: '36px',
    height: '36px',
    flexShrink: 0,
  },
  avatarPlaceholder: {
    width: '36px',
    height: '36px',
    flexShrink: 0,
    fontSize: '0.85rem',
  },
  signInMsg: {
    color: 'var(--text-muted)',
    fontSize: '0.875rem',
    marginBottom: '20px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  commentSkeleton: {
    height: '56px',
    borderRadius: 'var(--radius)',
  },
  comment: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: '34px',
    height: '34px',
    flexShrink: 0,
    fontSize: '0.75rem',
  },
  commentBody: {
    flex: 1,
  },
  commentMeta: {
    display: 'flex',
    gap: '8px',
    alignItems: 'baseline',
    marginBottom: '4px',
  },
  commentUser: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  commentTime: {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
  },
  commentText: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    transition: 'var(--transition)',
    flexShrink: 0,
  },
};
