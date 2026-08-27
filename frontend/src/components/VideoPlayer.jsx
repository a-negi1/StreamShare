import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export default function VideoPlayer({ src, poster, videoId, onTimeUpdate }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [qualities, setQualities] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!src || !videoRef.current) return;

    setError(null);
    setLoaded(false);
    setQualities([]);
    setCurrentLevel(-1);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
      });
      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setLoaded(true);
        const levels = data.levels.map((level, idx) => ({
          idx,
          label: level.height ? `${level.height}p` : `Level ${idx}`,
          bitrate: level.bitrate,
        }));
        setQualities([{ idx: -1, label: 'Auto' }, ...levels]);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        setCurrentLevel(hls.autoLevelEnabled ? -1 : data.level);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          setError('Failed to load video. Please try again.');
          console.error('HLS fatal error:', data);
        }
      });
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = src;
      setLoaded(true);
    } else {
      setError('Your browser does not support HLS video playback.');
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  const switchQuality = (level) => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = level;
    setCurrentLevel(level);
  };

  if (error) {
    return (
      <div style={styles.errorBox}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p style={{ color: 'var(--error)', marginTop: '12px' }}>{error}</p>
      </div>
    );
  }

  return (
    <div id={`player-${videoId}`} style={styles.playerWrap}>
      <video
        ref={videoRef}
        poster={poster}
        controls
        style={styles.video}
        playsInline
        onTimeUpdate={onTimeUpdate}
        id={`video-element-${videoId}`}
      />
      {qualities.length > 1 && (
        <div style={styles.qualityBar} id="quality-selector">
          {qualities.map((q) => (
            <button
              key={q.idx}
              id={`quality-btn-${q.idx}`}
              onClick={() => switchQuality(q.idx)}
              style={{
                ...styles.qualityBtn,
                ...(currentLevel === q.idx ? styles.qualityBtnActive : {}),
              }}
            >
              {q.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  playerWrap: {
    position: 'relative',
    background: '#000',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    aspectRatio: '16/9',
    width: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
  },
  errorBox: {
    aspectRatio: '16/9',
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--border)',
  },
  qualityBar: {
    position: 'absolute',
    bottom: '52px',
    right: '12px',
    display: 'flex',
    gap: '4px',
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(8px)',
    borderRadius: 'var(--radius)',
    padding: '4px',
  },
  qualityBtn: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '0.72rem',
    fontWeight: '600',
    padding: '4px 8px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  qualityBtnActive: {
    background: 'var(--accent)',
    color: 'white',
  },
};
