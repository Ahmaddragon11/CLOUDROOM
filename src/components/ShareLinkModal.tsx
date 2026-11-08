import React, { useState } from 'react';
import { X, Share2, Clock, Lock, Copy, Check, ExternalLink } from 'lucide-react';
import type { FileItem, TemporaryShareLink } from '../types/cloudroom.ts';
import { formatBytes } from '../utils/rules.ts';

interface ShareLinkModalProps {
  isOpen: boolean;
  file: FileItem | null;
  onClose: () => void;
  onCreateLink: (payload: {
    fileId: string;
    expiryHours: number;
    password?: string;
    maxDownloads?: number;
  }) => Promise<TemporaryShareLink>;
}

export const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  isOpen,
  file,
  onClose,
  onCreateLink,
}) => {
  const [expiryHours, setExpiryHours] = useState('24');
  const [password, setPassword] = useState('');
  const [maxDownloads, setMaxDownloads] = useState('');
  const [createdLink, setCreatedLink] = useState<TemporaryShareLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !file) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const link = await onCreateLink({
        fileId: file.id,
        expiryHours: parseInt(expiryHours, 10),
        password: password.trim() || undefined,
        maxDownloads: maxDownloads ? parseInt(maxDownloads, 10) : undefined,
      });
      setCreatedLink(link);
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = createdLink
    ? `${window.location.origin}/?share=${createdLink.token}`
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Create External Share Link</h2>
              <p className="text-xs text-slate-400">Share with external people outside CloudRoom</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Target File Info */}
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex items-center justify-between text-xs">
          <div className="truncate pr-2">
            <div className="font-semibold text-white truncate">{file.name}</div>
            <div className="text-[11px] text-slate-400">{formatBytes(file.sizeBytes)}</div>
          </div>
          <span className="font-mono text-cyan-400 text-[11px] shrink-0">Encrypted</span>
        </div>

        {createdLink ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-2">
                <Check className="h-4 w-4" />
                <span>Temporary Link Generated</span>
              </div>
              <div className="text-xs font-mono text-slate-200 break-all bg-black/50 p-2.5 rounded border border-slate-800">
                {shareUrl}
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                Expires on: {new Date(createdLink.expiresAt).toLocaleString()}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-cyan-600 py-2.5 text-xs font-semibold text-white hover:bg-cyan-500"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Link Copied!' : 'Copy Share URL'}</span>
              </button>
              <button
                onClick={() => setCreatedLink(null)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs text-slate-300 hover:text-white"
              >
                New Link
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGenerate} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-cyan-400" />
                <span>Link Expiration</span>
              </label>
              <select
                value={expiryHours}
                onChange={(e) => setExpiryHours(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="1">1 Hour</option>
                <option value="6">6 Hours</option>
                <option value="24">24 Hours (1 Day)</option>
                <option value="72">3 Days</option>
                <option value="168">7 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-slate-400" />
                <span>Optional Password Protection</span>
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank for no password"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Max Allowed Downloads (Optional)
              </label>
              <input
                type="number"
                min={1}
                value={maxDownloads}
                onChange={(e) => setMaxDownloads(e.target.value)}
                placeholder="e.g. 1 for one-time view/download"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 py-3 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Generating Encrypted Link...' : 'Generate Temporary Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
