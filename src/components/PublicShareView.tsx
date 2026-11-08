import React, { useState, useEffect } from 'react';
import { Cloud, Download, Lock, CheckCircle2, AlertTriangle, ArrowLeft, Shield } from 'lucide-react';
import { formatBytes } from '../utils/rules.ts';

interface PublicShareViewProps {
  token: string;
  onGoHome: () => void;
}

export const PublicShareView: React.FC<PublicShareViewProps> = ({ token, onGoHome }) => {
  const [shareData, setShareData] = useState<{
    token: string;
    fileName: string;
    fileSizeBytes: number;
    mimeType: string;
    expiresAt: string;
    passwordProtected: boolean;
    roomName: string;
  } | null>(null);

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetch(`/api/public/share/${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Link invalid or expired');
        }
        return res.json();
      })
      .then((data) => {
        setShareData(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsDownloading(true);

    try {
      const res = await fetch(`/api/public/share/${encodeURIComponent(token)}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to download file');
      }

      // Convert to blob and trigger real browser download
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = shareData?.fileName || 'download';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      setError(err.message || 'Error downloading file');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="absolute inset-0 radial-glow pointer-events-none" />
      <div className="absolute inset-0 radial-grid opacity-30 pointer-events-none" />

      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl text-center">
        {/* Back Link */}
        <button
          onClick={onGoHome}
          className="absolute left-6 top-6 flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>CLOUDROOM</span>
        </button>

        <div className="mt-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white mx-auto shadow-lg shadow-cyan-500/20">
          <Cloud className="h-7 w-7" />
        </div>

        <h1 className="mt-4 text-xl font-bold tracking-tight text-white">Private File Transfer</h1>
        <p className="mt-1 text-xs text-slate-400">
          Encrypted peer transfer from CloudRoom workspace
        </p>

        {isLoading ? (
          <div className="py-12 text-xs text-slate-400">Verifying security token...</div>
        ) : error ? (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-xs text-red-300">
            <AlertTriangle className="h-6 w-6 text-red-400 mx-auto mb-2" />
            <div className="font-semibold">{error}</div>
            <p className="mt-1 text-slate-400">This share link may have expired or been revoked by the owner.</p>
            <button
              onClick={onGoHome}
              className="mt-4 inline-flex items-center gap-1 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
            >
              Go to CLOUDROOM Home
            </button>
          </div>
        ) : shareData ? (
          <div className="mt-6 space-y-5">
            {/* File Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-left">
              <div className="text-xs text-slate-400">Source: <span className="text-cyan-300 font-semibold">{shareData.roomName}</span></div>
              <div className="mt-1 font-semibold text-white text-sm sm:text-base break-all">
                {shareData.fileName}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>{formatBytes(shareData.fileSizeBytes)}</span>
                <span>Expires: {new Date(shareData.expiresAt).toLocaleTimeString()}</span>
              </div>
            </div>

            <form onSubmit={handleDownload} className="space-y-4">
              {shareData.passwordProtected && (
                <div>
                  <label className="block text-left text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-amber-400" />
                    <span>Enter Download Password</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter access code..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isDownloading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>{isDownloading ? 'Downloading File...' : 'Download Original File'}</span>
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
};
