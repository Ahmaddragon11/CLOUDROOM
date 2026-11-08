import React, { useState } from 'react';
import { Clipboard, Send, Copy, Check, Pin, Smartphone, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import type { RoomData, DeviceInfo, ClipboardItem } from '../types/cloudroom.ts';

interface ClipboardViewProps {
  room: RoomData;
  currentDevice: DeviceInfo | null;
  onBroadcastClipboard: (content: string, pinned?: boolean) => Promise<void>;
}

export const ClipboardView: React.FC<ClipboardViewProps> = ({
  room,
  currentDevice,
  onBroadcastClipboard,
}) => {
  const [inputText, setInputText] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    try {
      await onBroadcastClipboard(inputText.trim(), isPinned);
      setInputText('');
      setIsPinned(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (item: ClipboardItem) => {
    navigator.clipboard.writeText(item.content);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header and Sync Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Clipboard className="h-5 w-5 text-amber-400" />
            <span>Shared Mesh Clipboard</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronize links, API keys, terminal commands and text across all connected room devices
          </p>
        </div>

        {/* User consent & auto-sync toggle */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0"
            />
            <span>Auto-Accept Incoming Clips</span>
          </label>
        </div>
      </div>

      {/* Input Box: Broadcast new text to all devices */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-xl">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Send className="h-3.5 w-3.5 text-cyan-400" />
          <span>Broadcast Snippet to All Devices</span>
        </h3>

        <form onSubmit={handleSend} className="space-y-3">
          <textarea
            rows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste or type any text, token, password, link or code snippet to instantly transmit to your other devices..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0"
              />
              <Pin className="h-3.5 w-3.5 text-amber-400" />
              <span>Pin to top of clipboard history</span>
            </label>

            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{loading ? 'Transmitting...' : 'Broadcast to Devices'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Clipboard History Feed */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
          <span>Active Clipboard History ({room.clipboardItems.length})</span>
          <span className="text-[11px] text-slate-500 font-normal">Encrypted peer transmission</span>
        </div>

        {room.clipboardItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 py-16 text-center">
            <Clipboard className="h-10 w-10 text-slate-600 mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">Room Clipboard is empty</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Any text broadcasted from your phone, laptop, or desktop will appear here instantly for one-click copy.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {room.clipboardItems.map((item) => (
              <div
                key={item.id}
                className={`group rounded-xl border p-4 transition-all ${
                  item.pinned
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 font-mono text-xs sm:text-sm text-slate-200 break-all select-all whitespace-pre-wrap bg-black/40 p-3 rounded-lg border border-slate-800/80">
                    {item.content}
                  </div>

                  <button
                    onClick={() => handleCopy(item)}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-semibold text-amber-300 hover:bg-slate-700 hover:text-white transition-all shadow-sm active:scale-95"
                    title="Copy to System Clipboard"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Transmitted by <span className="text-slate-300 font-medium">{item.fromDeviceName}</span></span>
                    {item.pinned && (
                      <span className="flex items-center gap-1 text-amber-400">
                        <Pin className="h-3 w-3" />
                        <span>Pinned</span>
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-slate-500">{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
