import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import VideoPlayer from '../components/VideoPlayer';
import CommentSection from '../components/CommentSection';

function formatViews(views) {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
  return views?.toString() || '0';
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDuration(s) {
  if (!s) return '';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function Watch() {
  const { id } = useParams();
  const { user } = useAuth();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [viewCounted, setViewCounted] = useState(false);

  useEffect(() => {
    setLoading(true);
    setViewCounted(false);
    API.get(`/videos/${id}`)
      .then(({ data }) => {
        setVideo(data);
        setLikeCount(data.likes?.length || 0);
        setDislikeCount(data.dislikes?.length || 0);
        if (user) {
          setLiked(data.likes?.includes(user._id));
          setDisliked(data.dislikes?.includes(user._id));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleTimeUpdate = () => {
    if (!viewCounted) {
      setViewCounted(true);
      API.post(`/videos/${id}/view`).catch(() => {});
    }
  };

  const handleLike = async () => {
    if (!user) return;
    try {
      const { data } = await API.post(`/videos/${id}/like`);
      setLikeCount(data.likes);
      setDislikeCount(data.dislikes);
      setLiked((prev) => !prev);
      if (disliked) setDisliked(false);
    } catch {}
  };

  const handleDislike = async () => {
    if (!user) return;
    try {
      const { data } = await API.post(`/videos/${id}/dislike`);
      setLikeCount(data.likes);
      setDislikeCount(data.dislikes);
      setDisliked((prev) => !prev);
      if (liked) setLiked(false);
    } catch {}
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="page" id="watch-page-loading">
          <div className="container" style={styles.layout}>
            <div>
              <div className="skeleton" style={{ aspectRatio: '16/9', borderRadius: 'var(--radius-lg)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                <div className="skeleton" style={{ height: '24px', width: '70%' }} />
                <div className="skeleton" style={{ height: '16px', width: '40%' }} />
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!video) {
    return (
      <>
        <Navbar />
        <main className="page" id="watch-page-404">
          <div className="container flex-center" style={{ minHeight: '50vh', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Video not found</p>
            <Link to="/" className="btn btn-primary">Go Home</Link>
          </div>
        </main>
      </>
    );
  }

  const uploaderInitial = video.uploader?.username?.[0]?.toUpperCase() || '?';

  return (
    <>
      <Navbar />
      <main id="watch-page" className="page">
        <div className="container" style={styles.layout}>
          <div style={styles.main}>
            {video.masterPlaylist ? (
              <VideoPlayer
                src={video.masterPlaylist}
                poster={video.thumbnailUrl}
                videoId={id}
                onTimeUpdate={handleTimeUpdate}
              />
            ) : (
              <div style={styles.processing}>
                <div className="spinner" />
                <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>
                  {video.status === 'failed' ? 'Transcoding failed.' : 'Video is being transcoded…'}
                </p>
                {video.status === 'processing' && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '6px' }}>
                    This may take a few minutes. Refresh to check.
                  </p>
                )}
              </div>
            )}

            <div style={styles.videoInfo} id="video-info">
              <h1 style={styles.title}>{video.title}</h1>

              <div style={styles.metaRow}>
                <div style={styles.stats}>
                  <span>{formatViews(video.views)} views</span>
                  <span style={{ color: 'var(--text-muted)' }}>•</span>
                  <span>{formatDate(video.createdAt)}</span>
                  {video.duration > 0 && (
                    <>
                      <span style={{ color: 'var(--text-muted)' }}>•</span>
                      <span>{formatDuration(video.duration)}</span>
                    </>
                  )}
                </div>

                <div style={styles.actions}>
                  <button
                    id="like-btn"
                    onClick={handleLike}
                    style={{ ...styles.actionBtn, ...(liked ? styles.actionBtnActive : {}) }}
                    title={user ? 'Like' : 'Sign in to like'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
                      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                    </svg>
                    {likeCount}
                  </button>

                  <button
                    id="dislike-btn"
                    onClick={handleDislike}
                    style={{ ...styles.actionBtn, ...(disliked ? styles.actionBtnDanger : {}) }}
                    title={user ? 'Dislike' : 'Sign in to dislike'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={disliked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
                      <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                    </svg>
                    {dislikeCount}
                  </button>

                  {video.qualities?.length > 0 && (
                    <div style={styles.qualityBadges}>
                      {video.qualities.map((q) => (
                        <span key={q} className="badge badge-accent">{q}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="divider" />

              <div style={styles.uploaderRow}>
                <Link to={`/channel/${video.uploader?._id}`} id="uploader-link" style={styles.uploaderLink}>
                  {video.uploader?.avatar ? (
                    <img src={video.uploader.avatar} alt={video.uploader.username} className="avatar" style={{ width: '46px', height: '46px' }} />
                  ) : (
                    <div style={styles.uploaderAvatar} className="avatar-placeholder">{uploaderInitial}</div>
                  )}
                  <div>
                    <p style={styles.uploaderName}>{video.uploader?.username || video.uploaderName}</p>
                    {video.uploader?.channelDescription && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {video.uploader.channelDescription}
                      </p>
                    )}
                  </div>
                </Link>
              </div>

              {video.description && (
                <div style={styles.description}>
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {video.description}
                  </p>
                </div>
              )}

              {video.tags?.length > 0 && (
                <div style={styles.tags}>
                  {video.tags.map((tag) => (
                    <span key={tag} className="badge badge-accent">#{tag}</span>
                  ))}
                </div>
              )}
            </div>

            <CommentSection videoId={id} />
          </div>
        </div>
      </main>
    </>
  );
}

const styles = {
  layout: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
  },
  processing: {
    aspectRatio: '16/9',
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--border)',
  },
  videoInfo: {
    marginTop: '20px',
  },
  title: {
    fontSize: '1.4rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    lineHeight: '1.3',
    marginBottom: '12px',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
  },
  stats: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  actionBtnActive: {
    background: 'rgba(99, 102, 241, 0.15)',
    color: 'var(--accent)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  actionBtnDanger: {
    background: 'rgba(239, 68, 68, 0.12)',
    color: 'var(--error)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  qualityBadges: {
    display: 'flex',
    gap: '4px',
  },
  uploaderRow: {
    marginBottom: '16px',
  },
  uploaderLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '12px',
    textDecoration: 'none',
  },
  uploaderAvatar: {
    width: '46px',
    height: '46px',
    fontSize: '1rem',
  },
  uploaderName: {
    fontWeight: '700',
    fontSize: '0.95rem',
    color: 'var(--text-primary)',
  },
  description: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '16px',
    marginBottom: '16px',
  },
  tags: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
};
