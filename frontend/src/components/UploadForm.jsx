import { useState, useRef } from 'react';
import API from '../api/axios';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = ['Education', 'Gaming', 'Music', 'Sports', 'News', 'Comedy', 'Tech', 'Other'];

export default function UploadForm() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith('video/')) {
      setFile(dropped);
      setError('');
    } else {
      setError('Please drop a valid video file.');
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please select a video file.');
    if (!title.trim()) return setError('Please enter a title.');
    if (file.size > 500 * 1024 * 1024) return setError('File must be under 500 MB.');

    setUploading(true);
    setProgress(0);
    setError('');

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('category', category);
    formData.append('tags', tags.trim());

    try {
      const { data } = await API.post('/videos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      navigate(`/watch/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
      setUploading(false);
    }
  };

  return (
    <form id="upload-form" onSubmit={handleSubmit} style={styles.form}>
      {!file ? (
        <div
          id="drop-zone"
          style={{ ...styles.dropZone, ...(dragging ? styles.dropZoneDragging : {}) }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
        >
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p style={styles.dropTitle}>Drag & drop your video here</p>
          <p style={styles.dropSub}>or click to browse — MP4, MOV, AVI, MKV up to 500 MB</p>
          <input
            ref={fileInputRef}
            id="video-file-input"
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div style={styles.fileInfo}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div>
            <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{file.name}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              {(file.size / (1024 * 1024)).toFixed(1)} MB
            </p>
          </div>
          {!uploading && (
            <button
              id="change-file-btn"
              type="button"
              className="btn btn-ghost"
              style={{ marginLeft: 'auto', fontSize: '0.8rem', padding: '6px 14px' }}
              onClick={() => setFile(null)}
            >
              Change
            </button>
          )}
        </div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="video-title">Title *</label>
        <input
          id="video-title"
          type="text"
          className="form-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your video a catchy title"
          maxLength={100}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="video-description">Description</label>
        <textarea
          id="video-description"
          className="form-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your video…"
          maxLength={5000}
          rows={4}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="video-category">Category</label>
          <select
            id="video-category"
            className="form-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="video-tags">Tags</label>
          <input
            id="video-tags"
            type="text"
            className="form-input"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="react, tutorial, coding"
          />
        </div>
      </div>

      {uploading && (
        <div style={styles.progressWrap} id="upload-progress">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {progress < 100 ? 'Uploading…' : 'Processing on server…'}
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--accent)' }}>
              {progress}%
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          {progress === 100 && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              HLS transcoding in progress — you'll be redirected now. Video will be ready shortly.
            </p>
          )}
        </div>
      )}

      {error && <div className="error-msg" id="upload-error">{error}</div>}

      <button
        id="upload-submit-btn"
        type="submit"
        className="btn btn-primary"
        disabled={uploading}
        style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}
      >
        {uploading ? (
          <>
            <span className="spinner spinner-sm" />
            {progress < 100 ? `Uploading ${progress}%` : 'Processing…'}
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload & Transcode
          </>
        )}
      </button>
    </form>
  );
}

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  dropZone: {
    border: '2px dashed var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: '60px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    cursor: 'pointer',
    transition: 'var(--transition)',
    background: 'var(--bg-card)',
    textAlign: 'center',
  },
  dropZoneDragging: {
    borderColor: 'var(--accent)',
    background: 'rgba(99, 102, 241, 0.06)',
  },
  dropTitle: {
    fontSize: '1.05rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  dropSub: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    background: 'rgba(34, 197, 94, 0.06)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    borderRadius: 'var(--radius-lg)',
    padding: '16px 20px',
  },
  progressWrap: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '16px',
  },
};
