import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Plus, Search, FileText, MoreVertical, LogOut, Menu, LayoutGrid } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { useDocumentStore } from '../store/documentStore';

const Dashboard = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('recent'); // 'recent', 'owned', 'shared'

  const { documents, createDocument, deleteDocument, renameDocument, duplicateDocument } = useDocumentStore();
  const [activeMenu, setActiveMenu] = useState(null); // id of doc with active menu
  const [profileMenu, setProfileMenu] = useState(false);

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

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenu(null);
      setProfileMenu(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const isOwner = doc.owner === user?.name;
    const isShared = !isOwner; // Simplified mock condition

    if (!matchesSearch) return false;
    
    if (activeTab === 'owned') return isOwner;
    if (activeTab === 'shared') return isShared;
    return true; // 'recent' shows all
  }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#fff' }}>

      {/* Top Navbar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        {/* Left: Menu & Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '200px' }}>
          <button className="btn-ghost" style={{ padding: '8px', color: '#5f6368' }}>
            <Menu size={24} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
            <FileText size={32} fill="#4285F4" stroke="white" />
            <span style={{ fontSize: '1.4rem', color: '#5f6368', fontFamily: 'Product Sans, Arial, sans-serif' }}>SyncWrite</span>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div style={{ flex: 1, maxWidth: '720px', padding: '0 20px' }}>
          <div style={{
            position: 'relative',
            width: '100%',
            backgroundColor: '#f1f3f4',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            transition: 'background-color 0.1s ease, box-shadow 0.1s ease'
          }}>
            <button className="btn-ghost" style={{ padding: '12px', color: '#5f6368' }}>
              <Search size={20} />
            </button>
            <input
              type="text"
              placeholder="Search"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                padding: '12px 12px 12px 0',
                fontSize: '1rem',
                color: '#202124',
                outline: 'none'
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Right: Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '200px', justifyContent: 'flex-end' }}>
          <button className="btn-ghost" style={{ padding: '8px', color: '#5f6368' }}>
            <LayoutGrid size={24} />
          </button>

          <div style={{ position: 'relative' }}>
            <button
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#a8c7fa',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#041e49',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '1.1rem'
              }}
              onClick={(e) => {
                e.stopPropagation();
                setProfileMenu(!profileMenu);
              }}
            >
              {user?.name?.charAt(0) || 'U'}
            </button>

            {profileMenu && (
              <div style={{
                position: 'absolute',
                top: '50px',
                right: 0,
                background: '#fff',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                borderRadius: '8px',
                padding: '16px',
                minWidth: '250px',
                zIndex: 20
              }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#a8c7fa', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#041e49', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, color: '#202124' }}>{user?.name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#5f6368' }}>{user?.email}</div>
                  </div>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '12px 0' }} />
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: '#fff',
                    border: '1px solid #dadce0',
                    borderRadius: '4px',
                    color: '#3c4043',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  <LogOut size={18} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Start a new document section */}
      {!searchQuery && (
        <section style={{ backgroundColor: '#f1f3f4', padding: '32px 0' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '1rem', color: '#202124', fontWeight: 500 }}>Start a new document</span>
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
              {/* Blank Template Card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '140px' }}>
                <button
                  onClick={handleCreateDoc}
                  style={{
                    width: '140px',
                    height: '180px',
                    backgroundColor: '#fff',
                    border: '1px solid #dadce0',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#1a73e8'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#dadce0'}
                >
                  <Plus size={48} color="#1a73e8" strokeWidth={1.5} />
                </button>
                <span style={{ fontSize: '0.9rem', color: '#202124', fontWeight: 500, paddingLeft: '4px' }}>Blank document</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recent Documents Section */}
      <main style={{ flex: 1, backgroundColor: '#fff', padding: '32px 0' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <span style={{ fontSize: '1rem', color: '#202124', fontWeight: 500 }}>
              {searchQuery ? 'Search results' : 'Recent documents'}
            </span>
            {/* Tabs */}
            {!searchQuery && (
              <div style={{ display: 'flex', gap: '8px' }}>
                {['recent', 'owned', 'shared'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      background: activeTab === tab ? '#e8f0fe' : 'transparent',
                      color: activeTab === tab ? '#1a73e8' : '#5f6368',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      textTransform: 'capitalize'
                    }}
                    onMouseEnter={(e) => { if (activeTab !== tab) e.currentTarget.style.backgroundColor = '#f1f3f4' }}
                    onMouseLeave={(e) => { if (activeTab !== tab) e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    {tab === 'recent' ? 'Recently opened' : tab === 'owned' ? 'Owned by me' : 'Shared with me'}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            {filteredDocs.map(doc => (
              <div
                key={doc.id}
                style={{
                  width: '100%',
                  border: '1px solid #dadce0',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  backgroundColor: '#fff',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onClick={() => openDoc(doc.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#1a73e8';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#dadce0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Thumbnail Area */}
                <div style={{
                  height: '180px',
                  backgroundColor: '#f8f9fa',
                  borderBottom: '1px solid #dadce0',
                  borderTopLeftRadius: '4px',
                  borderTopRightRadius: '4px',
                  padding: '16px',
                  overflow: 'hidden',
                  color: '#bdc1c6',
                  display: 'flex',
                  alignItems: 'flex-start'
                }}>
                  {/* Fake text lines for thumbnail */}
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ width: '80%', height: '8px', background: '#e8eaed', borderRadius: '4px' }}></div>
                    <div style={{ width: '100%', height: '8px', background: '#e8eaed', borderRadius: '4px' }}></div>
                    <div style={{ width: '90%', height: '8px', background: '#e8eaed', borderRadius: '4px' }}></div>
                    <div style={{ width: '60%', height: '8px', background: '#e8eaed', borderRadius: '4px' }}></div>
                  </div>
                </div>

                {/* Footer Area */}
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FileText size={20} fill="#4285F4" stroke="white" style={{ flexShrink: 0 }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.9rem',
                      color: '#202124',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginBottom: '4px'
                    }}>
                      {doc.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#5f6368', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Opened {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                      </span>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Created: {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
                        Owner: {doc.owner}
                      </span>
                    </div>
                  </div>

                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <button
                      className="btn-ghost"
                      style={{ padding: '4px', color: '#5f6368', borderRadius: '50%' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === doc.id ? null : doc.id);
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <MoreVertical size={18} />
                    </button>
                    {activeMenu === doc.id && (
                      <div
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: '100%',
                          zIndex: 50,
                          minWidth: '150px',
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '8px 0',
                          background: '#fff',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                          borderRadius: '4px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          style={{ textAlign: 'left', padding: '8px 16px', width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', color: '#202124', fontSize: '0.9rem' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f3f4'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          onClick={() => {
                            const newTitle = prompt('Enter new title:', doc.title);
                            if (newTitle) renameDocument(doc.id, newTitle);
                            setActiveMenu(null);
                          }}
                        >
                          Rename
                        </button>
                        <button
                          style={{ textAlign: 'left', padding: '8px 16px', width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', color: '#202124', fontSize: '0.9rem' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f3f4'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          onClick={() => {
                            duplicateDocument(doc.id, user?.name);
                            setActiveMenu(null);
                          }}
                        >
                          Duplicate
                        </button>
                        <button
                          style={{ textAlign: 'left', padding: '8px 16px', width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', color: '#d93025', fontSize: '0.9rem' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f3f4'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          onClick={() => {
                            if (confirm('Are you sure you want to remove this document?')) {
                              deleteDocument(doc.id);
                            }
                            setActiveMenu(null);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredDocs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px 0', color: '#5f6368' }}>
              <p>No documents found.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
