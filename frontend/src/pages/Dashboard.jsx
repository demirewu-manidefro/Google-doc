import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Plus, Search, FileText, MoreVertical, LogOut, Clock, Users, Folder } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { useDocumentStore } from '../store/documentStore';

const Dashboard = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('recent'); // recent, owned, shared
  const [searchQuery, setSearchQuery] = useState('');

  const { documents, createDocument, deleteDocument, renameDocument, duplicateDocument } = useDocumentStore();
  const [activeMenu, setActiveMenu] = useState(null); // id of doc with active menu

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateDoc = () => {
    if (user?.name) {
      const newId = createDocument(user.name);
      navigate(`/document/${newId}`);
    }
  };

  const openDoc = (id) => {
    navigate(`/document/${id}`);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    if (activeTab === 'recent') return true; 
    if (activeTab === 'owned') return doc.owner === user?.name;
    if (activeTab === 'shared') return doc.owner !== user?.name;
    return true;
  }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside className="glass-panel" style={{ 
        width: '260px', 
        borderLeft: 'none', 
        borderTop: 'none', 
        borderBottom: 'none', 
        borderRadius: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 0'
      }}>
        <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }} className="flex-center">
          <div style={{ 
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            padding: '8px',
            borderRadius: '12px',
            marginRight: '12px'
          }}>
            <FileText size={20} color="white" />
          </div>
          <h2 className="heading-gradient" style={{ fontSize: '1.5rem' }}>SyncWrite</h2>
        </div>

        <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleCreateDoc}>
            <Plus size={18} />
            <span>New Document</span>
          </button>
        </div>

        <nav style={{ flex: 1, padding: '0 1rem' }}>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>
              <button 
                onClick={() => setActiveTab('recent')}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', 
                  padding: '10px 16px', borderRadius: 'var(--radius-md)',
                  color: activeTab === 'recent' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: activeTab === 'recent' ? 'rgba(0,0,0,0.05)' : 'transparent',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <Clock size={18} />
                <span style={{ fontWeight: 500 }}>Recent</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('owned')}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', 
                  padding: '10px 16px', borderRadius: 'var(--radius-md)',
                  color: activeTab === 'owned' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: activeTab === 'owned' ? 'rgba(0,0,0,0.05)' : 'transparent',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <Folder size={18} />
                <span style={{ fontWeight: 500 }}>My Documents</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('shared')}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', 
                  padding: '10px 16px', borderRadius: 'var(--radius-md)',
                  color: activeTab === 'shared' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: activeTab === 'shared' ? 'rgba(0,0,0,0.05)' : 'transparent',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <Users size={18} />
                <span style={{ fontWeight: 500 }}>Shared with me</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* User Profile Footer */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={user?.avatar} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-tertiary)' }} />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.email}</div>
          </div>
          <button onClick={handleLogout} className="btn-ghost" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem 3rem', display: 'flex', flexDirection: 'column' }}>
        <header className="flex-between" style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2rem', color: 'var(--text-primary)' }}>
            {activeTab === 'recent' && 'Recent Documents'}
            {activeTab === 'owned' && 'My Documents'}
            {activeTab === 'shared' && 'Shared With Me'}
          </h1>
          
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} color="var(--text-tertiary)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search documents..." 
              style={{ paddingLeft: '40px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        {/* Document Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {filteredDocs.map(doc => (
            <div 
              key={doc.id} 
              className="glass-panel" 
              style={{ 
                padding: '1.5rem', 
                cursor: 'pointer',
                transition: 'all var(--transition-normal)',
                position: 'relative'
              }}
              onClick={() => openDoc(doc.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
                e.currentTarget.style.borderColor = 'var(--glass-border)';
              }}
            >
              <div className="flex-between" style={{ marginBottom: '1rem' }}>
                <div style={{ 
                  background: 'rgba(99, 102, 241, 0.1)', 
                  padding: '10px', 
                  borderRadius: '10px',
                  color: 'var(--accent-primary)'
                }}>
                  <FileText size={24} />
                </div>
                <div style={{ position: 'relative' }}>
                  <button 
                    className="btn-ghost" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setActiveMenu(activeMenu === doc.id ? null : doc.id);
                    }}
                  >
                    <MoreVertical size={18} />
                  </button>
                  {activeMenu === doc.id && (
                    <div 
                      className="glass-panel"
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '100%',
                        zIndex: 50,
                        minWidth: '150px',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '0.5rem',
                        background: 'var(--bg-primary)'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button 
                        className="btn-ghost" 
                        style={{ textAlign: 'left', padding: '0.5rem', width: '100%' }}
                        onClick={() => {
                          const newTitle = prompt('Enter new title:', doc.title);
                          if (newTitle) renameDocument(doc.id, newTitle);
                          setActiveMenu(null);
                        }}
                      >
                        Rename
                      </button>
                      <button 
                        className="btn-ghost" 
                        style={{ textAlign: 'left', padding: '0.5rem', width: '100%' }}
                        onClick={() => {
                          duplicateDocument(doc.id, user?.name);
                          setActiveMenu(null);
                        }}
                      >
                        Duplicate
                      </button>
                      <button 
                        className="btn-ghost" 
                        style={{ textAlign: 'left', padding: '0.5rem', width: '100%', color: 'var(--danger)' }}
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this document?')) {
                            deleteDocument(doc.id);
                          }
                          setActiveMenu(null);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{doc.title}</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div className="flex-between">
                  <span>Owner:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{doc.owner}</span>
                </div>
                <div className="flex-between">
                  <span>Opened:</span>
                  <span>{formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          ))}

          {filteredDocs.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
              <Folder size={48} color="var(--text-tertiary)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>No documents found.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
