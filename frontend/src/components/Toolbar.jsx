import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Heading1, Heading2, Heading3, List, ListOrdered, Link as LinkIcon,
  Search, Undo, Redo, Printer, SpellCheck, ChevronDown, Minus, Plus,
  Type, PaintBucket, MessageSquare, Image as ImageIcon, CheckSquare,
  Indent, Outdent, RemoveFormatting, Pencil, ChevronUp, Check, ChevronRight
} from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

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

const CustomDropdown = ({ value, options, onChange, renderValue, width = 140 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setActiveSubmenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: isOpen ? '#e8eaed' : 'transparent', border: 'none',
          color: '#444746', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px',
          fontSize: '0.85rem', width: `${width}px`, fontFamily: 'inherit'
        }}
        onMouseEnter={(e) => { if (!isOpen) e.currentTarget.style.backgroundColor = '#e1e5ea' }}
        onMouseLeave={(e) => { if (!isOpen) e.currentTarget.style.backgroundColor = 'transparent' }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {renderValue ? renderValue(value) : options.find(o => o.value === value)?.label}
        </span>
        <ChevronDown size={14} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: '4px',
          background: '#ffffff', borderRadius: '4px', boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          zIndex: 100, minWidth: '200px', padding: '6px 0', display: 'flex', flexDirection: 'column'
        }}>
          {options.map((opt, i) => (
            <React.Fragment key={opt.value}>
              <div 
                style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}
                onMouseEnter={() => setActiveSubmenu(opt.hasSub ? opt.value : null)}
                onMouseLeave={() => setActiveSubmenu(null)}
              >
                <button
                  onClick={() => {
                    if (!opt.isOptions) {
                      onChange(opt.value);
                      setIsOpen(false);
                      setActiveSubmenu(null);
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '8px 16px',
                    background: value === opt.value ? '#e8f0fe' : 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    fontFamily: opt.fontFamily || 'inherit',
                    fontSize: opt.fontSize || '0.9rem',
                    color: '#202124'
                  }}
                  onMouseEnter={(e) => { if (value !== opt.value) e.currentTarget.style.backgroundColor = '#f1f3f4' }}
                  onMouseLeave={(e) => { if (value !== opt.value) e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <div style={{ width: '24px', display: 'flex', alignItems: 'center' }}>
                    {value === opt.value && <Check size={16} />}
                  </div>
                  <span style={{ flex: 1 }}>{opt.label}</span>
                  {opt.hasSub && <ChevronRight size={14} style={{ color: '#5f6368' }} />}
                </button>
                
                {activeSubmenu === opt.value && opt.subOptions && (
                  <div style={{
                    position: 'absolute', top: '-6px', left: '100%',
                    background: '#ffffff', borderRadius: '4px', boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    zIndex: 101, minWidth: '220px', padding: '6px 0', display: 'flex', flexDirection: 'column'
                  }}>
                    {opt.subOptions.map(subOpt => (
                      <button
                        key={subOpt.value}
                        onClick={() => {
                          if (subOpt.onClick) subOpt.onClick();
                          setIsOpen(false);
                          setActiveSubmenu(null);
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', padding: '8px 16px',
                          background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                          fontFamily: 'inherit', fontSize: '0.9rem', color: '#202124'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f3f4'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {subOpt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {opt.divider && <div style={{ height: '1px', background: '#e0e0e0', margin: '4px 0' }} />}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

const HeadingSelect = ({ editor }) => {
  const getValue = () => {
    if (editor.isActive('heading', { level: 1 })) return 'h1';
    if (editor.isActive('heading', { level: 2 })) return 'h2';
    if (editor.isActive('heading', { level: 3 })) return 'h3';
    if (editor.isActive('heading', { level: 4 })) return 'h4';
    if (editor.isActive('heading', { level: 5 })) return 'h5';
    return 'p';
  };

  const handleChange = (val) => {
    if (val === 'p') editor.chain().focus().setParagraph().run();
    if (val === 'h1') editor.chain().focus().setHeading({ level: 1 }).run();
    if (val === 'h2') editor.chain().focus().setHeading({ level: 2 }).run();
    if (val === 'h3') editor.chain().focus().setHeading({ level: 3 }).run();
    if (val === 'h4') editor.chain().focus().setHeading({ level: 4 }).run();
    if (val === 'h5') editor.chain().focus().setHeading({ level: 5 }).run();
  };

  const options = [
    { value: 'p', label: 'Normal text', fontSize: '1rem' },
    { divider: true, value: 'div1' },
    { value: 'h1', label: 'Title', fontSize: '1.6rem', fontFamily: 'Outfit, sans-serif' },
    { value: 'h2', label: 'Subtitle', fontSize: '1.3rem', color: '#5f6368' },
    { value: 'h3', label: 'Heading 1', fontSize: '1.2rem', fontFamily: 'Outfit, sans-serif' },
    { value: 'h4', label: 'Heading 2', fontSize: '1.1rem', fontFamily: 'Outfit, sans-serif' },
    { value: 'h5', label: 'Heading 3', fontSize: '1rem', fontFamily: 'Outfit, sans-serif' },
    { divider: true, value: 'div2' },
    { value: 'options', label: 'Options', hasSub: true, isOptions: true, subOptions: [
      { value: 'save_default', label: 'Save as my default styles', onClick: () => alert('Styles saved successfully!') },
      { value: 'use_default', label: 'Use my default styles', onClick: () => alert('Default styles applied!') }
    ]}
  ];

  return (
    <CustomDropdown 
      value={getValue()} 
      options={options} 
      onChange={handleChange} 
      width={120} 
      renderValue={(val) => {
        if (val === 'p') return 'Normal text';
        if (val === 'h1') return 'Title';
        if (val === 'h2') return 'Subtitle';
        if (val === 'h3') return 'Heading 1';
        if (val === 'h4') return 'Heading 2';
        if (val === 'h5') return 'Heading 3';
        return 'Normal text';
      }}
    />
  );
};

const FontSelect = ({ editor }) => {
  const fontList = ['Arial', 'Inter', 'Outfit', 'Courier New', 'Georgia', 'Times New Roman', 'Impact'];
  
  const currentFont = editor.getAttributes('textStyle').fontFamily || 'Arial';

  const options = fontList.map(f => ({
    value: f,
    label: f,
    fontFamily: f
  }));

  return (
    <CustomDropdown 
      value={currentFont} 
      options={options} 
      onChange={(val) => editor.chain().focus().setFontFamily(val).run()} 
      width={100} 
    />
  );
};

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
        <HeadingSelect editor={editor} />

        <Divider />

        {/* Font */}
        <FontSelect editor={editor} />

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
        <ToolbarButton
          onClick={() => {
            const previousUrl = editor.getAttributes('link').href;
            const url = window.prompt('URL', previousUrl || '');
            if (url === null) return; // cancelled
            if (url === '') {
              editor.chain().focus().extendMarkRange('link').unsetLink().run();
            } else {
              editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
            }
          }}
          isActive={editor.isActive('link')}
          tooltip="Insert link"
        >
          <LinkIcon size={16} />
        </ToolbarButton>
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
