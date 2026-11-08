import React, { useState } from 'react';
import { 
  Smartphone, 
  Monitor, 
  Laptop, 
  Terminal, 
  Globe, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  HardDrive, 
  Clock, 
  Share2, 
  ShieldCheck, 
  Wifi, 
  WifiOff 
} from 'lucide-react';
import type { RoomData, DeviceInfo, DevicePlatform, UserRole } from '../types/cloudroom.ts';
import { formatBytes, checkPermission } from '../utils/rules.ts';

interface DevicesViewProps {
  room: RoomData;
  currentDevice: DeviceInfo | null;
  currentRole: UserRole;
  onRenameDevice: (deviceId: string, newName: string) => Promise<void>;
  onKickDevice: (deviceId: string) => Promise<void>;
  onOpenQuickShareWithTarget?: (targetDeviceId: string) => void;
}

export const DevicesView: React.FC<DevicesViewProps> = ({
  room,
  currentDevice,
  currentRole,
  onRenameDevice,
  onKickDevice,
  onOpenQuickShareWithTarget,
}) => {
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmKickId, setConfirmKickId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canManage = checkPermission(currentRole, 'manage_devices');

  const startRename = (device: DeviceInfo) => {
    setEditingDeviceId(device.id);
    setEditName(device.name);
  };

  const handleSaveRename = async (deviceId: string) => {
    if (!editName.trim()) return;
    setLoading(true);
    try {
      await onRenameDevice(deviceId, editName.trim());
      setEditingDeviceId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmKick = async (deviceId: string) => {
    setLoading(true);
    try {
      await onKickDevice(deviceId);
      setConfirmKickId(null);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform: DevicePlatform) => {
    switch (platform) {
      case 'mac':
        return <Laptop className="h-6 w-6 text-sky-400" />;
      case 'windows':
        return <Monitor className="h-6 w-6 text-blue-400" />;
      case 'linux':
        return <Terminal className="h-6 w-6 text-amber-400" />;
      case 'android':
      case 'ios':
        return <Smartphone className="h-6 w-6 text-emerald-400" />;
      default:
        return <Globe className="h-6 w-6 text-indigo-400" />;
    }
  };

  const onlineCount = room.devices.filter((d) => d.isOnline).length;
  const totalStorage = room.devices.reduce((sum, d) => sum + d.usedStorageBytes, 0);

  return (
    <div className="space-y-6">
      {/* Header and Telemetry Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Smartphone className="h-5 w-5 text-emerald-400" />
            <span>Room Device Fleet</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time management and synchronization of all devices connected to {room.name}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-white">{onlineCount}</span>
            <span className="text-slate-400">Online Now</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs text-slate-300">
            <HardDrive className="h-3.5 w-3.5 text-cyan-400" />
            <span className="font-semibold text-white">{formatBytes(totalStorage)}</span>
            <span className="text-slate-400">Total Mesh Storage</span>
          </div>
        </div>
      </div>

      {/* Device Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {room.devices.map((device) => {
          const isCurrent = currentDevice?.id === device.id;
          const isOwnerDevice = room.ownerDeviceId === device.id;
          const isEditing = editingDeviceId === device.id;

          return (
            <div
              key={device.id}
              className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all backdrop-blur-xl ${
                isCurrent
                  ? 'border-cyan-500/50 bg-slate-900/80 shadow-lg shadow-cyan-500/10'
                  : 'border-slate-800/80 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/70'
              }`}
            >
              {/* Top Row: Icon + Online Badge + Owner Tag */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800/90 border border-slate-700/80 shadow-inner">
                      {getPlatformIcon(device.platform)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            device.isOnline
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {device.isOnline ? (
                            <>
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              <span>Online</span>
                            </>
                          ) : (
                            <>
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-500"></span>
                              <span>Offline</span>
                            </>
                          )}
                        </span>

                        {isOwnerDevice && (
                          <span className="rounded bg-indigo-950/90 border border-indigo-700/70 px-1.5 py-0.5 text-[10px] font-bold text-indigo-300">
                            MASTER
                          </span>
                        )}
                        {isCurrent && (
                          <span className="rounded bg-cyan-950/90 border border-cyan-700/70 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">
                            THIS DEVICE
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <div className="flex items-center gap-1">
                    {!isEditing && (
                      <button
                        onClick={() => startRename(device)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Rename Device"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {canManage && !isOwnerDevice && (
                      <button
                        onClick={() => setConfirmKickId(device.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                        title="Remove Device from Room"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Device Name (editable or static) */}
                {isEditing ? (
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-lg border border-cyan-500 bg-slate-950 px-2.5 py-1 text-xs text-white focus:outline-none"
                    />
                    <button
                      onClick={() => handleSaveRename(device.id)}
                      disabled={loading}
                      className="rounded-lg bg-cyan-600 p-1.5 text-white hover:bg-cyan-500"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingDeviceId(null)}
                      className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <h3 className="text-sm font-semibold text-white truncate mb-1" title={device.name}>
                    {device.name}
                  </h3>
                )}

                <div className="space-y-1.5 text-xs text-slate-400 mt-2">
                  <div className="flex items-center justify-between">
                    <span>Platform OS:</span>
                    <span className="capitalize text-slate-200 font-medium">{device.platform}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Storage Uploaded:</span>
                    <span className="text-cyan-300 font-mono font-medium">
                      {formatBytes(device.usedStorageBytes)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last Active:</span>
                    <span className="text-slate-300">
                      {device.isOnline ? 'Just now' : new Date(device.lastSeen).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Footer: Device ID & Quick Transfer */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-mono truncate max-w-[140px]" title={device.id}>
                  {device.id}
                </span>

                {onOpenQuickShareWithTarget && !isCurrent && device.isOnline && (
                  <button
                    onClick={() => onOpenQuickShareWithTarget(device.id)}
                    className="flex items-center gap-1 font-medium text-cyan-400 hover:text-cyan-300"
                  >
                    <Share2 className="h-3 w-3" />
                    <span>Send File</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Kick Confirmation Modal */}
      {confirmKickId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl border border-red-500/30 bg-slate-900 p-5 shadow-2xl">
            <h3 className="text-sm font-semibold text-white mb-2">Remove Device from Room?</h3>
            <p className="text-xs text-slate-400 mb-4">
              This device will be immediately revoked and will need the 6-digit access PIN to rejoin.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmKickId(null)}
                className="rounded-xl px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmKick(confirmKickId)}
                className="rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-500"
              >
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
