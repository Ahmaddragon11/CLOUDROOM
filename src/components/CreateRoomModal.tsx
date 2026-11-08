import React, { useState, useEffect } from 'react';
import { X, Sparkles, KeyRound, HardDrive, Smartphone, Check, AlertCircle } from 'lucide-react';
import { generateRoomSlug, validatePinFormat } from '../utils/rules.ts';
import { checkRoomName, getClientDeviceName } from '../services/api.ts';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, pin: string, deviceName: string) => Promise<void>;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [slug, setSlug] = useState('');
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDeviceName(getClientDeviceName());
      generateRandomPin();
      setError(null);
    }
  }, [isOpen]);

  const handleNameChange = (val: string) => {
    setName(val);
    const generated = generateRoomSlug(val);
    setSlug(generated);
    setIsAvailable(null);

    if (val.trim().length >= 3) {
      setIsCheckingName(true);
      checkRoomName(val)
        .then((res) => {
          setIsAvailable(res.available);
        })
        .catch(() => {
          setIsAvailable(null);
        })
        .finally(() => {
          setIsCheckingName(false);
        });
    }
  };

  const generateRandomPin = () => {
    const random = Math.floor(100000 + Math.random() * 900000).toString();
    setPin(random);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a unique room name.');
      return;
    }
    if (!validatePinFormat(pin)) {
      setError('PIN must be strictly 6 numeric digits (e.g. 482913).');
      return;
    }
    if (isAvailable === false) {
      setError('This room name is already taken. Choose another name.');
      return;
    }

    setLoading(true);
    try {
      await onCreate(name, pin, deviceName);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create room.');
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Create Private CloudRoom</h2>
              <p className="text-xs text-slate-400">Deploy an isolated multi-device space in seconds</p>
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Room Name */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Room Name (Unique Identifier)
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. DRAGON SPACE, ALPHA TEAM, HOME STUDIO"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            {slug && (
              <div className="mt-1.5 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-mono">
                  Slug: <span className="text-cyan-300 font-semibold">{slug}</span>
                </span>
                {isCheckingName ? (
                  <span className="text-slate-500">Checking availability...</span>
                ) : isAvailable === true ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                    <Check className="h-3 w-3" /> Available Globally
                  </span>
                ) : isAvailable === false ? (
                  <span className="text-red-400 font-medium">Already registered</span>
                ) : null}
              </div>
            )}
          </div>

          {/* 6-Digit PIN */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-cyan-400" />
                <span>6-Digit Security PIN</span>
              </label>
              <button
                type="button"
                onClick={generateRandomPin}
                className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Generate Random
              </button>
            </div>
            <input
              type="text"
              maxLength={6}
              required
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 482913"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-center text-lg font-mono tracking-widest text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Only devices entering this 6-digit code or direct authenticated link can join.
            </p>
          </div>

          {/* Device Profile */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5 text-slate-400" />
              <span>Your Master Device Nickname</span>
            </label>
            <input
              type="text"
              required
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="e.g. Ahmad's MacBook Pro M3"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Storage Quota default indicator */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <HardDrive className="h-4 w-4 text-cyan-400" />
              <span>Initial Storage Allocation:</span>
            </div>
            <span className="font-mono font-semibold text-cyan-300">50 GB High-Speed Cloud</span>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Initializing CloudRoom...' : 'Create & Launch Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
