import { Link } from 'react-router-dom';

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatViews(views) {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
  return views?.toString() || '0';
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default function VideoCard({ video }) {
  const initial = video.uploaderName?.[0]?.toUpperCase() || '?';

  return (
    <Link to={`/watch/${video._id}`} id={`video-card-${video._id}`} style={styles.card} className="card">
      <div style={styles.thumbWrap}>
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            style={styles.thumb}
            loading="lazy"
          />
        ) : (
          <div style={styles.thumbPlaceholder}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        )}
        {video.duration > 0 && (
          <span style={styles.duration}>{formatDuration(video.duration)}</span>
        )}
        {video.status === 'processing' && (
          <span style={styles.processingBadge}>Processing…</span>
        )}
        <div style={styles.hoverOverlay}>
          <svg width="42" height="42" viewBox="0 0 24 24" fill="white">
            <circle cx="12" cy="12" r="11" fill="rgba(0,0,0,0.6)" />
            <polygon points="10 8 16 12 10 16 10 8" fill="white" />
          </svg>
        </div>
      </div>

      <div style={styles.info}>
        <div style={styles.uploaderRow}>
          {video.uploaderAvatar ? (
            <img src={video.uploaderAvatar} alt={video.uploaderName} style={styles.avatar} className="avatar" />
          ) : (
            <div style={{ ...styles.avatarPlaceholder, fontSize: '0.65rem' }} className="avatar-placeholder">
              {initial}
            </div>
          )}
          <div style={styles.meta}>
            <p style={styles.title} title={video.title}>{video.title}</p>
            <p style={styles.uploader}>{video.uploaderName}</p>
            <p style={styles.stats}>
              {formatViews(video.views)} views · {timeAgo(video.createdAt)}
            </p>
          </div>
        </div>
        {video.category && video.category !== 'Other' && (
          <span className="badge badge-accent" style={{ marginTop: '8px', alignSelf: 'flex-start' }}>
            {video.category}
          </span>
        )}
      </div>
    </Link>
  );
}

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    textDecoration: 'none',
    borderRadius: 'var(--radius-lg)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'pointer',
  },
  thumbWrap: {
    position: 'relative',
    aspectRatio: '16/9',
    overflow: 'hidden',
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
  },
  thumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.35s ease',
  },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-secondary)',
  },
  duration: {
    position: 'absolute',
    bottom: '8px',
    right: '8px',
    background: 'rgba(0,0,0,0.85)',
    color: 'white',
    fontSize: '0.72rem',
    fontWeight: '600',
    padding: '2px 6px',
    borderRadius: '4px',
    letterSpacing: '0.02em',
  },
  processingBadge: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    background: 'rgba(245,158,11,0.9)',
    color: '#fff',
    fontSize: '0.7rem',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  hoverOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.2s ease',
    background: 'rgba(0,0,0,0.15)',
  },
  info: {
    padding: '12px 14px 14px',
    display: 'flex',
    flexDirection: 'column',
  },
  uploaderRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
  },
  avatar: {
    width: '32px',
    height: '32px',
    flexShrink: 0,
    marginTop: '2px',
  },
  avatarPlaceholder: {
    width: '32px',
    height: '32px',
    flexShrink: 0,
    marginTop: '2px',
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    lineHeight: '1.35',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    marginBottom: '3px',
  },
  uploader: {
    fontSize: '0.775rem',
    color: 'var(--text-secondary)',
    marginBottom: '2px',
    fontWeight: '500',
  },
  stats: {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
  },
};
