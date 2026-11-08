import React, { useState } from 'react';
import { 
  Cloud, 
  HardDrive, 
  Smartphone, 
  Clipboard, 
  Upload, 
  FolderPlus, 
  Share2, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  ExternalLink, 
  FileText, 
  Download, 
  Clock, 
  Sparkles,
  ArrowUpRight,
  MessageSquare
} from 'lucide-react';
import type { RoomData, DeviceInfo, UserRole, ActiveView, FileItem } from '../types/cloudroom.ts';
import { calculateStorageUsage, formatBytes, categorizeFile } from '../utils/rules.ts';

interface DashboardViewProps {
  room: RoomData;
  currentDevice: DeviceInfo | null;
  currentRole: UserRole;
  setActiveView: (view: ActiveView) => void;
  onUploadClick: () => void;
  onNewFolderClick: () => void;
  onPreviewFile: (file: FileItem) => void;
  onDownloadFile: (file: FileItem) => void;
  onOpenQuickShare: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  room,
  currentDevice,
  currentRole,
  setActiveView,
  onUploadClick,
  onNewFolderClick,
  onPreviewFile,
  onDownloadFile,
  onOpenQuickShare,
}) => {
  const [showPin, setShowPin] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const storageStats = calculateStorageUsage(room.files, room.quotaBytes);
  const activeFiles = room.files.filter((f) => !f.isDeleted);
  const onlineDevices = room.devices.filter((d) => d.isOnline);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Banner for the Room */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-indigo-950/30 p-6 shadow-xl backdrop-blur-xl">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold">
                Room Mesh Online · Encrypted Peer Space
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>{room.name}</span>
              <span className="text-xs font-mono font-normal text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                ID: {room.id}
              </span>
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-2xl">
              Connected workspace uniting {room.devices.length} devices with {formatBytes(room.quotaBytes)} cloud storage, synchronized clipboard, and live data telemetry.
            </p>
          </div>

          {/* Quick Stats Pills */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 min-w-[110px]">
              <div className="text-[10px] uppercase font-semibold text-slate-400">Connected</div>
              <div className="text-lg font-bold font-mono text-cyan-300">
                {onlineDevices.length} <span className="text-xs text-slate-500 font-normal">/ {room.devices.length}</span>
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 min-w-[110px]">
              <div className="text-[10px] uppercase font-semibold text-slate-400">Total Files</div>
              <div className="text-lg font-bold font-mono text-indigo-300">
                {activeFiles.length}
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 min-w-[120px]">
              <div className="text-[10px] uppercase font-semibold text-slate-400">Storage Used</div>
              <div className="text-lg font-bold font-mono text-white">
                {formatBytes(storageStats.usedBytes)}
              </div>
            </div>
          </div>
        </div>

        {/* Room Access Credentials Strip */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {/* Slug & Direct Link */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Invite Link:</span>
              <code className="bg-slate-950/80 px-2 py-1 rounded border border-slate-800 font-mono text-cyan-300">
                {window.location.origin}/?room={room.slug}
              </code>
              <button
                onClick={() => handleCopy(`${window.location.origin}/?room=${room.slug}`, 'link')}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Copy Invite Link"
              >
                {copiedText === 'link' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* 6-Digit PIN Info */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 flex items-center gap-1">
                <KeyRound className="h-3.5 w-3.5 text-cyan-400" />
                <span>6-Digit PIN:</span>
              </span>
              <code className="bg-slate-950/80 px-2.5 py-1 rounded border border-slate-800 font-mono tracking-wider font-semibold text-white">
                {showPin ? '482913' : '••••••'}
              </code>
              <button
                onClick={() => setShowPin(!showPin)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={showPin ? 'Hide PIN' : 'Reveal PIN'}
              >
                {showPin ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Current Role:</span>
            <span className="rounded bg-indigo-950/80 border border-indigo-700/60 px-2 py-0.5 text-xs font-semibold uppercase text-indigo-300">
              {currentRole}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions Action Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={onUploadClick}
          className="flex items-center justify-center gap-2.5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3.5 text-xs font-semibold text-cyan-300 transition-all hover:bg-cyan-900/40 hover:border-cyan-500/60 active:scale-95 cursor-pointer shadow-sm"
        >
          <Upload className="h-4 w-4 text-cyan-400" />
          <span>Upload Files</span>
        </button>

        <button
          onClick={onNewFolderClick}
          className="flex items-center justify-center gap-2.5 rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3.5 text-xs font-semibold text-indigo-300 transition-all hover:bg-indigo-900/40 hover:border-indigo-500/60 active:scale-95 cursor-pointer shadow-sm"
        >
          <FolderPlus className="h-4 w-4 text-indigo-400" />
          <span>New Folder</span>
        </button>

        <button
          onClick={onOpenQuickShare}
          className="flex items-center justify-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-900/40 hover:border-emerald-500/60 active:scale-95 cursor-pointer shadow-sm"
        >
          <Share2 className="h-4 w-4 text-emerald-400" />
          <span>Quick Device P2P</span>
        </button>

        <button
          onClick={() => setActiveView('clipboard')}
          className="flex items-center justify-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 text-xs font-semibold text-amber-300 transition-all hover:bg-amber-900/40 hover:border-amber-500/60 active:scale-95 cursor-pointer shadow-sm"
        >
          <Clipboard className="h-4 w-4 text-amber-400" />
          <span>Shared Clipboard</span>
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Storage Overview & Recent Files */}
        <div className="lg:col-span-2 space-y-6">
          {/* Storage Meter Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <HardDrive className="h-4 w-4 text-cyan-400" />
                <span>Cloud Storage Quota</span>
              </div>
              <span className="text-xs font-mono text-cyan-300 font-medium">
                {storageStats.percentage}% used
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  storageStats.isOverQuota
                    ? 'bg-red-500'
                    : storageStats.isNearQuota
                    ? 'bg-amber-400'
                    : 'bg-gradient-to-r from-cyan-400 to-indigo-500'
                }`}
                style={{ width: `${Math.max(1, storageStats.percentage)}%` }}
              ></div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>Used: {formatBytes(storageStats.usedBytes)}</span>
              <span>Available: {formatBytes(storageStats.remainingBytes)} of {formatBytes(room.quotaBytes)}</span>
            </div>
          </div>

          {/* Recent Files Section */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Recent Shared Files</h3>
                <p className="text-xs text-slate-400">Latest files synced to this CloudRoom</p>
              </div>
              <button
                onClick={() => setActiveView('storage')}
                className="flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <span>View All Files</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {activeFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 py-10 text-center">
                <Cloud className="h-8 w-8 text-slate-600 mb-2" />
                <p className="text-xs text-slate-400">No files uploaded yet in this room.</p>
                <button
                  onClick={onUploadClick}
                  className="mt-3 text-xs font-semibold text-cyan-400 hover:underline"
                >
                  Upload your first file
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {activeFiles.slice(0, 5).map((file) => {
                  const category = categorizeFile(file.mimeType, file.name);
                  return (
                    <div
                      key={file.id}
                      className="group flex items-center justify-between py-3 transition-colors hover:bg-slate-800/30 px-2 rounded-lg"
                    >
                      <div 
                        onClick={() => onPreviewFile(file)}
                        className="flex items-center gap-3 min-w-0 cursor-pointer"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800/80 text-cyan-400 group-hover:bg-cyan-950/60">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-medium text-white truncate max-w-[200px] sm:max-w-sm">
                            {file.name}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{formatBytes(file.sizeBytes)}</span>
                            <span>·</span>
                            <span>By {file.uploadedByDeviceName}</span>
                            <span>·</span>
                            <span className="capitalize">{category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onPreviewFile(file)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-300 transition-colors"
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDownloadFile(file)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-indigo-300 transition-colors"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Connected Devices & Live Activity */}
        <div className="space-y-6">
          {/* Active Devices Fleet Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Active Device Mesh</h3>
              </div>
              <button
                onClick={() => setActiveView('devices')}
                className="text-xs text-cyan-400 hover:underline"
              >
                Fleet ({room.devices.length})
              </button>
            </div>

            <div className="space-y-2.5">
              {room.devices.map((device) => {
                const isCurrent = currentDevice?.id === device.id;
                return (
                  <div
                    key={device.id}
                    className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 p-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                          device.isOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50' : 'bg-slate-600'
                        }`}
                      ></span>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-white truncate">{device.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-1 rounded border border-cyan-800/50">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="capitalize">{device.platform}</span>
                          <span>·</span>
                          <span>{device.isOnline ? 'Online' : 'Offline'}</span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                      {formatBytes(device.usedStorageBytes)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shared Clipboard Widget */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Clipboard className="h-4 w-4 text-amber-400" />
                <span>Live Room Clipboard</span>
              </div>
              <button
                onClick={() => setActiveView('clipboard')}
                className="text-xs text-amber-400 hover:underline"
              >
                Open Pad
              </button>
            </div>

            {room.clipboardItems.length > 0 ? (
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-3">
                <div className="text-xs font-mono text-slate-200 break-all line-clamp-3">
                  {room.clipboardItems[0].content}
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
                  <span>From: {room.clipboardItems[0].fromDeviceName}</span>
                  <button
                    onClick={() => handleCopy(room.clipboardItems[0].content, 'clip0')}
                    className="flex items-center gap-1 font-medium text-amber-400 hover:text-amber-300"
                  >
                    {copiedText === 'clip0' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedText === 'clip0' ? 'Copied!' : 'Copy Snippet'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-3 text-center">Clipboard empty. Broadcast text across devices anytime.</p>
            )}
          </div>

          {/* Quick Chat Preview */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <MessageSquare className="h-4 w-4 text-indigo-400" />
                <span>Room Chat</span>
              </div>
              <button
                onClick={() => setActiveView('chat')}
                className="text-xs text-indigo-400 hover:underline"
              >
                Open Chat ({room.chatMessages.length})
              </button>
            </div>

            {room.chatMessages.length > 0 ? (
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-3">
                <div className="text-xs text-slate-300 line-clamp-2">
                  <span className="font-semibold text-indigo-300 mr-1">
                    {room.chatMessages[room.chatMessages.length - 1].senderDeviceName}:
                  </span>
                  {room.chatMessages[room.chatMessages.length - 1].text}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-2 text-center">No messages yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
