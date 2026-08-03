import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { Collaboration } from '@tiptap/extension-collaboration';
import { CollaborationCaret } from '@tiptap/extension-collaboration-caret';
import { Link } from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { TrackChangesExtension } from 'tiptap-track-changes';
import { api } from '../api';
import { useAuthStore } from '../store/authStore';
import { useDocumentStore } from '../store/documentStore';
import Toolbar from '../components/Toolbar';
import { ArrowLeft, Share, Save, Users, History, MessageSquare, Star, Folder, Cloud, FileText, Lock, Video, Sparkles, ChevronDown, Plus, MoreVertical, FileDown, LayoutTemplate, PenTool, Mail, Sparkles as SparkleIcon, ArrowUp, Link as LinkIcon, X, Check } from 'lucide-react';

const colors = ['#958DF1', '#F98181', '#FBBC88', '#FAF594', '#70CFF8', '#94FDFB', '#BFDF8A'];
const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const { documents, renameDocument, updateTimestamp, addComment, resolveComment } = useDocumentStore();
  const doc = documents.find(d => d.id === id);

  const [docData, setDocData] = useState(null);
  const [status, setStatus] = useState('connecting');
  const [docTitle, setDocTitle] = useState('Loading...');
  const [activeUsers, setActiveUsers] = useState([]);
  const [activeSidebar, setActiveSidebar] = useState(null); // 'history', 'comments', null
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('EDITOR');
  const [isSuggestingMode, setIsSuggestingMode] = useState(true);
  const userColor = useRef(getRandomColor());

  const [ydoc] = useState(() => new Y.Doc());
  const [provider] = useState(() => new WebsocketProvider(
    'ws://localhost:3001',
    id,
    ydoc
  ));

  useEffect(() => {
    // Fetch document metadata
    api.get(`/documents/${id}`).then(data => {
      setDocData(data);
      setDocTitle(data.title);
    }).catch(err => {
      console.error(err);
      navigate('/dashboard');
    });

    provider.on('synced', synced => {
      setStatus(synced ? 'connected' : 'connecting');
    });

    const updateAwareness = () => {
      const states = Array.from(provider.awareness.getStates().entries());
      const users = states
        .filter(([clientId, state]) => state.user)
        .map(([clientId, state]) => ({
          id: clientId,
          name: state.user.name,
          color: state.user.color,
        }));

      // Filter out self and deduplicate by name for the avatar list
      const currentUserName = user?.name || 'Anonymous';
      const others = users.filter(u => u.name && u.name !== currentUserName);
      const uniqueOthers = others.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i);
      setActiveUsers(uniqueOthers);
    };

    provider.awareness.on('change', updateAwareness);
    updateAwareness();

    // Auto update timestamp on changes
    ydoc.on('update', () => {
      updateTimestamp(id);
    });

    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [id, navigate, updateTimestamp, ydoc, provider, user?.name]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    try {
      const newCollab = await api.post(`/documents/${id}/collaborators`, { email: inviteEmail, role: inviteRole.toUpperCase() });
      setDocData(prev => ({
        ...prev,
        collaborators: [...(prev.collaborators || []), newCollab]
      }));
      setInviteEmail('');
      alert('User invited successfully!');
    } catch (err) {
      let msg = err.message;
      try { const parsed = JSON.parse(err.message); msg = parsed.error; } catch(e){}
      alert(msg || 'Failed to invite user');
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // History is handled by Yjs
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCaret.configure({
        provider: provider,
        user: {
          name: user?.name || 'Anonymous',
          color: userColor.current,
        }
      }),
      TrackChangesExtension.configure({
        author: {
          id: user?.id || Math.random().toString(),
          name: user?.name || 'Anonymous',
          color: userColor.current,
        },
        mode: 'edit', // Will be toggled programmatically
      }),
      TextStyle,
      FontFamily,
    ],
  });

  // Effect to sync Suggesting Mode with Editor
  useEffect(() => {
    if (editor) {
      if (isSuggestingMode) {
        editor.commands.setTrackChangesMode('suggest');
      } else {
        editor.commands.setTrackChangesMode('edit');
      }
    }
  }, [isSuggestingMode, editor]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f9fbfd', fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '8px 16px',
        background: '#f9fbfd',
        zIndex: 10
      }}>
        {/* Left Side: Icon + Title + Menu */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {/* App Icon */}
          <button
            className="btn-ghost"
            onClick={() => navigate('/dashboard')}
            style={{ padding: '8px', color: '#4285F4', background: 'transparent' }}
          >
            <div style={{
              width: '36px', height: '40px', background: '#4285F4', borderRadius: '4px',
              display: 'flex', flexDirection: 'column', padding: '6px', gap: '3px'
            }}>
              <div style={{ width: '100%', height: '3px', background: '#fff', borderRadius: '2px' }} />
              <div style={{ width: '80%', height: '3px', background: '#fff', borderRadius: '2px' }} />
              <div style={{ width: '100%', height: '3px', background: '#fff', borderRadius: '2px' }} />
            </div>
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', marginLeft: '4px' }}>
            {/* Title Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0' }}>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                onBlur={(e) => {
                  renameDocument(id, e.target.value);
                  e.currentTarget.style.border = '1px solid transparent';
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid transparent',
                  color: '#1f1f1f',
                  fontSize: '1.1rem',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  outline: 'none',
                  fontFamily: 'inherit',
                  width: Math.max(160, docTitle.length * 10) + 'px'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = '1px solid #1f1f1f';
                }}
              />
              <button style={{ background: 'transparent', border: 'none', padding: '4px', color: '#444746', cursor: 'pointer', display: 'flex' }}><Star size={16} /></button>
              <button style={{ background: 'transparent', border: 'none', padding: '4px', color: '#444746', cursor: 'pointer', display: 'flex' }}><Folder size={16} /></button>
              <button style={{ background: 'transparent', border: 'none', padding: '4px', color: '#444746', cursor: 'pointer', display: 'flex' }}><Cloud size={16} /></button>
            </div>

            {/* Menu Row */}
            <div style={{ display: 'flex', gap: '2px', fontSize: '0.875rem', color: '#1f1f1f', marginLeft: '2px' }}>
              {['File', 'Edit', 'View', 'Insert', 'Format', 'Tools', 'Gemini', 'Extensions', 'Help'].map(menu => (
                <button
                  key={menu}
                  style={{
                    padding: '2px 7px',
                    borderRadius: '4px',
                    color: '#1f1f1f',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e8eaed'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {menu}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Actions + Share + Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>

          <button
            style={{ background: activeSidebar === 'history' ? '#e8eaed' : 'transparent', border: 'none', padding: '8px', color: '#444746', cursor: 'pointer', borderRadius: '50%' }}
            title="Version History"
            onClick={() => setActiveSidebar(activeSidebar === 'history' ? null : 'history')}
          >
            <History size={22} />
          </button>
          <button
            style={{ background: activeSidebar === 'comments' ? '#e8eaed' : 'transparent', border: 'none', padding: '8px', color: '#444746', cursor: 'pointer', borderRadius: '50%' }}
            title="Comments"
            onClick={() => setActiveSidebar(activeSidebar === 'comments' ? null : 'comments')}
          >
            <MessageSquare size={22} />
          </button>

          {/* Video call with dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'transparent', borderRadius: '24px', cursor: 'pointer' }}>
            <button style={{ background: 'transparent', border: 'none', padding: '8px 4px 8px 12px', color: '#444746', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Video size={24} />
            </button>
            <button style={{ background: 'transparent', border: 'none', padding: '8px 12px 8px 0', color: '#444746', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <ChevronDown size={16} />
            </button>
          </div>

          {/* Share Button Group */}
          <div style={{
            display: 'flex',
            background: '#c2e7ff',
            borderRadius: '24px',
            height: '40px',
            overflow: 'hidden'
          }}>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'transparent',
                color: '#001d35',
                border: 'none',
                padding: '0 16px',
                fontWeight: 500,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
              onClick={() => setIsShareModalOpen(true)}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Lock size={16} />
              Share
            </button>

            <div style={{ width: '1px', background: 'rgba(0,0,0,0.1)', height: '100%' }} />

            <button
              style={{
                background: 'transparent',
                border: 'none',
                padding: '0 8px',
                color: '#001d35',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <ChevronDown size={16} />
            </button>
          </div>

          {/* Suggesting Mode Toggle */}
          <div style={{ display: 'flex', background: isSuggestingMode ? '#e8f0fe' : 'transparent', borderRadius: '4px', padding: '2px' }}>
            <button 
              onClick={() => setIsSuggestingMode(!isSuggestingMode)}
              style={{ background: isSuggestingMode ? '#d3e3fd' : 'transparent', border: 'none', padding: '6px 12px', color: isSuggestingMode ? '#0b57d0' : '#444746', cursor: 'pointer', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Suggesting Mode"
            >
              <PenTool size={16} />
              {isSuggestingMode ? 'Suggesting' : 'Editing'}
            </button>
          </div>

          <div style={{ width: '1px', background: 'rgba(0,0,0,0.1)', height: '24px', margin: '0 8px' }} />

          {/* Accept / Reject Changes (If any) */}
          <button 
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (editor) editor.commands.acceptAll();
            }}
            style={{ background: 'transparent', border: 'none', padding: '6px', color: '#188038', cursor: 'pointer', borderRadius: '4px' }}
            title="Accept All Suggestions"
          >
            <Check size={18} />
          </button>
          <button 
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (editor) editor.commands.rejectAll();
            }}
            style={{ background: 'transparent', border: 'none', padding: '6px', color: '#d93025', cursor: 'pointer', borderRadius: '4px' }}
            title="Reject All Suggestions"
          >
            <X size={18} />
          </button>

          <div style={{ width: '1px', background: 'rgba(0,0,0,0.1)', height: '24px', margin: '0 8px' }} />

          {/* Gemini Icon */}
          <button style={{ background: 'transparent', border: 'none', padding: '8px', color: '#1a73e8', cursor: 'pointer', borderRadius: '50%' }}>
            <Sparkles size={22} fill="#1a73e8" />
          </button>

          <div style={{ width: '1px', background: 'rgba(0,0,0,0.1)', height: '24px', margin: '0 8px' }} />

          {/* Active Users Avatars */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {activeUsers.map((u, i) => (
              <div key={u.id} style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 'bold', fontSize: '0.85rem',
                border: '2px solid #fff', marginLeft: i > 0 ? '-8px' : '0', zIndex: 10 - i
              }} title={u.name || 'Unknown'}>
                {u.name ? u.name.charAt(0) : '?'}
              </div>
            ))}
          </div>

          {/* Avatar with colorful ring */}
          <div style={{
            marginLeft: '4px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#a8c7fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#041e49',
            fontWeight: 'bold',
            border: '2px solid transparent',
            backgroundImage: 'linear-gradient(#f9fbfd, #f9fbfd), conic-gradient(from 0deg, #ea4335 0deg, #fbbc04 90deg, #34a853 180deg, #4285f4 270deg, #ea4335 360deg)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'content-box, border-box'
          }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </header>

      {/* Toolbar Area (Full Width) */}
      <Toolbar editor={editor} />

      {/* Editor Main Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left Sidebar (Document tabs) */}
        <div style={{
          width: '280px',
          background: '#f9fbfd',
          display: 'flex',
          flexDirection: 'column',
          padding: '12px 16px',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', color: '#444746', cursor: 'pointer' }}>
            <ArrowLeft size={18} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', color: '#1f1f1f', fontWeight: 500, fontSize: '0.85rem' }}>
            Document tabs
            <Plus size={18} style={{ cursor: 'pointer', color: '#444746' }} />
          </div>

          <div style={{
            background: '#c2e7ff',
            color: '#001d35',
            padding: '10px 12px',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} color="#0a57d0" /> Tab 1
            </div>
            <MoreVertical size={16} color="#001d35" style={{ cursor: 'pointer' }} />
          </div>

          <div style={{ color: '#444746', fontSize: '0.85rem', fontStyle: 'italic', lineHeight: '1.5' }}>
            Headings you add to the document will appear here.
          </div>
        </div>

        {/* Main Content Area (Ruler + Paper) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f9fbfd' }}>

          {/* Mock Ruler */}
          <div style={{
            height: '24px',
            background: '#f9fbfd',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            flexShrink: 0,
            zIndex: 10
          }}>
            <div style={{
              width: '816px',
              height: '100%',
              background: 'transparent',
              position: 'relative',
            }}>
              {/* Left blue triangle / marker */}
              <div style={{ position: 'absolute', left: '10%', top: '0', display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translateX(-50%)' }}>
                <div style={{ width: '8px', height: '4px', background: '#0a57d0' }} />
                <div style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '6px solid #0a57d0' }} />
              </div>
              {/* Right blue triangle / marker */}
              <div style={{ position: 'absolute', right: '10%', top: '0', display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translateX(50%)' }}>
                <div style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '6px solid #0a57d0' }} />
              </div>
            </div>
          </div>

          {/* Paper Container */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '0px 16px 80px 16px',
            background: '#f9fbfd',
            position: 'relative'
          }}>
            {/* A4 Paper Look */}
            <div className="editor-paper" style={{
              width: '100%',
              maxWidth: '816px',
              background: '#ffffff',
              minHeight: '1056px',
              padding: '96px',
              boxShadow: '0 1px 3px 1px rgba(60,64,67,0.15)',
              color: '#000000',
              fontFamily: 'Arial, sans-serif'
            }}>
              <EditorContent editor={editor} className="tiptap-editor" />
            </div>

            {/* Floating Gemini Prompt Bar */}
            <div style={{
              position: 'fixed',
              bottom: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              zIndex: 50
            }}>
              {/* Suggestion Chips */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {[{ icon: FileDown, text: 'Match doc format' }, { icon: LayoutTemplate, text: 'Templates' }, { icon: PenTool, text: 'Meeting notes' }, { icon: Mail, text: 'Email draft' }].map(chip => (
                  <button key={chip.text} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', background: '#f0f4f9', border: 'none',
                    borderRadius: '8px', color: '#444746', fontSize: '0.85rem', cursor: 'pointer'
                  }}>
                    <chip.icon size={14} /> {chip.text}
                  </button>
                ))}
                <button style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '6px 12px', background: '#f0f4f9', border: 'none',
                  borderRadius: '8px', color: '#444746', fontSize: '0.85rem', cursor: 'pointer'
                }}>
                  <Plus size={14} /> More
                </button>
              </div>

              {/* Input Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                borderRadius: '24px',
                padding: '8px 12px',
                width: '600px',
                border: '1px solid #e3e3e3'
              }}>
                <SparkleIcon size={20} color="#0a57d0" style={{ margin: '0 8px' }} />
                <input
                  type="text"
                  placeholder="Create an outline for..."
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.95rem', color: '#1f1f1f', padding: '4px 8px' }}
                />
                <button style={{ background: '#f0f4f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginLeft: '8px' }}>
                  <ArrowUp size={16} color="#444746" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        {activeSidebar && (
          <div style={{
            width: '300px',
            background: '#fff',
            borderLeft: '1px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            zIndex: 20
          }}>
            {/* Sidebar Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
              <span style={{ fontWeight: 500, color: '#1f1f1f', fontSize: '1rem' }}>
                {activeSidebar === 'history' ? 'Version history' : 'Comments'}
              </span>
              <button
                className="btn-ghost"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px', color: '#5f6368', borderRadius: '50%' }}
                onClick={() => setActiveSidebar(null)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Sidebar Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {activeSidebar === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {docData?.history?.length > 0 ? (
                    [...docData.history].reverse().map((entry, idx) => (
                      <div key={entry.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px', background: idx === 0 ? '#e8f0fe' : '#fff', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 500, fontSize: '0.9rem', color: '#1f1f1f' }}>{new Date(entry.createdAt).toLocaleString()}</span>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: '#5f6368' }}>{entry.user?.name}</span>
                        {idx !== 0 && (
                          <button style={{ alignSelf: 'flex-start', marginTop: '8px', background: 'transparent', border: 'none', color: '#0b57d0', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem', padding: 0 }}>
                            Restore this version
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#5f6368', fontSize: '0.9rem', textAlign: 'center', marginTop: '20px' }}>No history yet.</div>
                  )}
                </div>
              )}

              {activeSidebar === 'comments' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                    <textarea
                      placeholder="Add a comment..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', resize: 'none', minHeight: '60px', fontFamily: 'inherit', fontSize: '0.9rem' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button
                        onClick={async () => {
                          if (newCommentText.trim()) {
                            const newComment = await addComment(id, user?.name || 'Anonymous', newCommentText);
                            if (newComment) {
                              setDocData(prev => ({
                                ...prev,
                                comments: [newComment, ...(prev.comments || [])]
                              }));
                            }
                            setNewCommentText('');
                          }
                        }}
                        style={{ background: '#0b57d0', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '4px', fontWeight: 500, cursor: 'pointer', fontSize: '0.85rem' }}>
                        Comment
                      </button>
                    </div>
                  </div>

                  {docData?.comments?.length > 0 ? (
                    docData.comments.map(comment => (
                      <div key={comment.id} style={{ padding: '12px', border: '1px solid #e0e0e0', borderRadius: '8px', opacity: comment.resolved ? 0.6 : 1, position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 500, fontSize: '0.9rem', color: '#1f1f1f' }}>{comment.user.name}</span>
                          {!comment.resolved && (
                            <button
                              onClick={async () => {
                                const updatedComment = await resolveComment(id, comment.id);
                                if (updatedComment) {
                                  setDocData(prev => ({
                                    ...prev,
                                    comments: prev.comments.map(c => c.id === comment.id ? updatedComment : c)
                                  }));
                                }
                              }}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#5f6368' }}
                              title="Mark as resolved">
                              <Check size={16} />
                            </button>
                          )}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#3c4043', marginBottom: '8px' }}>{comment.text}</div>
                        <div style={{ fontSize: '0.75rem', color: '#5f6368' }}>{new Date(comment.createdAt).toLocaleDateString()}</div>
                        {comment.resolved && (
                          <div style={{ position: 'absolute', top: '12px', right: '12px', color: '#188038', fontSize: '0.75rem', fontWeight: 500 }}>Resolved</div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#5f6368', fontSize: '0.9rem', textAlign: 'center', marginTop: '20px' }}>No comments yet.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setIsShareModalOpen(false)}>
          <div style={{
            background: '#fff', borderRadius: '8px', width: '500px', padding: '24px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', color: '#1f1f1f' }}>Share "{docTitle}"</h2>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <input 
                type="email" 
                placeholder="Add people and groups" 
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                style={{
                  flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #dadce0', fontSize: '1rem'
                }} 
              />
              <select 
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                style={{
                  padding: '10px', borderRadius: '4px', border: '1px solid #dadce0', background: '#f8f9fa', fontSize: '0.9rem'
                }}
              >
                <option value="EDITOR">Editor</option>
                <option value="COMMENTER">Commenter</option>
                <option value="VIEWER">Viewer</option>
              </select>
              <button 
                onClick={handleInvite}
                disabled={!inviteEmail.trim()}
                style={{
                  background: inviteEmail.trim() ? '#1a73e8' : '#dadce0', 
                  border: 'none', 
                  borderRadius: '4px', 
                  padding: '0 16px', 
                  color: inviteEmail.trim() ? '#fff' : '#80868b', 
                  fontWeight: 500, 
                  cursor: inviteEmail.trim() ? 'pointer' : 'default'
                }}
              >
                Send
              </button>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1rem', color: '#1f1f1f', margin: '0 0 12px 0' }}>People with access</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#a8c7fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#041e49' }}>
                    {docData?.owner?.name?.charAt(0) || 'O'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, color: '#1f1f1f' }}>{docData?.owner?.name || 'Owner'} (you)</div>
                    <div style={{ fontSize: '0.85rem', color: '#5f6368' }}>{docData?.owner?.email || 'user@example.com'}</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.9rem', color: '#5f6368' }}>Owner</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button style={{
                background: 'transparent', border: '1px solid #dadce0', borderRadius: '24px', padding: '8px 16px', color: '#1a73e8', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <LinkIcon size={16} /> Copy link
              </button>
              <button style={{
                background: '#0b57d0', border: 'none', borderRadius: '24px', padding: '8px 24px', color: '#fff', fontWeight: 500, cursor: 'pointer'
              }} onClick={() => setIsShareModalOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
