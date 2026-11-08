import React, { useState, useRef } from 'react';
import { X, Share2, Smartphone, Upload, Send, Check, FileText } from 'lucide-react';
import type { RoomData, DeviceInfo, FileItem } from '../types/cloudroom.ts';
import { formatBytes } from '../utils/rules.ts';

interface QuickShareModalProps {
  isOpen: boolean;
  room: RoomData;
  currentDevice: DeviceInfo | null;
  targetDeviceId?: string;
  onClose: () => void;
  onSendQuickFile: (file: File, targetDeviceId: string) => Promise<void>;
  onSendQuickText: (text: string, targetDeviceId: string) => Promise<void>;
}

export const QuickShareModal: React.FC<QuickShareModalProps> = ({
  isOpen,
  room,
  currentDevice,
  targetDeviceId,
  onClose,
  onSendQuickFile,
  onSendQuickText,
}) => {
  const [selectedTarget, setSelectedTarget] = useState<string>(
    targetDeviceId || (room.devices.find((d) => d.id !== currentDevice?.id)?.id || 'all')
  );
  const [mode, setMode] = useState<'file' | 'text'>('file');
  const [textPayload, setTextPayload] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const targetDevices = room.devices.filter((d) => d.id !== currentDevice?.id);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      if (mode === 'file' && selectedFile) {
        await onSendQuickFile(selectedFile, selectedTarget);
      } else if (mode === 'text' && textPayload.trim()) {
        await onSendQuickText(textPayload.trim(), selectedTarget);
      }
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Quick Device P2P Transfer</h2>
              <p className="text-xs text-slate-400">Direct instant transfer to paired room hardware</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {success ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <Check className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-white">Transferred Successfully!</h3>
            <p className="text-xs text-slate-400 mt-1">Target device notified immediately.</p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="mt-5 space-y-4">
            {/* Target Device Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5 text-cyan-400" />
                <span>Destination Device</span>
              </label>
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="all">Broadcast to All Connected Devices</option>
                {targetDevices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.platform.toUpperCase()}) {d.isOnline ? '· Online' : '· Offline'}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode Switch: File or Quick Text */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setMode('file')}
                className={`py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  mode === 'file' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-400'
                }`}
              >
                Send File
              </button>
              <button
                type="button"
                onClick={() => setMode('text')}
                className={`py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  mode === 'text' ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-400'
                }`}
              >
                Send Text / Command
              </button>
            </div>

            {mode === 'file' ? (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-800 bg-slate-950/60 p-6 text-center cursor-pointer hover:border-cyan-500/60 transition-colors"
                >
                  <Upload className="h-8 w-8 text-cyan-400 mb-2" />
                  {selectedFile ? (
                    <div>
                      <div className="text-xs font-semibold text-white truncate max-w-xs">{selectedFile.name}</div>
                      <div className="text-[10px] text-cyan-300 font-mono mt-0.5">{formatBytes(selectedFile.size)}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs font-medium text-slate-300">Click to select file</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Any format up to 200MB</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <textarea
                  rows={4}
                  value={textPayload}
                  onChange={(e) => setTextPayload(e.target.value)}
                  placeholder="Paste snippet, URL, access key, or prompt..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSending || (mode === 'file' && !selectedFile) || (mode === 'text' && !textPayload.trim())}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-3 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              {isSending ? 'Transmitting P2P...' : 'Transfer Now'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
