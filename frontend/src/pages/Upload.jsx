import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import UploadForm from '../components/UploadForm';

export default function Upload() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <Navbar />
      <main id="upload-page" className="page">
        <div className="container" style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={styles.header}>
            <h1 className="page-title">Upload Video</h1>
            <p className="text-muted text-sm" style={{ marginTop: '4px' }}>
              Videos are transcoded to HLS with 240p–720p adaptive quality automatically.
            </p>
          </div>
          <div className="card" style={styles.formCard}>
            <UploadForm />
          </div>
        </div>
      </main>
    </>
  );
}

const styles = {
  header: {
    marginBottom: '28px',
  },
  formCard: {
    padding: '32px',
  },
};
