import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Heading1, Heading2, Heading3, List, ListOrdered, Link as LinkIcon,
  Search, Undo, Redo, Printer, SpellCheck, ChevronDown, Minus, Plus,
  Type, PaintBucket, MessageSquare, Image as ImageIcon, CheckSquare,
  Indent, Outdent, RemoveFormatting, Pencil, ChevronUp
} from 'lucide-react';
import React from 'react';

const ToolbarButton = ({ onClick, isActive, disabled, children, tooltip, style = {} }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={tooltip}
    style={{
      padding: '4px 6px',
      background: isActive ? '#d3e3fd' : 'transparent',
      color: isActive ? '#041e49' : '#444746',
      border: 'none',
      borderRadius: '4px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...style
    }}
    onMouseEnter={(e) => {
      if (!disabled && !isActive) e.currentTarget.style.backgroundColor = '#e1e5ea';
    }}
    onMouseLeave={(e) => {
      if (!disabled && !isActive) e.currentTarget.style.backgroundColor = 'transparent';
    }}
  >
    {children}
  </button>
);

const Divider = () => (
  <div style={{ width: '1px', height: '20px', background: '#c7c7c7', margin: '0 4px' }} />
);

const DropdownLabel = ({ text }) => (
  <button style={{
    display: 'flex', alignItems: 'center', gap: '4px',
    background: 'transparent', border: 'none',
    color: '#444746', cursor: 'pointer', padding: '4px 6px', borderRadius: '4px',
    fontSize: '0.85rem'
  }}
    onMouseEnter={(e) => e.currentTarget.style.background = '#e1e5ea'}
    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
  >
    {text} <ChevronDown size={14} />
  </button>
);

const Toolbar = ({ editor }) => {
  if (!editor) return null;

  return (
    <div style={{ padding: '0 16px 10px 16px', background: '#f9fbfd', borderBottom: '1px solid #e3e3e3' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        padding: '6px 16px',
        background: '#edf2fa',
        borderRadius: '24px',
        flexWrap: 'wrap',
        zIndex: 9
      }}>

        {/* Search & Actions */}
        <ToolbarButton tooltip="Search"><Search size={16} /></ToolbarButton>
        <ToolbarButton tooltip="Undo"><Undo size={16} /></ToolbarButton>
        <ToolbarButton tooltip="Redo"><Redo size={16} /></ToolbarButton>
        <ToolbarButton tooltip="Print"><Printer size={16} /></ToolbarButton>
        <ToolbarButton tooltip="Spelling and grammar check"><SpellCheck size={16} /></ToolbarButton>

        <Divider />

        {/* Zoom */}
        <DropdownLabel text="100%" />

        <Divider />

        {/* Styles */}
        <DropdownLabel text="Normal text" />

        <Divider />

        {/* Font */}
        <DropdownLabel text="Arial" />

        <Divider />

        {/* Font Size */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ToolbarButton tooltip="Decrease font size"><Minus size={14} /></ToolbarButton>
          <div style={{ padding: '0 8px', fontSize: '0.85rem', color: '#1f1f1f', border: '1px solid #747775', borderRadius: '4px', margin: '0 4px', height: '24px', display: 'flex', alignItems: 'center' }}>11</div>
          <ToolbarButton tooltip="Increase font size"><Plus size={14} /></ToolbarButton>
        </div>

        <Divider />

        {/* Basic Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          tooltip="Bold"
        >
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          tooltip="Italic"
        >
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          tooltip="Underline"
        >
          <Underline size={16} />
        </ToolbarButton>
        <ToolbarButton tooltip="Text color">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <Type size={16} style={{ color: '#444746' }} />
            <div style={{ width: '12px', height: '3px', background: '#000' }} />
          </div>
        </ToolbarButton>
        <ToolbarButton tooltip="Highlight color">
          <PaintBucket size={16} />
        </ToolbarButton>

        <Divider />

        {/* Insert */}
        <ToolbarButton tooltip="Insert link"><LinkIcon size={16} /></ToolbarButton>
        <ToolbarButton tooltip="Add comment"><MessageSquare size={16} /></ToolbarButton>
        <ToolbarButton tooltip="Insert image"><ImageIcon size={16} /></ToolbarButton>

        <Divider />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          tooltip="Align left"
        >
          <AlignLeft size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          tooltip="Align center"
        >
          <AlignCenter size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          tooltip="Align right"
        >
          <AlignRight size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          tooltip="Justify"
        >
          <AlignJustify size={16} />
        </ToolbarButton>

        <Divider />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          tooltip="Bulleted list"
        >
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          tooltip="Numbered list"
        >
          <ListOrdered size={16} />
        </ToolbarButton>

        <ToolbarButton tooltip="Checklist"><CheckSquare size={16} /></ToolbarButton>

        <ToolbarButton tooltip="Decrease indent"><Outdent size={16} /></ToolbarButton>
        <ToolbarButton tooltip="Increase indent"><Indent size={16} /></ToolbarButton>
        <ToolbarButton tooltip="Clear formatting"><RemoveFormatting size={16} /></ToolbarButton>

        <div style={{ flex: 1 }}></div>

        {/* Right Tools */}
        <DropdownLabel text={<span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Pencil size={14} /> Editing</span>} />
        <Divider />
        <ToolbarButton tooltip="Hide the menus"><ChevronUp size={16} /></ToolbarButton>
      </div>
    </div>
  );
};

export default Toolbar;
