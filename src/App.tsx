import React, { useState, useEffect, useCallback } from 'react';
import type { 
  RoomData, 
  DeviceInfo, 
  UserRole, 
  ActiveView, 
  FileItem, 
  TemporaryShareLink 
} from './types/cloudroom.ts';
import { 
  getClientDeviceId, 
  getClientDeviceName, 
  getStoredActiveRoomId, 
  setStoredActiveRoomId, 
  fetchRoomData, 
  createRoom, 
  joinRoom, 
  uploadFiles, 
  renameFile, 
  moveFile, 
  deleteFile, 
  restoreFile, 
  createFolder, 
  broadcastClipboard, 
  sendChatMessage, 
  saveNote, 
  createTemporaryShareLink, 
  renameDevice, 
  kickDevice, 
  updateRoomSettings, 
  subscribeToRoomEvents, 
  getFileDownloadUrl 
} from './services/api.ts';
import './services/firebase.ts';
import { Navbar } from './components/Navbar.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { StorageView } from './components/StorageView.tsx';
import { DevicesView } from './components/DevicesView.tsx';
import { ClipboardView } from './components/ClipboardView.tsx';
import { ChatView } from './components/ChatView.tsx';
import { NotesView } from './components/NotesView.tsx';
import { AnalyticsView } from './components/AnalyticsView.tsx';
import { ActivityView } from './components/ActivityView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { CreateRoomModal } from './components/CreateRoomModal.tsx';
import { JoinRoomModal } from './components/JoinRoomModal.tsx';
import { FilePreviewModal } from './components/FilePreviewModal.tsx';
import { QuickShareModal } from './components/QuickShareModal.tsx';
import { ShareLinkModal } from './components/ShareLinkModal.tsx';
import { PublicShareView } from './components/PublicShareView.tsx';
import { CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export default function App() {
  const [room, setRoom] = useState<RoomData | null>(null);
  const [currentDevice, setCurrentDevice] = useState<DeviceInfo | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('member');
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [initialJoinIdentifier, setInitialJoinIdentifier] = useState('');
  const [initialJoinPin, setInitialJoinPin] = useState('');
  const [isQuickShareOpen, setIsQuickShareOpen] = useState(false);
  const [quickShareTargetId, setQuickShareTargetId] = useState<string | undefined>();
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [shareFile, setShareFile] = useState<FileItem | null>(null);

  // Upload progress
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // In-app Toast Notifications
  const [toasts, setToasts] = useState<{ id: string; title: string; desc?: string; type: 'info' | 'success' | 'alert' }[]>([]);

  const addToast = useCallback((title: string, desc?: string, type: 'info' | 'success' | 'alert' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, desc, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Check query params for external share or invite link
  const urlParams = new URLSearchParams(window.location.search);
  const shareToken = urlParams.get('share');
  const inviteRoomParam = urlParams.get('room');

  // Initial Load: check if user already in room or has invite query
  useEffect(() => {
    async function init() {
      if (shareToken) {
        setIsLoading(false);
        return;
      }

      if (inviteRoomParam) {
        setInitialJoinIdentifier(inviteRoomParam);
        setIsJoinOpen(true);
      }

      const storedRoomId = getStoredActiveRoomId();
      if (storedRoomId) {
        try {
          const roomData = await fetchRoomData(storedRoomId);
          setRoom(roomData);
          const devId = getClientDeviceId();
          let dev = roomData.devices.find((d) => d.id === devId);
          if (!dev) {
            dev = {
              id: devId,
              name: getClientDeviceName(),
              platform: 'browser',
              isOnline: true,
              lastSeen: new Date().toISOString(),
              usedStorageBytes: 0,
              joinedAt: new Date().toISOString(),
              isCurrentDevice: true,
            };
          }
          setCurrentDevice(dev);
          setCurrentRole(roomData.ownerDeviceId === dev.id ? 'owner' : 'member');
        } catch {
          setStoredActiveRoomId(null);
        }
      }
      setIsLoading(false);
    }

    init();
  }, [shareToken, inviteRoomParam]);

  // Realtime SSE Synchronization
  useEffect(() => {
    if (!room || !currentDevice) return;

    const cleanup = subscribeToRoomEvents(room.id, currentDevice.id, (eventType, data) => {
      // Refresh room data when server notifies of changes
      fetchRoomData(room.id)
        .then((fresh) => {
          setRoom(fresh);
          const dev = fresh.devices.find((d) => d.id === currentDevice.id);
          if (dev) setCurrentDevice(dev);
        })
        .catch(() => {});

      // Trigger toasts for peer actions
      if (eventType === 'files_uploaded') {
        addToast('New File Uploaded', 'Peer device synced files to room', 'info');
      } else if (eventType === 'clipboard_new') {
        addToast('Clipboard Updated', 'New text snippet copied to room mesh', 'success');
      } else if (eventType === 'device_joined') {
        addToast('Device Handshake', `${data.device?.name || 'A device'} connected`, 'info');
      } else if (eventType === 'chat_message') {
        if (data.message?.senderDeviceId !== currentDevice.id) {
          addToast(data.message?.senderDeviceName || 'New Message', data.message?.text, 'info');
        }
      }
    });

    return cleanup;
  }, [room?.id, currentDevice?.id, addToast]);

  // Handlers
  const handleCreateRoom = async (name: string, pin: string, deviceName: string) => {
    const res = await createRoom({ name, pin, deviceName });
    setRoom(res.room);
    setCurrentDevice(res.currentDevice);
    setCurrentRole(res.role);
    setActiveView('dashboard');
    addToast('Room Initialized', `Welcome to ${res.room.name}`, 'success');
  };

  const handleJoinRoom = async (identifier: string, pin: string, deviceName: string) => {
    const res = await joinRoom({ identifier, pin, deviceName });
    setRoom(res.room);
    setCurrentDevice(res.currentDevice);
    setCurrentRole(res.role);
    setActiveView('dashboard');
    addToast('Authentication Verified', `Connected to ${res.room.name}`, 'success');
  };

  const handleLaunchDemoRoom = (slug: string, pin: string) => {
    setInitialJoinIdentifier(slug);
    setInitialJoinPin(pin);
    setIsJoinOpen(true);
  };

  const handleLeaveRoom = () => {
    setStoredActiveRoomId(null);
    setRoom(null);
    setCurrentDevice(null);
    setActiveView('dashboard');
    addToast('Exited Room', 'Returned to CloudRoom home', 'info');
  };

  const handleUploadFiles = async (files: File[], folderId: string | null) => {
    if (!room || !currentDevice) return;
    setIsUploading(true);
    setUploadProgress(0);

    try {
      await uploadFiles(
        room.id,
        files,
        folderId,
        currentDevice.id,
        currentRole,
        (percent) => setUploadProgress(percent)
      );
      addToast('Upload Complete', `Uploaded ${files.length} file(s) to cloud storage`, 'success');
      const fresh = await fetchRoomData(room.id);
      setRoom(fresh);
    } catch (err: any) {
      addToast('Upload Error', err.message, 'alert');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownloadFile = (file: FileItem) => {
    if (!room) return;
    const url = getFileDownloadUrl(room.id, file.id);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleRenameFile = async (file: FileItem, newName: string) => {
    if (!room) return;
    await renameFile(room.id, file.id, newName);
    const fresh = await fetchRoomData(room.id);
    setRoom(fresh);
    addToast('File Renamed', `Renamed to ${newName}`, 'success');
  };

  const handleMoveFile = async (file: FileItem, targetFolderId: string | null) => {
    if (!room) return;
    await moveFile(room.id, file.id, targetFolderId);
    const fresh = await fetchRoomData(room.id);
    setRoom(fresh);
    addToast('File Moved', 'Updated directory location', 'success');
  };

  const handleDeleteFile = async (file: FileItem) => {
    if (!room || !currentDevice) return;
    await deleteFile(room.id, file.id, currentDevice.id, currentDevice.name);
    const fresh = await fetchRoomData(room.id);
    setRoom(fresh);
    addToast('Moved to Trash', `${file.name} sent to trash (30-day retention)`, 'info');
  };

  const handleRestoreFile = async (file: FileItem) => {
    if (!room || !currentDevice) return;
    await restoreFile(room.id, file.id, currentDevice.id, currentDevice.name);
    const fresh = await fetchRoomData(room.id);
    setRoom(fresh);
    addToast('File Restored', `${file.name} restored from trash`, 'success');
  };

  const handleCreateFolder = async (name: string, parentId: string | null) => {
    if (!room || !currentDevice) return;
    await createFolder(room.id, name, parentId, currentDevice.id, currentDevice.name);
    const fresh = await fetchRoomData(room.id);
    setRoom(fresh);
    addToast('Directory Created', `Folder "${name}" ready`, 'success');
  };

  const handleBroadcastClipboard = async (content: string, pinned?: boolean) => {
    if (!room || !currentDevice) return;
    await broadcastClipboard(room.id, content, currentDevice.id, currentDevice.name, pinned);
    const fresh = await fetchRoomData(room.id);
    setRoom(fresh);
    addToast('Clipboard Broadcasted', 'Text snippet transmitted to room mesh', 'success');
  };

  const handleSendMessage = async (
    text: string,
    fileAttachment?: { id: string; name: string; sizeBytes: number; mimeType: string }
  ) => {
    if (!room || !currentDevice) return;
    await sendChatMessage(room.id, text, currentDevice.id, currentDevice.name, currentRole, fileAttachment);
    const fresh = await fetchRoomData(room.id);
    setRoom(fresh);
  };

  const handleSaveNote = async (id: string, title: string, content: string) => {
    if (!room || !currentDevice) return;
    await saveNote(room.id, id, title, content, currentDevice.id, currentDevice.name);
    const fresh = await fetchRoomData(room.id);
    setRoom(fresh);
    addToast('Note Synchronized', `Saved "${title}"`, 'success');
  };

  const handleRenameDevice = async (deviceId: string, name: string) => {
    if (!room) return;
    await renameDevice(room.id, deviceId, name);
    const fresh = await fetchRoomData(room.id);
    setRoom(fresh);
    addToast('Device Renamed', `Updated to "${name}"`, 'success');
  };

  const handleKickDevice = async (deviceId: string) => {
    if (!room) return;
    await kickDevice(room.id, deviceId);
    const fresh = await fetchRoomData(room.id);
    setRoom(fresh);
    addToast('Device Removed', 'Revoked from room mesh', 'info');
  };

  const handleUpdateSettings = async (payload: any) => {
    if (!room || !currentDevice) return;
    await updateRoomSettings(room.id, {
      ...payload,
      deviceId: currentDevice.id,
      deviceName: currentDevice.name,
    });
    const fresh = await fetchRoomData(room.id);
    setRoom(fresh);
  };

  const handleCreateShareLink = async (payload: {
    fileId: string;
    expiryHours: number;
    password?: string;
    maxDownloads?: number;
  }) => {
    if (!room || !currentDevice) throw new Error('No active room');
    return createTemporaryShareLink(room.id, {
      ...payload,
      deviceId: currentDevice.id,
    });
  };

  const handleSendQuickFile = async (file: File, targetDeviceId: string) => {
    await handleUploadFiles([file], null);
  };

  const handleSendQuickText = async (text: string, targetDeviceId: string) => {
    await handleBroadcastClipboard(text, false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05070c] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
          <span className="text-xs font-mono text-slate-400">Loading CLOUDROOM engine...</span>
        </div>
      </div>
    );
  }

  // If opening a temporary external share link
  if (shareToken) {
    return (
      <PublicShareView
        token={shareToken}
        onGoHome={() => {
          window.location.search = '';
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#05070c] text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-3.5 shadow-2xl backdrop-blur-xl transition-all ${
              toast.type === 'success'
                ? 'border-emerald-500/40 bg-slate-900/95 text-slate-200'
                : toast.type === 'alert'
                ? 'border-red-500/40 bg-slate-900/95 text-slate-200'
                : 'border-cyan-500/40 bg-slate-900/95 text-slate-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : toast.type === 'alert' ? (
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              <div className="font-semibold text-white">{toast.title}</div>
              {toast.desc && <div className="text-[11px] text-slate-400 mt-0.5">{toast.desc}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Main Navbar */}
      <Navbar
        room={room}
        currentDevice={currentDevice}
        currentRole={currentRole}
        activeView={activeView}
        setActiveView={setActiveView}
        onLeaveRoom={handleLeaveRoom}
        onOpenQuickShare={() => setIsQuickShareOpen(true)}
      />

      {/* Page Content Body */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!room ? (
          /* Landing Page when no active room */
          <LandingPage
            onCreateRoom={() => setIsCreateOpen(true)}
            onJoinRoom={() => {
              setInitialJoinIdentifier('');
              setInitialJoinPin('');
              setIsJoinOpen(true);
            }}
            onLaunchDemoRoom={handleLaunchDemoRoom}
          />
        ) : (
          /* Inside Room: Render active requested tab */
          <>
            {activeView === 'dashboard' && (
              <DashboardView
                room={room}
                currentDevice={currentDevice}
                currentRole={currentRole}
                setActiveView={setActiveView}
                onUploadClick={() => setActiveView('storage')}
                onNewFolderClick={() => setActiveView('storage')}
                onPreviewFile={(file) => setPreviewFile(file)}
                onDownloadFile={handleDownloadFile}
                onOpenQuickShare={() => setIsQuickShareOpen(true)}
              />
            )}

            {activeView === 'storage' && (
              <StorageView
                room={room}
                currentDevice={currentDevice}
                currentRole={currentRole}
                onUploadFiles={handleUploadFiles}
                onDownloadFile={handleDownloadFile}
                onPreviewFile={(file) => setPreviewFile(file)}
                onRenameFile={handleRenameFile}
                onMoveFile={handleMoveFile}
                onDeleteFile={handleDeleteFile}
                onRestoreFile={handleRestoreFile}
                onCreateFolder={handleCreateFolder}
                onCreateShareLink={(file) => setShareFile(file)}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
              />
            )}

            {activeView === 'devices' && (
              <DevicesView
                room={room}
                currentDevice={currentDevice}
                currentRole={currentRole}
                onRenameDevice={handleRenameDevice}
                onKickDevice={handleKickDevice}
                onOpenQuickShareWithTarget={(targetId) => {
                  setQuickShareTargetId(targetId);
                  setIsQuickShareOpen(true);
                }}
              />
            )}

            {activeView === 'clipboard' && (
              <ClipboardView
                room={room}
                currentDevice={currentDevice}
                onBroadcastClipboard={handleBroadcastClipboard}
              />
            )}

            {activeView === 'chat' && (
              <ChatView
                room={room}
                currentDevice={currentDevice}
                currentRole={currentRole}
                onSendMessage={handleSendMessage}
                onDownloadFile={(id, name) => {
                  const f = room.files.find((file) => file.id === id);
                  if (f) handleDownloadFile(f);
                }}
              />
            )}

            {activeView === 'notes' && (
              <NotesView
                room={room}
                currentDevice={currentDevice}
                onSaveNote={handleSaveNote}
              />
            )}

            {activeView === 'analytics' && <AnalyticsView room={room} />}

            {activeView === 'activity' && <ActivityView room={room} />}

            {activeView === 'settings' && (
              <SettingsView
                room={room}
                currentDevice={currentDevice}
                currentRole={currentRole}
                onUpdateSettings={handleUpdateSettings}
              />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateRoom}
      />

      <JoinRoomModal
        isOpen={isJoinOpen}
        initialIdentifier={initialJoinIdentifier}
        initialPin={initialJoinPin}
        onClose={() => setIsJoinOpen(false)}
        onJoin={handleJoinRoom}
      />

      {room && (
        <>
          <FilePreviewModal
            file={previewFile}
            roomId={room.id}
            onClose={() => setPreviewFile(null)}
            onDownload={handleDownloadFile}
            onShare={(file) => {
              setPreviewFile(null);
              setShareFile(file);
            }}
          />

          <ShareLinkModal
            isOpen={!!shareFile}
            file={shareFile}
            onClose={() => setShareFile(null)}
            onCreateLink={handleCreateShareLink}
          />

          <QuickShareModal
            isOpen={isQuickShareOpen}
            room={room}
            currentDevice={currentDevice}
            targetDeviceId={quickShareTargetId}
            onClose={() => {
              setIsQuickShareOpen(false);
              setQuickShareTargetId(undefined);
            }}
            onSendQuickFile={handleSendQuickFile}
            onSendQuickText={handleSendQuickText}
          />
        </>
      )}
    </div>
  );
}
