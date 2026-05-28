import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api.tsx';
import { parseMarkdownToHtml } from './markdownParser.tsx';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  Link as LinkIcon,
  Image as ImageIcon,
  Film,
  FolderKanban,
  Eye,
  Edit3,
  Search,
  HelpCircle,
  Upload,
  X,
  Code,
} from 'lucide-react';

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write description details here...',
  onTaskClick,
}) {
  // Popup state: null | { type: 'link'|'image'|'video', url: '', text: '', savedStart: number, savedEnd: number }
  const [insertPopup, setInsertPopup] = useState(null);

  // Task picker
  const [taskPickerOpen, setTaskPickerOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingTasks, setLoadingTasks] = useState(false);

  // File upload loading
  const [uploading, setUploading] = useState(false);
  const [editorMode, setEditorMode] = useState('write'); // 'write' | 'preview'

  const textareaRef = useRef(null);
  const pickerRef = useRef(null);
  const imageFileRef = useRef(null);
  const videoFileRef = useRef(null);

  /* ── Close task picker on outside click ─────────────────────── */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setTaskPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ── Save cursor position before opening a popup ────────────── */
  const openPopup = (type) => {
    const ta = textareaRef.current;
    const savedStart = ta ? ta.selectionStart : (value || '').length;
    const savedEnd = ta ? ta.selectionEnd : savedStart;
    setInsertPopup({ type, url: '', text: '', savedStart, savedEnd });
  };

  /* ── Insert text at saved cursor position ───────────────────── */
  const insertAtSaved = useCallback(
    (snippet, savedStart, savedEnd) => {
      const text = value || '';
      const before = text.substring(0, savedStart);
      const selected = text.substring(savedStart, savedEnd);
      const after = text.substring(savedEnd);
      const newVal = before + snippet + (selected || '') + after;
      onChange(newVal);
      setTimeout(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.focus();
        const pos = savedStart + snippet.length + (selected || '').length;
        ta.setSelectionRange(pos, pos);
      }, 0);
    },
    [value, onChange]
  );

  /* ── Generic text insert at current cursor ──────────────────── */
  const insertText = useCallback(
    (before, after = '') => {
      const ta = textareaRef.current;
      const start = ta ? ta.selectionStart : (value || '').length;
      const end = ta ? ta.selectionEnd : start;
      insertAtSaved(before, start, end);
      if (after) {
        // wrap selected text
        const text = value || '';
        const selected = text.substring(start, end);
        const newVal =
          text.substring(0, start) +
          before +
          selected +
          after +
          text.substring(end);
        onChange(newVal);
        setTimeout(() => {
          if (!ta) return;
          ta.focus();
          ta.setSelectionRange(start + before.length, start + before.length + selected.length);
        }, 0);
      }
    },
    [value, onChange, insertAtSaved]
  );

  /* ── Confirm inline popup insert ────────────────────────────── */
  const handleConfirmInsert = () => {
    if (!insertPopup) return;
    const { type, url, text, savedStart, savedEnd } = insertPopup;
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setInsertPopup(null);
      return;
    }
    let snippet = '';
    if (type === 'link') snippet = `[${text || 'Link'}](${trimmedUrl})`;
    else if (type === 'image') snippet = `![${text || 'Image'}](${trimmedUrl})`;
    else if (type === 'video') snippet = `![${text || 'Video'}](${trimmedUrl})`;
    insertAtSaved(snippet, savedStart, savedEnd);
    setInsertPopup(null);
  };

  /* ── Local file → base64 embed ─────────────────────────────── */
  const handleLocalFile = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const ta = textareaRef.current;
      const start = ta ? ta.selectionStart : (value || '').length;
      const end = ta ? ta.selectionEnd : start;
      const caption = file.name.replace(/\.[^.]+$/, '');
      const snippet = `![${caption}](${dataUrl})`;
      insertAtSaved(snippet, start, end);
      setUploading(false);
    };
    reader.onerror = () => setUploading(false);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  /* ── Paste Handler ────────────────────────────────────────── */
  const handlePaste = (e) => {
    const files = e.clipboardData?.files;
    if (files && files.length > 0) {
      e.preventDefault();
      const file = files[0];
      setUploading(true);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        const ta = textareaRef.current;
        const start = ta ? ta.selectionStart : (value || '').length;
        const end = ta ? ta.selectionEnd : start;
        const caption = file.name ? file.name.replace(/\.[^.]+$/, '') : 'Pasted Media';
        const snippet = `![${caption}](${dataUrl})`;
        insertAtSaved(snippet, start, end);
        setUploading(false);
      };
      reader.onerror = () => setUploading(false);
      reader.readAsDataURL(file);
      return;
    }

    const pastedText = e.clipboardData?.getData('text');
    if (pastedText && (pastedText.startsWith('http://') || pastedText.startsWith('https://'))) {
      e.preventDefault();
      const url = pastedText.trim();
      let snippet = '';
      const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
      const isImage = url.match(/\.(jpeg|jpg|gif|png|webp|svg)/i);
      const isVideo = url.match(/\.(mp4|webm|ogg)/i);

      if (isYouTube) {
        snippet = `![YouTube Video](${url})`;
      } else if (isImage) {
        snippet = `![Image](${url})`;
      } else if (isVideo) {
        snippet = `![Video](${url})`;
      } else {
        snippet = `[Link](${url})`;
      }

      const ta = textareaRef.current;
      const start = ta ? ta.selectionStart : (value || '').length;
      const end = ta ? ta.selectionEnd : start;
      insertAtSaved(snippet, start, end);
    }
  };

  /* ── Wrap selected text (or insert at cursor) with a prefix/suffix ── */
  const wrapSelection = useCallback(
    (prefix, suffix = '') => {
      const ta = textareaRef.current;
      if (!ta) return;
      const text = value || '';
      const start = ta.selectionStart;
      const end   = ta.selectionEnd;
      const selected = text.substring(start, end);
      const newVal =
        text.substring(0, start) +
        prefix +
        selected +
        suffix +
        text.substring(end);
      onChange(newVal);
      setTimeout(() => {
        ta.focus();
        if (start === end) {
          // No selection: place cursor between markers
          ta.setSelectionRange(start + prefix.length, start + prefix.length);
        } else {
          // Keep the original text highlighted
          ta.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
        }
      }, 0);
    },
    [value, onChange]
  );

  /* ── Keyboard Shortcuts / Bullet Management ────────────────── */
  const handleKeyDown = (e) => {
    const isCtrl = e.ctrlKey || e.metaKey; // support macOS ⌘ too

    /* ── Format shortcuts ── */
    if (isCtrl && !e.altKey) {
      // Ctrl+B → **bold**
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        wrapSelection('**', '**');
        return;
      }
      // Ctrl+I → *italic*
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        wrapSelection('*', '*');
        return;
      }
      // Ctrl+K → open link popup
      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        openPopup('link');
        return;
      }
      // Ctrl+H → # Heading
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        const ta = textareaRef.current;
        if (!ta) return;
        const text = value || '';
        const start = ta.selectionStart;
        // Insert at the beginning of the current line
        const lineStart = text.lastIndexOf('\n', start - 1) + 1;
        const before = text.substring(0, lineStart);
        const after  = text.substring(lineStart);
        const newVal = before + '# ' + after;
        onChange(newVal);
        setTimeout(() => { ta.focus(); ta.setSelectionRange(lineStart + 2, lineStart + 2); }, 0);
        return;
      }
      // Ctrl+Shift+S → ~~strikethrough~~
      if (e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        wrapSelection('~~', '~~');
        return;
      }
      // Ctrl+Shift+U → - bullet list
      if (e.shiftKey && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        const ta = textareaRef.current;
        if (!ta) return;
        const text = value || '';
        const start = ta.selectionStart;
        const lineStart = text.lastIndexOf('\n', start - 1) + 1;
        const before = text.substring(0, lineStart);
        const after  = text.substring(lineStart);
        const newVal = before + '- ' + after;
        onChange(newVal);
        setTimeout(() => { ta.focus(); ta.setSelectionRange(lineStart + 2, lineStart + 2); }, 0);
        return;
      }
      // Ctrl+` → `inline code`
      if (e.key === '`') {
        e.preventDefault();
        wrapSelection('`', '`');
        return;
      }
    }

    /* ── Auto-continue bullet lists on Enter ── */
    if (e.key === 'Enter') {
      const ta = textareaRef.current;
      if (!ta) return;
      const text = value || '';
      const start = ta.selectionStart;
      
      const beforeCursor = text.substring(0, start);
      const lastNewline = beforeCursor.lastIndexOf('\n');
      const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
      const currentLine = beforeCursor.substring(lineStart);
      
      const bulletMatch = currentLine.match(/^(\s*(?:-\s+|\*\s+|\d+\.\s+))/);
      
      if (bulletMatch) {
        e.preventDefault();
        const prefix = bulletMatch[1];
        const afterCursor = text.substring(start);
        
        if (currentLine.trim() === prefix.trim()) {
          const cleanedBefore = beforeCursor.substring(0, beforeCursor.length - currentLine.length);
          onChange(cleanedBefore + '\n' + afterCursor);
          setTimeout(() => {
            ta.focus();
            const pos = cleanedBefore.length + 1;
            ta.setSelectionRange(pos, pos);
          }, 0);
        } else {
          onChange(beforeCursor + '\n' + prefix + afterCursor);
          setTimeout(() => {
            ta.focus();
            const pos = start + 1 + prefix.length;
            ta.setSelectionRange(pos, pos);
          }, 0);
        }
      }
    }
  };

  /* ── Task picker ─────────────────────────────────────────────── */
  const handleOpenTaskPicker = async () => {
    if (taskPickerOpen) { setTaskPickerOpen(false); return; }
    setTaskPickerOpen(true);
    setLoadingTasks(true);
    try {
      const res = await api.get('/tasks');
      setTasks(res.data.data.tasks || []);
    } catch (err) {
      console.error('Failed to fetch tasks for picker', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleSelectTask = (taskId, taskTitle) => {
    const ta = textareaRef.current;
    const start = ta ? ta.selectionStart : (value || '').length;
    const end = ta ? ta.selectionEnd : start;
    insertAtSaved(`[#task:${taskId}:${taskTitle}]`, start, end);
    setTaskPickerOpen(false);
    setSearchQuery('');
  };

  const filteredTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.project?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ── Popup labels ─────────────────────────────────────────────── */
  const popupConfig = {
    link: {
      label: 'Insert Link',
      textPlaceholder: 'Display text (e.g. Documentation)',
      urlPlaceholder: 'URL (e.g. https://google.com)',
      color: 'violet',
    },
    image: {
      label: 'Embed Image',
      textPlaceholder: 'Caption / alt text',
      urlPlaceholder: 'Image URL (https://... or paste a public link)',
      color: 'emerald',
    },
    video: {
      label: 'Embed Video',
      textPlaceholder: 'Video title',
      urlPlaceholder: 'Video URL ending in .mp4 / .webm (https://...)',
      color: 'amber',
    },
  };

  const cfg = insertPopup ? popupConfig[insertPopup.type] : null;

  return (
    <div className="border border-slate-800 rounded-xl bg-slate-950 overflow-hidden flex flex-col min-h-[260px]">

      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="bg-slate-900/70 border-b border-slate-800/80 px-3 py-2 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-0.5 flex-wrap">
          {/* Text format group */}
          <button type="button" onClick={() => wrapSelection('**', '**')} title="Bold (Ctrl+B)" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
            <Bold size={13} />
          </button>
          <button type="button" onClick={() => wrapSelection('*', '*')} title="Italic (Ctrl+I)" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
            <Italic size={13} />
          </button>
          <button type="button" onClick={() => wrapSelection('~~', '~~')} title="Strikethrough (Ctrl+Shift+S)" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
            <Strikethrough size={13} />
          </button>
          <button type="button" onClick={() => wrapSelection('`', '`')} title="Inline Code (Ctrl+`)" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors font-mono">
            <Code size={13} />
          </button>
          <div className="w-px h-4 bg-slate-800 mx-0.5" />
          <button type="button" onClick={() => insertText('# ', '')} title="Heading 1 (Ctrl+H)" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
            <Heading1 size={13} />
          </button>
          <button type="button" onClick={() => insertText('## ', '')} title="Heading 2" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
            <Heading2 size={13} />
          </button>
          <button type="button" onClick={() => insertText('- ', '')} title="Bullet List (Ctrl+Shift+U)" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
            <List size={13} />
          </button>

          <div className="w-px h-4 bg-slate-800 mx-1" />

          {/* Link popup */}
          <button
            type="button"
            onClick={() => openPopup('link')}
            title="Insert hyperlink (Ctrl+K)"
            className={`p-1.5 rounded-lg transition-colors ${insertPopup?.type === 'link' ? 'bg-violet-950 text-violet-400' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`}
          >
            <LinkIcon size={13} />
          </button>

          {/* Image ─ URL popup OR local file upload */}
          <button
            type="button"
            onClick={() => openPopup('image')}
            title="Embed image via URL"
            className={`p-1.5 rounded-lg transition-colors ${insertPopup?.type === 'image' ? 'bg-emerald-950 text-emerald-400' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`}
          >
            <ImageIcon size={13} />
          </button>
          <input
            ref={imageFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleLocalFile(e, 'image')}
          />
          <button
            type="button"
            onClick={() => imageFileRef.current?.click()}
            title="Upload image from computer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
          >
            {uploading ? (
              <div className="w-3 h-3 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            ) : (
              <Upload size={12} />
            )}
          </button>

          {/* Video ─ URL popup OR local file upload */}
          <button
            type="button"
            onClick={() => openPopup('video')}
            title="Embed video via URL"
            className={`p-1.5 rounded-lg transition-colors ${insertPopup?.type === 'video' ? 'bg-amber-950 text-amber-400' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`}
          >
            <Film size={13} />
          </button>
          <input
            ref={videoFileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => handleLocalFile(e, 'video')}
          />
          <button
            type="button"
            onClick={() => videoFileRef.current?.click()}
            title="Upload video from computer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
          >
            <Upload size={12} />
          </button>

          <div className="w-px h-4 bg-slate-800 mx-1" />

          {/* Link another task */}
          <div className="relative" ref={pickerRef}>
            <button
              type="button"
              onClick={handleOpenTaskPicker}
              title="Link another task"
              className={`p-1.5 rounded-lg flex items-center gap-1 transition-colors ${
                taskPickerOpen
                  ? 'bg-violet-950 text-violet-400 border border-violet-800'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              <FolderKanban size={13} />
              <span className="text-[9px] font-bold uppercase">Link Task</span>
            </button>

            {taskPickerOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 space-y-2">
                <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800">
                  <Search size={11} className="text-slate-500 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-[10px] text-slate-200 outline-none"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto space-y-0.5 pr-0.5">
                  {loadingTasks ? (
                    <p className="text-[9px] text-slate-500 text-center py-3">Loading tasks…</p>
                  ) : filteredTasks.length === 0 ? (
                    <p className="text-[9px] text-slate-500 text-center py-3">No matching tasks.</p>
                  ) : (
                    filteredTasks.map((t) => (
                      <button
                        key={t._id}
                        type="button"
                        onClick={() => handleSelectTask(t._id, t.title)}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <span className="text-slate-500 block text-[8px] font-bold uppercase truncate">
                          {t.project?.name || 'Workspace'}
                        </span>
                        <span className="block text-[10px] font-bold text-slate-200 truncate">{t.title}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setEditorMode('write')}
            className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all ${
              editorMode === 'write'
                ? 'bg-violet-600 text-white shadow'
                : 'text-slate-500 hover:text-slate-350'
            }`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setEditorMode('preview')}
            className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all ${
              editorMode === 'preview'
                ? 'bg-violet-600 text-white shadow'
                : 'text-slate-500 hover:text-slate-350'
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      {/* ── Inline Insert Popup ─────────────────────────────── */}
      {insertPopup && cfg && (
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center gap-2">
          <span className={`text-[9px] font-black uppercase tracking-wider text-${cfg.color}-400 flex-shrink-0`}>
            {cfg.label}
          </span>
          <input
            type="text"
            placeholder={cfg.textPlaceholder}
            value={insertPopup.text}
            onChange={(e) => setInsertPopup((p) => ({ ...p, text: e.target.value }))}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-100 outline-none w-40 focus:border-violet-500 transition-colors"
          />
          <input
            type="text"
            placeholder={cfg.urlPlaceholder}
            value={insertPopup.url}
            autoFocus
            onChange={(e) => setInsertPopup((p) => ({ ...p, url: e.target.value }))}
            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmInsert(); if (e.key === 'Escape') setInsertPopup(null); }}
            className="flex-1 min-w-[160px] bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-100 outline-none focus:border-violet-500 transition-colors"
          />
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={handleConfirmInsert}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-[9px] font-black rounded-lg transition-colors uppercase"
            >
              Insert
            </button>
            <button
              type="button"
              onClick={() => setInsertPopup(null)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* ── Editor & Preview Toggleable Box ───────────────────── */}
      <div className="flex-1 min-h-[220px] flex flex-col bg-slate-950">
        {editorMode === 'write' ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 w-full bg-transparent px-4 py-3.5 text-xs text-slate-200 font-medium outline-none resize-none min-h-[220px] leading-relaxed placeholder-slate-650 border-0"
          />
        ) : (
          <div className="p-4 overflow-y-auto min-h-[220px] max-h-[350px] bg-slate-900/10">
            {!value?.trim() ? (
              <p className="text-slate-600 italic text-xs">Nothing to preview. Type something in Write mode first!</p>
            ) : (
              <RichTextPreview content={value} onTaskClick={onTaskClick} />
            )}
          </div>
        )}
      </div>
      {/* ── Footer hint ─────────────────────────────────────── */}
      <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-900 flex flex-wrap justify-between items-center gap-1 text-[9px] text-slate-600 select-none">
        <span className="flex flex-wrap gap-x-2 gap-y-0.5">
          <span><kbd className="bg-slate-800 text-slate-400 rounded px-0.5">Ctrl+B</kbd> Bold</span>
          <span><kbd className="bg-slate-800 text-slate-400 rounded px-0.5">Ctrl+I</kbd> Italic</span>
          <span><kbd className="bg-slate-800 text-slate-400 rounded px-0.5">Ctrl+K</kbd> Link</span>
          <span><kbd className="bg-slate-800 text-slate-400 rounded px-0.5">Ctrl+H</kbd> Heading</span>
          <span><kbd className="bg-slate-800 text-slate-400 rounded px-0.5">Ctrl+⇧S</kbd> Strike</span>
          <span><kbd className="bg-slate-800 text-slate-400 rounded px-0.5">Ctrl+⇧U</kbd> Bullet</span>
          <span><kbd className="bg-slate-800 text-slate-400 rounded px-0.5">Ctrl+`</kbd> Code</span>
        </span>
        <span className="flex items-center gap-1">
          <HelpCircle size={8} />
          Markdown + paste + YouTube
        </span>
      </div>
    </div>
  );
}

/* ── Preview renderer ───────────────────────────────────────── */
export function RichTextPreview({ content, onTaskClick }) {
  const containerRef = useRef(null);
  const html = parseMarkdownToHtml(content);

  const handleClick = (e) => {
    const badge = e.target.closest('.task-link-badge');
    if (badge && onTaskClick) {
      const taskId = badge.getAttribute('data-task-id');
      if (taskId) onTaskClick(taskId);
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className="text-xs text-slate-300 leading-relaxed font-medium rich-text-container"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
