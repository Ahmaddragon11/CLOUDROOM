import React, { useState } from 'react';
import { 
  Settings, 
  KeyRound, 
  ShieldCheck, 
  ShieldAlert, 
  Trash2, 
  Check, 
  Copy, 
  Lock, 
  Save, 
  Share2, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import type { RoomData, DeviceInfo, UserRole } from '../types/cloudroom.ts';
import { validatePinFormat, formatBytes } from '../utils/rules.ts';

interface SettingsViewProps {
  room: RoomData;
  currentDevice: DeviceInfo | null;
  currentRole: UserRole;
  onUpdateSettings: (payload: {
    newPin?: string;
    currentPin?: string;
    quotaBytes?: number;
    settings?: Partial<RoomData['settings']>;
  }) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  room,
  currentDevice,
  currentRole,
  onUpdateSettings,
}) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPins, setShowPins] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Room Policy Toggles
  const [allowUpload, setAllowUpload] = useState(room.settings.allowMemberUpload);
  const [allowDelete, setAllowDelete] = useState(room.settings.allowMemberDelete);
  const [autoSyncClip, setAutoSyncClip] = useState(room.settings.clipboardAutoSync);
  const [trashDays, setTrashDays] = useState(room.settings.trashRetentionDays);

  const isOwner = currentRole === 'owner';

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!currentPin) {
      setStatusMsg({ type: 'error', text: 'Enter your current 6-digit PIN' });
      return;
    }
    if (!validatePinFormat(newPin)) {
      setStatusMsg({ type: 'error', text: 'New PIN must be strictly 6 numeric digits' });
      return;
    }
    if (newPin !== confirmPin) {
      setStatusMsg({ type: 'error', text: 'New PIN and confirmation do not match' });
      return;
    }

    setLoading(true);
    try {
      await onUpdateSettings({
        currentPin,
        newPin,
      });
      setStatusMsg({ type: 'success', text: 'Room PIN successfully updated!' });
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update PIN' });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePolicies = async () => {
    setStatusMsg(null);
    setLoading(true);
    try {
      await onUpdateSettings({
        settings: {
          allowMemberUpload: allowUpload,
          allowMemberDelete: allowDelete,
          clipboardAutoSync: autoSyncClip,
          trashRetentionDays: trashDays,
        },
      });
      setStatusMsg({ type: 'success', text: 'Security policies updated successfully!' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update policies' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Settings className="h-5 w-5 text-indigo-400" />
          <span>Room Settings & Security</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure room access keys, member policies, and review authentication audits
        </p>
      </div>

      {statusMsg && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3 text-xs ${
            statusMsg.type === 'success'
              ? 'border border-emerald-500/30 bg-emerald-950/30 text-emerald-300'
              : 'border border-red-500/30 bg-red-950/30 text-red-300'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <Check className="h-4 w-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Change 6-Digit PIN */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-cyan-400" />
              <span>Update 6-Digit Room Access PIN</span>
            </h3>
            <button
              onClick={() => setShowPins(!showPins)}
              className="text-xs text-slate-400 hover:text-white"
            >
              {showPins ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {!isOwner ? (
            <p className="text-xs text-slate-400">
              Only the room Owner has permission to change the 6-digit access code.
            </p>
          ) : (
            <form onSubmit={handleChangePin} className="space-y-3.5">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Current 6-Digit PIN</label>
                <input
                  type={showPins ? 'text' : 'password'}
                  maxLength={6}
                  required
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-center font-mono tracking-widest text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">New 6-Digit PIN</label>
                  <input
                    type={showPins ? 'text' : 'password'}
                    maxLength={6}
                    required
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-center font-mono tracking-widest text-sm text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Confirm New PIN</label>
                  <input
                    type={showPins ? 'text' : 'password'}
                    maxLength={6}
                    required
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-center font-mono tracking-widest text-sm text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-cyan-600 py-2.5 text-xs font-semibold text-white hover:bg-cyan-500 active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Save New Security PIN'}
              </button>
            </form>
          )}
        </div>

        {/* Card 2: Permissions & Room Policies */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Member Policies & Permissions</span>
          </h3>

          <div className="space-y-4">
            <label className="flex items-start justify-between gap-3 cursor-pointer">
              <div>
                <div className="text-xs font-medium text-white">Allow Members to Upload Files</div>
                <div className="text-[11px] text-slate-400">Regular members can drop and upload files into room storage</div>
              </div>
              <input
                type="checkbox"
                checked={allowUpload}
                onChange={(e) => setAllowUpload(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0"
              />
            </label>

            <label className="flex items-start justify-between gap-3 cursor-pointer">
              <div>
                <div className="text-xs font-medium text-white">Allow Members to Delete Files</div>
                <div className="text-[11px] text-slate-400">Permit non-admin members to send files to the trash bin</div>
              </div>
              <input
                type="checkbox"
                checked={allowDelete}
                onChange={(e) => setAllowDelete(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0"
              />
            </label>

            <label className="flex items-start justify-between gap-3 cursor-pointer">
              <div>
                <div className="text-xs font-medium text-white">Live Clipboard Auto-Sync</div>
                <div className="text-[11px] text-slate-400">Enable real-time push to all authenticated devices</div>
              </div>
              <input
                type="checkbox"
                checked={autoSyncClip}
                onChange={(e) => setAutoSyncClip(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0"
              />
            </label>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
              <span className="text-slate-300">Trash Bin Retention Period:</span>
              <span className="font-mono text-cyan-300 font-semibold">{trashDays} Days</span>
            </div>

            {isOwner && (
              <button
                onClick={handleSavePolicies}
                disabled={loading}
                className="w-full mt-2 rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 active:scale-95"
              >
                Save Policies
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Security Audit Trail Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-purple-400" />
          <span>Security Audit Trail & Authentication Log</span>
        </h3>

        <div className="divide-y divide-slate-800/80">
          {room.securityAudits.map((sec) => (
            <div key={sec.id} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span
                  className={`h-2 w-2 rounded-full ${
                    sec.status === 'success'
                      ? 'bg-emerald-400'
                      : sec.status === 'failed'
                      ? 'bg-red-400'
                      : 'bg-amber-400'
                  }`}
                ></span>
                <div>
                  <span className="font-semibold text-white mr-2">{sec.action}</span>
                  <span className="text-slate-400">{sec.details}</span>
                </div>
              </div>
              <span className="font-mono text-slate-500 text-[11px]">
                {new Date(sec.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
