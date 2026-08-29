import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import VideoCard from '../components/VideoCard';

const CATEGORIES = ['All', 'Education', 'Gaming', 'Music', 'Sports', 'News', 'Comedy', 'Tech', 'Other'];

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const fetchVideos = useCallback(async (p = 1, cat = category, q = search) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 12 };
      if (cat && cat !== 'All') params.category = cat;
      if (q) params.search = q;
      const { data } = await API.get('/videos', { params });
      setVideos(data.videos);
      setTotalPages(data.pages);
      setPage(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    const q = searchParams.get('search') || '';
    setSearch(q);
    fetchVideos(1, category, q);
  }, [searchParams]);

  const handleSearch = (q) => {
    setSearch(q);
    setSearchParams(q ? { search: q } : {});
  };

  const handleCategory = (cat) => {
    setCategory(cat);
    fetchVideos(1, cat, search);
  };

  return (
    <>
      <Navbar onSearch={handleSearch} />
      <main id="home-page" className="page">
        <div className="container">
          <div style={styles.categoryBar} id="category-tabs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                id={`category-${cat.toLowerCase()}`}
                onClick={() => handleCategory(cat)}
                style={{
                  ...styles.catBtn,
                  ...(category === cat ? styles.catBtnActive : {}),
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {search && (
            <div style={styles.searchInfo}>
              <span>Results for <strong>"{search}"</strong></span>
              <button id="clear-search-btn" className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '6px 14px' }} onClick={() => handleSearch('')}>
                Clear
              </button>
            </div>
          )}

          {loading ? (
            <div className="video-grid" id="video-grid-loading">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} style={styles.skeletonCard}>
                  <div className="skeleton" style={{ aspectRatio: '16/9', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }} />
                  <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="skeleton" style={{ height: '16px', width: '85%' }} />
                    <div className="skeleton" style={{ height: '13px', width: '60%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div id="no-videos" style={styles.empty}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.2">
                <rect x="2" y="7" width="20" height="15" rx="2" />
                <path d="M17 2l-5 5-5-5" />
              </svg>
              <p style={{ color: 'var(--text-secondary)', marginTop: '16px', fontSize: '1rem' }}>
                No videos found
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>
                Try a different search or category
              </p>
            </div>
          ) : (
            <>
              <div className="video-grid fade-in" id="video-grid">
                {videos.map((video) => (
                  <VideoCard key={video._id} video={video} />
                ))}
              </div>

              {totalPages > 1 && (
                <div style={styles.pagination} id="pagination">
                  <button
                    id="prev-page-btn"
                    className="btn btn-ghost"
                    disabled={page <= 1}
                    onClick={() => fetchVideos(page - 1)}
                  >
                    ← Previous
                  </button>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    id="next-page-btn"
                    className="btn btn-ghost"
                    disabled={page >= totalPages}
                    onClick={() => fetchVideos(page + 1)}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}

const styles = {
  categoryBar: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '28px',
  },
  catBtn: {
    padding: '7px 18px',
    borderRadius: '999px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    fontSize: '0.82rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  catBtnActive: {
    background: 'var(--accent-gradient)',
    color: 'white',
    border: '1px solid transparent',
  },
  searchInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
  },
  skeletonCard: {
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '40vh',
    textAlign: 'center',
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
    marginTop: '48px',
  },
};
