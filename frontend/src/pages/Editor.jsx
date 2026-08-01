import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Link from '@tiptap/extension-link';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from 'y-indexeddb';
import { useAuthStore } from '../store/authStore';
import { useDocumentStore } from '../store/documentStore';
import Toolbar from '../components/Toolbar';
import { ArrowLeft, Share, Save, Users, History, MessageSquare } from 'lucide-react';

const colors = ['#958DF1', '#F98181', '#FBBC88', '#FAF594', '#70CFF8', '#94FDFB', '#BFDF8A'];
const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const { documents, renameDocument, updateTimestamp } = useDocumentStore();
  const doc = documents.find(d => d.id === id);
  
  const [status, setStatus] = useState('connecting');
  const [docTitle, setDocTitle] = useState(doc?.title || 'Untitled Document');
  
  const ydocRef = useRef(null);
  const providerRef = useRef(null);

  useEffect(() => {
    if (!doc) {
      navigate('/dashboard');
      return;
    }

    // Initialize Yjs document
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Persist document offline
    const persistence = new IndexeddbPersistence(`document-${id}`, ydoc);
    persistence.on('synced', () => {
      console.log('Document synced with IndexedDB');
    });

    // Connect to WebRTC for peer-to-peer collaboration
    const provider = new WebrtcProvider(
      `syncwrite-document-${id}`,
      ydoc,
      { signaling: ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com'] }
    );
    providerRef.current = provider;

    provider.on('synced', synced => {
      setStatus(synced ? 'connected' : 'connecting');
    });

    // Auto update timestamp on changes
    ydoc.on('update', () => {
      updateTimestamp(id);
    });

    return () => {
      provider.destroy();
      persistence.destroy();
      ydoc.destroy();
    };
  }, [id, doc, navigate, updateTimestamp]);

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
        document: ydocRef.current,
      }),
      CollaborationCursor.configure({
        provider: providerRef.current,
        user: {
          name: user?.name || 'Anonymous',
          color: getRandomColor(),
        },
      }),
    ],
    content: `
      <h1>Welcome to SyncWrite Collaborative Editor</h1>
      <p>This is a real-time collaborative document editor. Try opening this URL in another tab!</p>
    `,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Editor Header */}
      <header className="flex-between glass-panel" style={{ 
        padding: '12px 24px', 
        borderRadius: 0, 
        borderLeft: 'none', 
        borderRight: 'none', 
        borderTop: 'none',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn-ghost" onClick={() => navigate('/dashboard')} title="Back to Dashboard">
            <ArrowLeft size={20} />
          </button>
          
          <input 
            type="text" 
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            onBlur={(e) => {
              renameDocument(id, e.target.value);
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
            style={{ 
              background: 'transparent', 
              border: '1px solid transparent', 
              color: 'var(--text-primary)', 
              fontSize: '1.25rem', 
              fontWeight: 600,
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              outline: 'none',
              fontFamily: 'Outfit, sans-serif'
            }}
            onFocus={(e) => {
              e.currentTarget.style.background = 'var(--bg-secondary)';
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          />
          
          {/* Status Indicator */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            fontSize: '0.8rem',
            color: status === 'connected' ? 'var(--success)' : 'var(--warning)',
            background: status === 'connected' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            padding: '4px 10px',
            borderRadius: '20px'
          }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: status === 'connected' ? 'var(--success)' : 'var(--warning)' 
            }} />
            {status === 'connected' ? 'Saved (Real-time)' : 'Offline (Local)'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Connected Users avatars would go here */}
          <div style={{ display: 'flex', marginRight: '16px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-primary)', border: '2px solid var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
              {user?.name?.charAt(0)}
            </div>
          </div>

          <button className="btn-ghost" title="Version History" onClick={() => alert('Version History sidebar opened (Mock)')}>
            <History size={18} />
          </button>
          <button className="btn-ghost" title="Comments" onClick={() => alert('Comments sidebar opened (Mock)')}>
            <MessageSquare size={18} />
          </button>
          <button className="btn btn-secondary" onClick={() => {
            const email = prompt('Enter email to invite:', '');
            if (email) alert(`Invitation sent to ${email} (Mock)`);
          }}>
            <Share size={16} />
            Share
          </button>
        </div>
      </header>

      {/* Editor Main Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Toolbar editor={editor} />
        
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          display: 'flex', 
          justifyContent: 'center',
          padding: '2rem 1rem' 
        }}>
          {/* A4 Paper Look */}
          <div className="editor-paper" style={{
            width: '100%',
            maxWidth: '850px',
            background: 'var(--bg-secondary)',
            minHeight: '1056px', // 8.5 x 11 ratio
            padding: '4rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)'
          }}>
            <EditorContent editor={editor} className="tiptap-editor" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
