import React, { useState, useEffect } from 'react';
import { X, Users, KeyRound, Smartphone, AlertCircle } from 'lucide-react';
import { validatePinFormat } from '../utils/rules.ts';
import { getClientDeviceName } from '../services/api.ts';

interface JoinRoomModalProps {
  isOpen: boolean;
  initialIdentifier?: string;
  initialPin?: string;
  onClose: () => void;
  onJoin: (identifier: string, pin: string, deviceName: string) => Promise<void>;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  isOpen,
  initialIdentifier = '',
  initialPin = '',
  onClose,
  onJoin,
}) => {
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [pin, setPin] = useState(initialPin);
  const [deviceName, setDeviceName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lockoutSecs, setLockoutSecs] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDeviceName(getClientDeviceName());
      if (initialIdentifier) setIdentifier(initialIdentifier);
      if (initialPin) setPin(initialPin);
      setError(null);
    }
  }, [isOpen, initialIdentifier, initialPin]);

  useEffect(() => {
    if (lockoutSecs && lockoutSecs > 0) {
      const timer = setInterval(() => {
        setLockoutSecs((prev) => (prev && prev > 1 ? prev - 1 : null));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutSecs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Extract identifier if user pasted a full URL
    let cleanId = identifier.trim();
    if (cleanId.includes('/join/')) {
      cleanId = cleanId.split('/join/')[1].split('?')[0].split('#')[0];
    } else if (cleanId.includes('room=')) {
      const match = cleanId.match(/room=([^&]+)/);
      if (match) cleanId = match[1];
    }

    if (!cleanId) {
      setError('Please provide a Room Name or Room ID');
      return;
    }
    if (!validatePinFormat(pin)) {
      setError('PIN must be 6 numeric digits');
      return;
    }

    setLoading(true);
    try {
      await onJoin(cleanId, pin, deviceName);
      onClose();
    } catch (err: any) {
      if (err.message && err.message.includes('Locked')) {
        setLockoutSecs(60);
      }
      setError(err.message || 'Failed to authenticate into room');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-950/80 text-indigo-400 border border-indigo-800/60">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Join Private CloudRoom</h2>
              <p className="text-xs text-slate-400">Connect this device to an existing private workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {lockoutSecs !== null && lockoutSecs > 0 && (
          <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-950/30 p-3 text-xs text-amber-300">
            Rate limit active: Too many failed attempts. Try again in {lockoutSecs}s.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Room Name or Identifier */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Room Name or Invite Link
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. DRAGON SPACE or cloudroom.com/join/DRAGONSPACE"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* 6-Digit PIN */}
          <div>
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-1.5">
              <KeyRound className="h-3.5 w-3.5 text-cyan-400" />
              <span>6-Digit Access Code</span>
            </label>
            <input
              type="password"
              maxLength={6}
              required
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-center text-lg font-mono tracking-widest text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Device Nickname */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5 text-slate-400" />
              <span>Your Device Nickname in this Room</span>
            </label>
            <input
              type="text"
              required
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="e.g. Ahmad's iPhone 15 Pro"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Quick Demo Fill button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                setIdentifier('DRAGONSPACE');
                setPin('482913');
              }}
              className="text-[11px] text-cyan-400 hover:underline"
            >
              Fill with Demo Room credentials: DRAGON SPACE / 482913
            </button>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || (lockoutSecs !== null && lockoutSecs > 0)}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Authenticate & Join'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
