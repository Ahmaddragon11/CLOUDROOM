import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Paperclip, Smartphone, Shield, Download, FileText } from 'lucide-react';
import type { RoomData, DeviceInfo, UserRole, ChatMessage } from '../types/cloudroom.ts';
import { formatBytes } from '../utils/rules.ts';

interface ChatViewProps {
  room: RoomData;
  currentDevice: DeviceInfo | null;
  currentRole: UserRole;
  onSendMessage: (text: string, fileAttachment?: { id: string; name: string; sizeBytes: number; mimeType: string }) => Promise<void>;
  onDownloadFile: (fileId: string, name: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  room,
  currentDevice,
  currentRole,
  onSendMessage,
  onDownloadFile,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedFileAttachment, setSelectedFileAttachment] = useState<{
    id: string;
    name: string;
    sizeBytes: number;
    mimeType: string;
  } | null>(null);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [room.chatMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedFileAttachment) return;

    setLoading(true);
    try {
      await onSendMessage(inputText.trim(), selectedFileAttachment || undefined);
      setInputText('');
      setSelectedFileAttachment(null);
    } finally {
      setLoading(false);
    }
  };

  const activeFiles = room.files.filter((f) => !f.isDeleted);

  return (
    <div className="flex flex-col h-[75vh] rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-xl">
      {/* Header with Online Devices Presence */}
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-slate-950/80">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-950/80 text-indigo-400 border border-indigo-800/60">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Room Discussions</h2>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>{room.name}</span>
              <span>·</span>
              <span className="text-emerald-400 font-medium">
                {room.devices.filter((d) => d.isOnline).length} Active Online
              </span>
            </div>
          </div>
        </div>

        {/* Online Devices Pills */}
        <div className="hidden sm:flex items-center gap-2">
          {room.devices
            .filter((d) => d.isOnline)
            .slice(0, 3)
            .map((d) => (
              <span
                key={d.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 px-2.5 py-1 text-[11px] text-slate-300"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                <span className="truncate max-w-[100px]">{d.name}</span>
              </span>
            ))}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {room.chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <MessageSquare className="h-10 w-10 text-slate-700 mb-2" />
            <p className="text-xs text-slate-500">No messages in this room yet.</p>
            <p className="text-[11px] text-slate-600">Send a note or attach a cloud file to start collaborating.</p>
          </div>
        ) : (
          room.chatMessages.map((msg) => {
            const isMe = currentDevice?.id === msg.senderDeviceId;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {/* Sender Metadata */}
                <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400 px-1">
                  <span className="font-semibold text-slate-300">{msg.senderDeviceName}</span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[9px] uppercase font-bold text-slate-400">
                    {msg.senderRole}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-500 font-mono text-[10px]">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm max-w-lg shadow-sm ${
                    isMe
                      ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-none'
                  }`}
                >
                  {msg.text && <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>}

                  {/* Attachment if present */}
                  {msg.fileAttachment && (
                    <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-black/30 p-2.5 border border-white/10">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-cyan-300 shrink-0" />
                        <div className="truncate text-xs">
                          <div className="font-medium text-white truncate">{msg.fileAttachment.name}</div>
                          <div className="text-[10px] text-slate-300">{formatBytes(msg.fileAttachment.sizeBytes)}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => onDownloadFile(msg.fileAttachment!.id, msg.fileAttachment!.name)}
                        className="rounded-lg p-1.5 bg-white/10 hover:bg-white/20 text-white transition-colors"
                        title="Download attachment"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Selected Attachment preview bar */}
      {selectedFileAttachment && (
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-cyan-300">
          <div className="flex items-center gap-2">
            <Paperclip className="h-3.5 w-3.5" />
            <span>Attached file: <strong>{selectedFileAttachment.name}</strong> ({formatBytes(selectedFileAttachment.sizeBytes)})</span>
          </div>
          <button
            onClick={() => setSelectedFileAttachment(null)}
            className="text-slate-400 hover:text-white"
          >
            Remove
          </button>
        </div>
      )}

      {/* Cloud File Picker Popup */}
      {showFilePicker && (
        <div className="p-3 bg-slate-950 border-t border-slate-800 max-h-48 overflow-y-auto">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Select Cloud File to Attach
          </div>
          {activeFiles.length === 0 ? (
            <p className="text-xs text-slate-500">No cloud files available in room.</p>
          ) : (
            <div className="space-y-1">
              {activeFiles.map((file) => (
                <button
                  key={file.id}
                  onClick={() => {
                    setSelectedFileAttachment({
                      id: file.id,
                      name: file.name,
                      sizeBytes: file.sizeBytes,
                      mimeType: file.mimeType,
                    });
                    setShowFilePicker(false);
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white text-left"
                >
                  <span className="truncate max-w-xs">{file.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{formatBytes(file.sizeBytes)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat Input Toolbar */}
      <form onSubmit={handleSubmit} className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowFilePicker(!showFilePicker)}
          className="rounded-xl p-2.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-colors"
          title="Attach Cloud File"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Message DRAGON SPACE room devices..."
          className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
        />

        <button
          type="submit"
          disabled={loading || (!inputText.trim() && !selectedFileAttachment)}
          className="flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 p-2.5 text-white shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
