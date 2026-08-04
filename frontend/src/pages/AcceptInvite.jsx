import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Mail, CheckCircle, XCircle } from 'lucide-react';

const AcceptInvite = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await api.post(`/documents/${id}/accept-invite`);
      navigate(`/editor/${id}`);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8f9fa' }}>
      <div style={{ background: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <div style={{ background: '#e3f2fd', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Mail size={32} color="#1976d2" />
        </div>
        <h2 style={{ fontSize: '1.5rem', color: '#1f1f1f', marginBottom: '10px' }}>Collaboration Invite</h2>
        <p style={{ color: '#5f6368', marginBottom: '24px', lineHeight: '1.5' }}>
          You have been invited to collaborate on a document. Accept the invitation to view and edit the document.
        </p>
        
        {error && (
          <div style={{ background: '#fce8e6', color: '#d93025', padding: '12px', borderRadius: '4px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', textAlign: 'left' }}>
            <XCircle size={18} />
            {error}
          </div>
        )}

        <button
          onClick={handleAccept}
          disabled={loading}
          style={{
            background: '#1a73e8',
            color: '#fff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => { if(!loading) e.currentTarget.style.background = '#1557b0' }}
          onMouseLeave={(e) => { if(!loading) e.currentTarget.style.background = '#1a73e8' }}
        >
          <CheckCircle size={18} />
          {loading ? 'Accepting...' : 'Accept Invitation'}
        </button>

        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'transparent',
            color: '#1a73e8',
            border: '1px solid #1a73e8',
            padding: '12px 24px',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: 'pointer',
            width: '100%',
            marginTop: '12px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f1f3f4'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default AcceptInvite;
