import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Collaboration from '@tiptap/extension-collaboration';
import Link from '@tiptap/extension-link';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from 'y-indexeddb';
import { useAuthStore } from '../store/authStore';
import { useDocumentStore } from '../store/documentStore';
import Toolbar from '../components/Toolbar';
import { ArrowLeft, Share, Save, Users, History, MessageSquare, Star, Folder, Cloud, FileText, Lock, Video, Sparkles, ChevronDown, Plus, MoreVertical, FileDown, LayoutTemplate, PenTool, Mail, Sparkles as SparkleIcon, ArrowUp } from 'lucide-react';

const colors = ['#958DF1', '#F98181', '#FBBC88', '#FAF594', '#70CFF8', '#94FDFB', '#BFDF8A'];
const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const { documents, renameDocument, updateTimestamp } = useDocumentStore();
  const doc = documents.find(d => d.id === id);

  const [status, setStatus] = useState('connecting');
  const [docTitle, setDocTitle] = useState(doc?.title || 'Untitled document');

  const [ydoc] = useState(() => new Y.Doc());
  const [provider] = useState(() => new WebrtcProvider(
    `syncwrite-document-${id}`,
    ydoc,
    { signaling: ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com'] }
  ));

  useEffect(() => {
    if (!doc) {
      navigate('/dashboard');
      return;
    }

    // Persist document offline
    const persistence = new IndexeddbPersistence(`document-${id}`, ydoc);
    persistence.on('synced', () => {
      console.log('Document synced with IndexedDB');
    });

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
  }, [id, doc, navigate, updateTimestamp, ydoc, provider]);

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
    ],
    content: `
      <h1>Welcome to SyncWrite Collaborative Editor</h1>
      <p>This is a real-time collaborative document editor. Try opening this URL in another tab!</p>
    `,
  });

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

          <button style={{ background: 'transparent', border: 'none', padding: '8px', color: '#444746', cursor: 'pointer', borderRadius: '50%' }} title="Version History">
            <History size={22} />
          </button>
          <button style={{ background: 'transparent', border: 'none', padding: '8px', color: '#444746', cursor: 'pointer', borderRadius: '50%' }} title="Comments">
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
              onClick={() => {
                const email = prompt('Enter email to invite:', '');
                if (email) alert(`Invitation sent to ${email} (Mock)`);
              }}
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

          {/* Gemini Icon */}
          <button style={{ background: 'transparent', border: 'none', padding: '8px', color: '#1a73e8', cursor: 'pointer', borderRadius: '50%' }}>
            <Sparkles size={22} fill="#1a73e8" />
          </button>

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
              background: '#ffffff',
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

              {/* Tick marks */}
              <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 40px' }}>
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <div key={num} style={{ position: 'relative', height: '10px', width: '1px', background: '#c7c7c7' }}>
                    <span style={{ position: 'absolute', top: '-14px', left: '-4px', fontSize: '10px', color: '#747775', fontFamily: 'Arial' }}>{num}</span>
                    <div style={{ position: 'absolute', left: '-20px', bottom: '0', height: '6px', width: '1px', background: '#e3e3e3' }} />
                    <div style={{ position: 'absolute', left: '20px', bottom: '0', height: '6px', width: '1px', background: '#e3e3e3' }} />
                  </div>
                ))}
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
      </div>
    </div>
  );
};

export default Editor;
