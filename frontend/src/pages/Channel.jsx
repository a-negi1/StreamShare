import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import VideoCard from '../components/VideoCard';

export default function Channel() {
  const { userId } = useParams();
  const [videos, setVideos] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get(`/videos/channel/${userId}`),
      API.get(`/users/${userId}`).catch(() => ({ data: null })),
    ])
      .then(([videosRes, userRes]) => {
        setVideos(videosRes.data);
        if (userRes.data) setProfile(userRes.data);
        else if (videosRes.data.length > 0) {
          const v = videosRes.data[0];
          setProfile({ username: v.uploaderName, avatar: v.uploaderAvatar });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const initial = profile?.username?.[0]?.toUpperCase() || '?';

  return (
    <>
      <Navbar />
      <main id="channel-page" className="page">
        <div className="container">
          {loading ? (
            <div style={styles.heroSkeleton}>
              <div className="skeleton" style={{ width: '80px', height: '80px', borderRadius: '50%' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="skeleton" style={{ width: '200px', height: '24px' }} />
                <div className="skeleton" style={{ width: '120px', height: '16px' }} />
              </div>
            </div>
          ) : (
            <div style={styles.hero} id="channel-hero">
              {profile?.avatar ? (
                <img src={profile.avatar} alt={profile.username} className="avatar" style={{ width: '80px', height: '80px' }} />
              ) : (
                <div style={styles.avatarLg} className="avatar-placeholder">{initial}</div>
              )}
              <div>
                <h1 style={styles.channelName}>{profile?.username || 'Channel'}</h1>
                {profile?.channelDescription && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '6px', maxWidth: '480px' }}>
                    {profile.channelDescription}
                  </p>
                )}
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginTop: '6px' }}>
                  {videos.length} video{videos.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}

          <div className="divider" />

          <h2 style={styles.sectionTitle}>Videos</h2>

          {!loading && videos.length === 0 ? (
            <div id="no-channel-videos" style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)' }}>
              No videos uploaded yet.
            </div>
          ) : (
            <div className="video-grid fade-in" id="channel-video-grid">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} style={styles.skeletonCard}>
                      <div className="skeleton" style={{ aspectRatio: '16/9', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }} />
                      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className="skeleton" style={{ height: '16px', width: '85%' }} />
                        <div className="skeleton" style={{ height: '13px', width: '50%' }} />
                      </div>
                    </div>
                  ))
                : videos.map((v) => <VideoCard key={v._id} video={v} />)
              }
            </div>
          )}
        </div>
      </main>
    </>
  );
}

const styles = {
  heroSkeleton: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
    padding: '32px 0',
  },
  hero: {
    display: 'flex',
    gap: '24px',
    alignItems: 'center',
    padding: '32px 0',
  },
  avatarLg: {
    width: '80px',
    height: '80px',
    fontSize: '1.8rem',
    fontWeight: '800',
    flexShrink: 0,
  },
  channelName: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    marginBottom: '24px',
    color: 'var(--text-primary)',
  },
  skeletonCard: {
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
  },
};
