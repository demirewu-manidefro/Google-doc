import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { LogOut, Monitor, Smartphone, Globe, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SessionManager = () => {
  const { sessions, fetchSessions, revokeSession, logout, user } = useAuthStore();
  const [loadingId, setLoadingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevoke = async (id) => {
    setLoadingId(id);
    try {
      await revokeSession(id);
    } finally {
      setLoadingId(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDeviceIcon = (ua) => {
    if (!ua) return <Globe className="w-5 h-5 text-gray-500" />;
    if (ua.toLowerCase().includes('mobile') || ua.toLowerCase().includes('android') || ua.toLowerCase().includes('ios')) {
      return <Smartphone className="w-5 h-5 text-gray-500" />;
    }
    return <Monitor className="w-5 h-5 text-gray-500" />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 w-full max-w-4xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Security & Sessions</h2>
          <p className="text-gray-500 text-sm mt-1">Manage your active sessions across devices.</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-md hover:bg-red-100 transition-colors font-medium"
        >
          <LogOut className="w-4 h-4" />
          Log Out of Current Device
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Active Sessions ({sessions.length})</h3>
        
        {sessions.length === 0 ? (
          <p className="text-gray-500 italic">No active sessions found.</p>
        ) : (
          <ul className="divide-y divide-gray-100 border rounded-md">
            {sessions.map((session) => (
              <li key={session.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-white rounded-full shadow-sm border mt-1">
                    {getDeviceIcon(session.userAgent)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">
                        {session.userAgent || 'Unknown Device'}
                      </span>
                      {session.isCurrent && (
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                          Current Session
                        </span>
                      )}
                      {session.isSuspicious && (
                        <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium" title="Unrecognized IP Address">
                          <ShieldAlert className="w-3 h-3" />
                          Suspicious
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1 flex flex-col sm:flex-row sm:gap-4">
                      <span><span className="font-medium text-gray-600">IP:</span> {session.ipAddress || 'Unknown'}</span>
                      <span className="hidden sm:inline text-gray-300">•</span>
                      <span><span className="font-medium text-gray-600">Last Active:</span> {formatDate(session.updatedAt)}</span>
                    </div>
                  </div>
                </div>
                
                {!session.isCurrent && (
                  <button
                    onClick={() => handleRevoke(session.id)}
                    disabled={loadingId === session.id}
                    className="self-start sm:self-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50 hover:text-red-600 transition-colors disabled:opacity-50 font-medium shadow-sm"
                  >
                    {loadingId === session.id ? 'Revoking...' : 'Revoke Access'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SessionManager;
