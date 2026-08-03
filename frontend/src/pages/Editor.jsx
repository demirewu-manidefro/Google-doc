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
import { io } from 'socket.io-client';
import { api } from '../api';
import { useAuthStore } from '../store/authStore';
import { useDocumentStore } from '../store/documentStore';
import Toolbar from '../components/Toolbar';
import { ArrowLeft, Share, Save, Users, History, MessageSquare, Star, Folder, Cloud, FileText, Lock, Video, Sparkles, ChevronDown, ChevronRight, Plus, MoreVertical, FileDown, LayoutTemplate, PenTool, Mail, Sparkles as SparkleIcon, ArrowUp, Link as LinkIcon, X, Check, Trash2, Send, Printer, Undo, Redo, Minus } from 'lucide-react';

const colors = ['#958DF1', '#F98181', '#FBBC88', '#FAF594', '#70CFF8', '#94FDFB', '#BFDF8A'];
const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];


import { Extension } from '@tiptap/core';
import { PaginationPlus } from 'tiptap-pagination-plus';

// Extension to fix backspace not bringing text up in Suggesting Mode
const BackspaceJoinFix = Extension.create({
  name: 'backspaceJoinFix',
  priority: 1000,
  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        if (!selection.empty) return false;
        
        const { $from } = selection;
        
        if ($from.parentOffset === 0) {
           const currentMode = editor.extensionManager.extensions.find(e => e.name === 'trackChanges')?.options?.mode || 'suggest';
           
           try {
             editor.commands.setTrackChangesMode('edit');
             const handled = editor.commands.joinBackward();
             editor.commands.setTrackChangesMode(currentMode);
             
             if (handled) return true;
           } catch(e) {
             editor.commands.setTrackChangesMode(currentMode);
           }
        }
        return false;
      },
    };
  },
});

const MenuItem = ({ item, setActiveMenu }) => {
  const [showSub, setShowSub] = useState(false);
  return (
    <div
      onClick={() => { if (!item.subItems) { item.action(); setActiveMenu(null); } }}
      style={{
        padding: '6px 16px', fontSize: '0.85rem', color: '#1f1f1f',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative'
      }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f3f4'; setShowSub(true); }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; setShowSub(false); }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {item.icon && <item.icon size={14} color="#5f6368" />}
        {item.label}
      </div>
      {item.subItems && <ChevronRight size={14} color="#5f6368" />}
      {item.subItems && showSub && (
        <div style={{
          position: 'absolute', top: 0, left: '100%',
          background: '#fff', border: '1px solid #ccc', borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)', padding: '4px 0', zIndex: 101,
          minWidth: '220px'
        }}>
          {item.subItems.map((sub, idx) => (
             <div
               key={idx}
               onClick={(e) => { e.stopPropagation(); sub.action(); setActiveMenu(null); setShowSub(false); }}
               style={{ padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
               onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f3f4'}
               onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
             >
               {sub.icon && <sub.icon size={14} color="#5f6368" />}
               {sub.label}
             </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MenuDropdown = ({ label, items, activeMenu, setActiveMenu }) => {
  const isOpen = activeMenu === label;
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, setActiveMenu]);

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setActiveMenu(isOpen ? null : label)}
        style={{
          padding: '2px 7px',
          borderRadius: '4px',
          color: '#1f1f1f',
          background: isOpen ? '#e8eaed' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.875rem'
        }}
        onMouseEnter={(e) => { if(!isOpen) e.currentTarget.style.backgroundColor = '#e8eaed' }}
        onMouseLeave={(e) => { if(!isOpen) e.currentTarget.style.backgroundColor = 'transparent' }}
      >
        {label}
      </button>
      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: '2px',
          background: '#fff', border: '1px solid #ccc', borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)', padding: '4px 0', zIndex: 100,
          minWidth: '150px'
        }}>
          {items.map((item, idx) => (
            item.divider ? (
              <div key={idx} style={{ height: '1px', background: '#e0e0e0', margin: '4px 0' }} />
            ) : (
              <MenuItem key={idx} item={item} setActiveMenu={setActiveMenu} />
            )
          ))}
        </div>
      )}
    </div>
  );
};

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
  const [zoomLevel, setZoomLevel] = useState(1);
  const [headings, setHeadings] = useState([]);
  const [hasUnreadComments, setHasUnreadComments] = useState(false);
  const [activeTabId, setActiveTabId] = useState('default');
  const [tabs, setTabs] = useState([]);
  const [activeMenu, setActiveMenu] = useState(null);
  
  const activeSidebarRef = useRef(activeSidebar);
  useEffect(() => { activeSidebarRef.current = activeSidebar; }, [activeSidebar]);
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

    // Document Tabs Sync
    const tabsMap = ydoc.getMap('documentTabs');
    const updateTabs = () => {
      const currentTabs = Array.from(tabsMap.values());
      if (currentTabs.length === 0) {
        const defaultTab = { id: 'default', name: 'Tab 1', order: 0 };
        tabsMap.set('default', defaultTab);
        setTabs([defaultTab]);
      } else {
        setTabs(currentTabs.sort((a, b) => a.order - b.order));
      }
    };
    tabsMap.observe(updateTabs);
    updateTabs();


    // Real-time comments with Socket.IO
    const socket = io('http://localhost:3001');
    socket.emit('join_document', id);
    
    socket.on('comment_added', (newComment) => {
      setDocData(prev => {
        if (!prev) return prev;
        // avoid duplicating if I am the one who added it (it's added eagerly)
        if (prev.comments?.some(c => c.id === newComment.id)) return prev;
        return { ...prev, comments: [newComment, ...(prev.comments || [])] };
      });
      if (activeSidebarRef.current !== 'comments') {
        setHasUnreadComments(true);
      }
    });
    
    socket.on('comment_resolved', (resolvedComment) => {
      setDocData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: prev.comments.map(c => c.id === resolvedComment.id ? resolvedComment : c)
        };
      });
    });

    socket.on('comment_deleted', (deletedCommentId) => {
      setDocData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: prev.comments.filter(c => c.id !== deletedCommentId)
        };
      });
    });

    return () => {
      provider.destroy();
      ydoc.destroy();
      socket.disconnect();
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
        field: activeTabId,
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
      BackspaceJoinFix,
      PaginationPlus.configure({
        pageHeight: 1056,
        pageWidth: 816,
        marginTop: 96,
        marginBottom: 96,
        marginLeft: 96,
        marginRight: 96,
        contentMarginTop: 0,
        contentMarginBottom: 0,
        pageGap: 24,
        pageGapBorderSize: 1,
        pageGapBorderColor: '#e5e7eb',
      }),
      TextStyle,
      FontFamily,
    ],
    onUpdate: ({ editor }) => {
      const newHeadings = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          newHeadings.push({
            level: node.attrs.level,
            text: node.textContent,
            pos
          });
        }
      });
      setHeadings(newHeadings);
    },
  }, [activeTabId, ydoc, provider, user?.name, user?.id]); // Re-initialize editor when tab changes

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f1f3f4', fontFamily: '"Google Sans", Roboto, Arial, sans-serif' }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '8px 16px',
        background: '#f1f3f4',
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
                id="doc-title-input"
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
            </div>

            {/* Menu Row */}
            <div style={{ display: 'flex', gap: '2px', fontSize: '0.875rem', color: '#1f1f1f', marginLeft: '2px' }}>
              <MenuDropdown 
                label="File" 
                activeMenu={activeMenu} setActiveMenu={setActiveMenu}
                items={[
                  { label: 'New', icon: FileText, action: async () => {
                     try {
                       const res = await api.post('/documents', { title: 'Untitled Document' });
                       navigate('/editor/' + res.id);
                     } catch(e) { alert('Failed to create new document'); }
                  }},
                  { label: 'Open', icon: Folder, action: () => navigate('/dashboard') },
                  { label: 'Make a copy', icon: FileText, action: async () => {
                     try {
                       const res = await api.post(`/documents/${id}/duplicate`);
                       navigate('/editor/' + res.id);
                     } catch(e) { alert('Failed to duplicate document'); }
                  }},
                  { divider: true },
                  { label: 'Share', icon: Share, action: () => setIsShareModalOpen(true) },
                  { label: 'Email', icon: Mail, action: () => {
                      window.location.href = `mailto:?subject=${encodeURIComponent(docTitle)}&body=${encodeURIComponent('Check out this document: ' + window.location.href)}`;
                  }},
                  { 
                    label: 'Download', 
                    icon: FileDown, 
                    subItems: [
                      { label: 'Microsoft Word (.docx)', icon: FileText, action: () => {
                          if (!editor) return;
                          const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Document</title></head><body>";
                          const footer = "</body></html>";
                          const sourceHTML = header + editor.getHTML() + footer;
                          const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
                          const fileDownload = document.createElement("a");
                          document.body.appendChild(fileDownload);
                          fileDownload.href = source;
                          fileDownload.download = `${docTitle}.docx`;
                          fileDownload.click();
                          document.body.removeChild(fileDownload);
                      }},
                      { label: 'PDF Document (.pdf)', icon: FileText, action: () => {
                          window.print();
                      }}
                    ]
                  },
                  { divider: true },
                  { label: 'Rename', icon: PenTool, action: () => {
                      document.getElementById('doc-title-input')?.focus();
                  }},
                  { label: 'Move', icon: Folder, action: () => alert('Moved to folder!') },
                  { label: 'Add shortcut to Drive', icon: Folder, action: () => alert('Shortcut added to Drive!') },
                  { label: 'Move to trash', icon: Trash2, action: async () => {
                      if (window.confirm('Are you sure you want to move this to trash?')) {
                         try {
                           await api.delete(`/documents/${id}`);
                           navigate('/dashboard');
                         } catch(e) { alert('Failed to delete document'); }
                      }
                  }}
                ]}
              />
              <MenuDropdown 
                label="Edit" 
                activeMenu={activeMenu} setActiveMenu={setActiveMenu}
                items={[
                  { label: 'Undo', icon: Undo, action: () => editor?.chain().focus().undo().run() },
                  { label: 'Redo', icon: Redo, action: () => editor?.chain().focus().redo().run() },
                ]}
              />
              <MenuDropdown 
                label="View" 
                activeMenu={activeMenu} setActiveMenu={setActiveMenu}
                items={[
                  { label: 'Editing mode', icon: PenTool, action: () => setIsSuggestingMode(false) },
                  { label: 'Suggesting mode', icon: MessageSquare, action: () => setIsSuggestingMode(true) },
                ]}
              />
              <MenuDropdown 
                label="Insert" 
                activeMenu={activeMenu} setActiveMenu={setActiveMenu}
                items={[
                  { label: 'Horizontal Line', icon: Minus, action: () => editor?.chain().focus().setHorizontalRule().run() }
                ]}
              />
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
            style={{ background: activeSidebar === 'comments' ? '#e8eaed' : 'transparent', border: 'none', padding: '8px', color: '#444746', cursor: 'pointer', borderRadius: '50%', position: 'relative' }}
            title="Comments"
            onClick={() => {
              setActiveSidebar(activeSidebar === 'comments' ? null : 'comments');
              setHasUnreadComments(false);
            }}
          >
            <MessageSquare size={22} />
            {hasUnreadComments && <div style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, backgroundColor: '#ea4335', borderRadius: '50%' }} />}
          </button>

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
            backgroundImage: 'linear-gradient(#f1f3f4, #f1f3f4), conic-gradient(from 0deg, #ea4335 0deg, #fbbc04 90deg, #34a853 180deg, #4285f4 270deg, #ea4335 360deg)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'content-box, border-box'
          }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </header>

      {/* Toolbar Area (Full Width) */}
      <Toolbar editor={editor} zoomLevel={zoomLevel} setZoomLevel={setZoomLevel} />

      {/* Editor Main Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left Sidebar (Document tabs) */}
        <div style={{
          width: '280px',
          background: '#f1f3f4',
          display: 'flex',
          flexDirection: 'column',
          padding: '12px 16px',
          flexShrink: 0
        }}>
          {/* Document Tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', color: '#1f1f1f', fontWeight: 500, fontSize: '0.85rem' }}>
            Document tabs
            <Plus size={18} style={{ cursor: 'pointer', color: '#444746' }} onClick={() => {
               const newId = 'tab-' + Date.now();
               const newOrder = tabs.length;
               ydoc.getMap('documentTabs').set(newId, { id: newId, name: `Tab ${tabs.length + 1}`, order: newOrder });
               setActiveTabId(newId);
            }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '24px' }}>
            {tabs.map(tab => (
              <div 
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  background: activeTabId === tab.id ? '#c2e7ff' : 'transparent',
                  color: activeTabId === tab.id ? '#001d35' : '#444746',
                  fontSize: '0.85rem',
                  fontWeight: activeTabId === tab.id ? 500 : 400,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FileText size={16} color={activeTabId === tab.id ? "#0a57d0" : "#444746"} />
                {tab.name}
              </div>
            ))}
          </div>

          {/* Outline Header */}
          <div style={{
            color: '#001d35',
            padding: '10px 12px',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.875rem',
            fontWeight: 500,
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} color="#0a57d0" /> Outline
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '8px' }}>
            {headings.length > 0 ? (
              headings.map((h, i) => (
                <div 
                  key={i}
                  onClick={() => {
                    if (editor) {
                      editor.commands.setTextSelection(h.pos);
                      editor.commands.scrollIntoView();
                    }
                  }}
                  style={{
                    paddingLeft: `${(h.level - 1) * 12}px`,
                    fontSize: '0.85rem',
                    color: '#444746',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: '1.5'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#0b57d0'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#444746'}
                  title={h.text}
                >
                  {h.text || 'Untitled'}
                </div>
              ))
            ) : (
              <div style={{ color: '#444746', fontSize: '0.85rem', fontStyle: 'italic', lineHeight: '1.5' }}>
                Headings you add to the document will appear here.
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area (Ruler + Paper) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f1f3f4' }}>

          {/* Mock Ruler */}
          <div style={{
            height: '24px',
            background: '#f1f3f4',
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
            background: '#f1f3f4',
            position: 'relative'
          }}>
            <div style={{ zoom: zoomLevel, transition: 'zoom 0.2s', width: '816px', minHeight: '1056px', marginBottom: '400px' }}>
              <EditorContent editor={editor} className="tiptap-editor" />
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
            {activeSidebar === 'history' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
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
              </div>
            )}

            {activeSidebar === 'comments' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Chat Messages Area */}
                <div style={{ 
                  flex: 1, 
                  overflowY: 'auto', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px', 
                  padding: '16px', 
                  backgroundColor: '#e5ddd5', 
                  backgroundImage: 'url("https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png")',
                  backgroundSize: '400px',
                  backgroundBlendMode: 'overlay'
                }}>
                  {docData?.comments?.length > 0 ? (
                    [...docData.comments].reverse().map((comment, idx, arr) => {
                      const isMe = user?.name === comment.user.name;
                      return (
                        <div key={comment.id} 
                          ref={el => { if (idx === arr.length - 1 && el) el.scrollIntoView(); }}
                          style={{
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '85%',
                          backgroundColor: isMe ? '#dcf8c6' : '#ffffff',
                          borderRadius: '8px',
                          borderTopRightRadius: isMe ? 0 : '8px',
                          borderTopLeftRadius: isMe ? '8px' : 0,
                          padding: '6px 8px',
                          boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
                          position: 'relative',
                          opacity: comment.resolved ? 0.6 : 1,
                          display: 'flex',
                          flexDirection: 'column'
                        }}>
                          {!isMe && (
                            <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#00a884', marginBottom: '2px' }}>
                              {comment.user.name}
                            </div>
                          )}
                          <div style={{ fontSize: '0.85rem', color: '#111b21', marginBottom: '4px', paddingRight: '40px', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                            {comment.text}
                          </div>
                          
                          <div style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: '#667781', marginTop: '-12px', marginRight: '-2px' }}>
                            {comment.resolved && <span style={{ color: '#188038', fontWeight: 600 }}>Resolved</span>}
                            <span>{new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
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
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: '#667781' }}
                                title="Mark as resolved">
                                <Check size={12} />
                              </button>
                            )}
                            {(isMe || user?.id === docData.ownerId) && (
                              <button
                                onClick={async () => {
                                  const success = await useDocumentStore.getState().deleteComment(id, comment.id);
                                  if (success) {
                                    setDocData(prev => ({
                                      ...prev,
                                      comments: prev.comments.filter(c => c.id !== comment.id)
                                    }));
                                  }
                                }}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: '#ea4335' }}
                                title="Delete comment">
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ color: '#5f6368', fontSize: '0.85rem', textAlign: 'center', marginTop: '20px', background: 'rgba(255,255,255,0.9)', padding: '6px 12px', borderRadius: '16px', alignSelf: 'center', boxShadow: '0 1px 1px rgba(0,0,0,0.05)' }}>No comments yet.</div>
                  )}
                </div>
                
                {/* Chat Input */}
                <div style={{ padding: '10px 12px', background: '#f0f0f0', display: 'flex', gap: '8px', alignItems: 'flex-end', borderTop: '1px solid #d1d7db' }}>
                  <textarea
                    placeholder="Type a message..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (newCommentText.trim()) {
                          const textToSend = newCommentText;
                          setNewCommentText(''); // clear immediately for better UX
                          await addComment(id, user?.name || 'Anonymous', textToSend);
                          // State update is handled by the Socket.IO 'comment_added' listener
                        }
                      }
                    }}
                    style={{ flex: 1, border: 'none', background: '#fff', outline: 'none', resize: 'none', minHeight: '40px', maxHeight: '120px', borderRadius: '20px', padding: '10px 16px', fontFamily: 'inherit', fontSize: '0.9rem', boxShadow: '0 1px 1px rgba(0,0,0,0.05)' }}
                  />
                  <button
                    onClick={async () => {
                      if (newCommentText.trim()) {
                        const textToSend = newCommentText;
                        setNewCommentText('');
                        await addComment(id, user?.name || 'Anonymous', textToSend);
                        // State update is handled by the Socket.IO 'comment_added' listener
                      }
                    }}
                    style={{ background: '#00a884', color: '#fff', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, boxShadow: '0 1px 1px rgba(0,0,0,0.1)' }}>
                    <Send size={18} style={{ transform: 'translateX(-1px)' }} />
                  </button>
                </div>
              </div>
            )}
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
              
              {docData?.collaborators?.map(collab => (
                <div key={collab.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e1e5ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#444746' }}>
                      {collab.user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, color: '#1f1f1f', display: 'flex', alignItems: 'center' }}>
                        {collab.user?.name}
                        {collab.status === 'PENDING' && <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#d93025', background: '#fce8e6', padding: '2px 6px', borderRadius: '4px' }}>Pending</span>}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#5f6368' }}>{collab.user?.email}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.9rem', color: '#5f6368', textTransform: 'capitalize' }}>{collab.role.toLowerCase()}</span>
                </div>
              ))}
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
