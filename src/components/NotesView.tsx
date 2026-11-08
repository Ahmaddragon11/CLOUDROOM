import React, { useState, useEffect } from 'react';
import { FileText, Plus, Save, Copy, Check, Eye, Edit3, Smartphone, Clock } from 'lucide-react';
import type { RoomData, DeviceInfo, RoomNote } from '../types/cloudroom.ts';

interface NotesViewProps {
  room: RoomData;
  currentDevice: DeviceInfo | null;
  onSaveNote: (id: string, title: string, content: string) => Promise<void>;
}

export const NotesView: React.FC<NotesViewProps> = ({
  room,
  currentDevice,
  onSaveNote,
}) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string>(
    room.notes.length > 0 ? room.notes[0].id : 'new'
  );
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const note = room.notes.find((n) => n.id === selectedNoteId);
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    } else {
      setTitle('New Collaborative Pad');
      setContent('');
    }
  }, [selectedNoteId, room.notes]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      await onSaveNote(selectedNoteId, title.trim(), content);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNew = () => {
    const newId = `note_${Date.now()}`;
    setSelectedNoteId(newId);
    setTitle('Untitled Note');
    setContent('');
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeNote = room.notes.find((n) => n.id === selectedNoteId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[75vh]">
      {/* Left Sidebar: Notes List */}
      <div className="md:col-span-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between backdrop-blur-xl overflow-hidden">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-cyan-400" />
              <span>Room Notes</span>
            </h3>
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-1 rounded-lg bg-cyan-600/80 px-2 py-1 text-[11px] font-medium text-white hover:bg-cyan-500"
            >
              <Plus className="h-3 w-3" />
              <span>New</span>
            </button>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[55vh]">
            {room.notes.map((note) => (
              <button
                key={note.id}
                onClick={() => setSelectedNoteId(note.id)}
                className={`w-full text-left rounded-xl p-3 text-xs transition-all ${
                  selectedNoteId === note.id
                    ? 'border border-cyan-500/50 bg-slate-800 text-white shadow-sm'
                    : 'border border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="font-semibold truncate">{note.title || 'Untitled Note'}</div>
                <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                  {note.content || 'Empty note...'}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 text-center">
          Shared across all room members
        </div>
      </div>

      {/* Right Column: Editor / Markdown Preview */}
      <div className="md:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between backdrop-blur-xl overflow-hidden">
        {/* Editor Toolbar */}
        <div className="border-b border-slate-800 p-4 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note Title..."
            className="flex-1 min-w-[200px] bg-transparent font-bold text-base text-white focus:outline-none"
          />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPreview(!isPreview)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
            >
              {isPreview ? <Edit3 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              <span>{isPreview ? 'Edit' : 'Preview'}</span>
            </button>

            <button
              onClick={handleCopyContent}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
              title="Copy Note Text"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSaving ? 'Saving...' : 'Sync Note'}</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-5 overflow-y-auto">
          {isPreview ? (
            <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
              {content || <span className="text-slate-500 italic">No content to preview.</span>}
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start drafting notes, code snippets, project roadmaps, or meeting minutes..."
              className="w-full h-full min-h-[350px] bg-transparent resize-none text-xs sm:text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none"
            />
          )}
        </div>

        {/* Note Footer Details */}
        <div className="border-t border-slate-800 px-5 py-3 bg-slate-950/70 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {activeNote && (
              <>
                <span className="flex items-center gap-1">
                  <Smartphone className="h-3 w-3 text-cyan-400" />
                  <span>Last edited by {activeNote.lastEditedByDeviceName}</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-slate-500" />
                  <span>{new Date(activeNote.updatedAt).toLocaleTimeString()}</span>
                </span>
              </>
            )}
          </div>
          <div>{content.length} characters · {content.split(/\s+/).filter(Boolean).length} words</div>
        </div>
      </div>
    </div>
  );
};
