import React, { useState } from 'react';
import { 
  Cloud, 
  HardDrive, 
  Smartphone, 
  MessageSquare, 
  Clipboard, 
  FileText, 
  BarChart3, 
  Activity, 
  Settings, 
  Share2, 
  LogOut, 
  Copy, 
  Check, 
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import type { ActiveView, RoomData, DeviceInfo, UserRole } from '../types/cloudroom.ts';

interface NavbarProps {
  room: RoomData | null;
  currentDevice: DeviceInfo | null;
  currentRole: UserRole;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  onLeaveRoom: () => void;
  onOpenQuickShare: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  room,
  currentDevice,
  currentRole,
  activeView,
  setActiveView,
  onLeaveRoom,
  onOpenQuickShare,
}) => {
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);

  const handleCopyInvite = () => {
    if (!room) return;
    const url = `${window.location.origin}/?room=${room.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  const navItems: { view: ActiveView; label: string; icon: React.FC<{ className?: string }> }[] = [
    { view: 'dashboard', label: 'Workspace', icon: HardDrive },
    { view: 'storage', label: 'Cloud Drive', icon: Cloud },
    { view: 'devices', label: 'Devices', icon: Smartphone },
    { view: 'chat', label: 'Room Chat', icon: MessageSquare },
    { view: 'clipboard', label: 'Clipboard', icon: Clipboard },
    { view: 'notes', label: 'Notes', icon: FileText },
    { view: 'analytics', label: 'Analytics', icon: BarChart3 },
    { view: 'activity', label: 'Activity', icon: Activity },
    { view: 'settings', label: 'Security & Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#06080d]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Room Info */}
        <div className="flex items-center gap-4">
          <div 
            onClick={() => setActiveView('dashboard')}
            className="flex cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 shadow-lg shadow-cyan-500/20">
              <Cloud className="h-5 w-5 text-white" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-base font-mono">CLOUDROOM</span>
                <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 font-semibold bg-cyan-950/60 border border-cyan-800/50 px-1.5 py-0.5 rounded">
                  v2.4
                </span>
              </div>
            </div>
          </div>

          {room && (
            <div className="hidden md:flex items-center gap-3 border-l border-slate-800 pl-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-200">{room.name}</span>
                  <span className="text-xs font-mono text-slate-400">({room.slug})</span>
                  <span className="rounded bg-indigo-950/70 border border-indigo-800/60 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-indigo-300">
                    {currentRole}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCopyInvite}
                title="Copy Room Direct Link"
                className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/50 px-2.5 py-1 text-xs text-slate-300 transition-colors hover:border-cyan-500/50 hover:bg-slate-800 hover:text-white"
              >
                {copiedInvite ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-300 font-medium">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                    <span>Invite Link</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Section: Quick Share, Device status, Leave */}
        {room && (
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Quick Share Action */}
            <button
              onClick={onOpenQuickShare}
              className="hidden sm:flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm shadow-cyan-500/20 transition-all hover:brightness-110 active:scale-95"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Quick Transfer</span>
            </button>

            {/* Current Device Pill */}
            {currentDevice && (
              <div className="relative">
                <button
                  onClick={() => setShowDeviceDropdown(!showDeviceDropdown)}
                  className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:border-slate-700"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span className="max-w-[120px] truncate font-medium">{currentDevice.name}</span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>

                {showDeviceDropdown && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-800 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-xl z-50">
                    <div className="mb-2 pb-2 border-b border-slate-800/80">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Connected Device</div>
                      <div className="font-medium text-white text-sm truncate mt-0.5">{currentDevice.name}</div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span>Platform: <span className="capitalize text-slate-200">{currentDevice.platform}</span></span>
                        <span>·</span>
                        <span className="text-emerald-400">Online Now</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                      <button
                        onClick={() => {
                          setShowDeviceDropdown(false);
                          setActiveView('devices');
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-slate-300 hover:bg-slate-800 hover:text-white"
                      >
                        <Smartphone className="h-3.5 w-3.5 text-slate-400" />
                        <span>Manage All Devices ({room.devices.length})</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowDeviceDropdown(false);
                          setActiveView('settings');
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-slate-300 hover:bg-slate-800 hover:text-white"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                        <span>Security & Access Logs</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Exit Room */}
            <button
              onClick={onLeaveRoom}
              title="Leave Room"
              className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-950/20 px-2.5 py-1.5 text-xs text-red-300 transition-colors hover:bg-red-900/40 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Sub-bar when inside a Room */}
      {room && (
        <div className="overflow-x-auto border-t border-slate-800/60 bg-slate-950/50 px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 py-1.5 min-w-max">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => setActiveView(item.view)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-slate-800/90 text-cyan-400 shadow-sm border border-slate-700/80'
                      : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.view === 'chat' && room.chatMessages.length > 0 && (
                    <span className="ml-1 rounded-full bg-indigo-500/20 px-1.5 py-0.2 text-[10px] text-indigo-300">
                      {room.chatMessages.length}
                    </span>
                  )}
                  {item.view === 'clipboard' && room.clipboardItems.length > 0 && (
                    <span className="ml-1 rounded-full bg-cyan-500/20 px-1.5 py-0.2 text-[10px] text-cyan-300">
                      {room.clipboardItems.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};
