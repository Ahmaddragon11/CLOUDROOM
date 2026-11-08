import React from 'react';
import { 
  Cloud, 
  Shield, 
  Smartphone, 
  Zap, 
  ArrowRight, 
  HardDrive, 
  Clipboard, 
  Share2, 
  CheckCircle2, 
  Lock, 
  Sparkles,
  Users
} from 'lucide-react';

interface LandingPageProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onLaunchDemoRoom: (slug: string, pin: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onCreateRoom,
  onJoinRoom,
  onLaunchDemoRoom,
}) => {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Background Glows and Grid */}
      <div className="absolute inset-0 radial-glow pointer-events-none" />
      <div className="absolute inset-0 radial-grid opacity-40 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
        {/* Hero Section */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1 text-xs text-cyan-300 shadow-sm backdrop-blur-md mb-6">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span className="font-medium tracking-wide">Next-Gen Digital Workspace & Cloud Hub</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl sm:leading-[1.15]">
            Your Private Digital Space{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
              Across Every Device
            </span>
          </h1>

          <p className="mt-6 text-base text-slate-300 sm:text-lg sm:leading-relaxed">
            Unite your computers, smartphones, and colleagues in private, zero-configuration digital rooms. 
            Real cloud storage, synchronized live clipboard, multi-device presence, and encrypted instant file transfers.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <button
              onClick={onCreateRoom}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-cyan-500/20 transition-all hover:brightness-110 active:scale-95 cursor-pointer"
            >
              <span>Create Private Room</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={onJoinRoom}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-6 py-3.5 text-sm font-semibold text-slate-200 transition-all hover:border-slate-600 hover:bg-slate-800 active:scale-95 cursor-pointer"
            >
              <Users className="h-4 w-4 text-cyan-400" />
              <span>Join with 6-Digit PIN</span>
            </button>
          </div>

          {/* Quick Demo Room Launch Banner */}
          <div className="mt-6">
            <button
              onClick={() => onLaunchDemoRoom('DRAGONSPACE', '482913')}
              className="group inline-flex items-center gap-2.5 rounded-lg border border-indigo-500/30 bg-indigo-950/30 px-4 py-2 text-xs text-indigo-300 transition-all hover:border-indigo-500/60 hover:bg-indigo-900/40"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Test Live Featured Room:</span>
              <span className="font-mono font-semibold text-white group-hover:text-cyan-300">DRAGON SPACE (PIN: 482913)</span>
              <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] uppercase font-bold text-indigo-200">Instant Demo</span>
            </button>
          </div>
        </div>

        {/* Interactive Showcase Preview */}
        <div className="mt-16 rounded-2xl border border-slate-800 bg-slate-900/70 p-3 shadow-2xl backdrop-blur-xl sm:p-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
              <div className="h-3 w-3 rounded-full bg-yellow-500/80"></div>
              <div className="h-3 w-3 rounded-full bg-emerald-500/80"></div>
              <span className="ml-2 text-xs font-mono text-slate-400">cloudroom.io/join/DRAGONSPACE</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                <span>3 Devices Active</span>
              </span>
              <span>·</span>
              <span>50 GB Cloud</span>
            </div>
          </div>

          {/* Grid Preview Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {/* Card 1: Devices */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  <Smartphone className="h-4 w-4" />
                  <span>Device Mesh</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">Auto-Detect</span>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between rounded-lg bg-slate-900/60 p-2.5 border border-slate-800/60">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                    <div>
                      <div className="text-xs font-medium text-white">Ahmad's MacBook Pro M3</div>
                      <div className="text-[10px] text-slate-400">macOS · Owner · Online</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">Master</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-900/60 p-2.5 border border-slate-800/60">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                    <div>
                      <div className="text-xs font-medium text-white">Samsung Galaxy S24 Ultra</div>
                      <div className="text-[10px] text-slate-400">Android 14 · Member · Online</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Synced</span>
                </div>
              </div>
            </div>

            {/* Card 2: Shared Storage */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  <HardDrive className="h-4 w-4" />
                  <span>Cloud Storage</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">Live Sync</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-slate-900/60 p-2 border border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <div className="rounded bg-cyan-950 p-1 text-cyan-400">
                      <Cloud className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="text-xs text-white truncate max-w-[130px]">Platform_Specification.pdf</div>
                      <div className="text-[10px] text-slate-400">4.2 MB · 9 mins ago</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono">Stream Ready</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-900/60 p-2 border border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <div className="rounded bg-indigo-950 p-1 text-indigo-400">
                      <HardDrive className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="text-xs text-white truncate max-w-[130px]">Projects & Schematics/</div>
                      <div className="text-[10px] text-slate-400">Directory · 2 items</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Folder</span>
                </div>
              </div>
            </div>

            {/* Card 3: Realtime Clipboard & Chat */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  <Clipboard className="h-4 w-4" />
                  <span>Shared Clipboard</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400">1-Click Copy</span>
              </div>
              <div className="rounded-lg bg-slate-900/80 p-2.5 border border-slate-800/80">
                <div className="text-[11px] font-mono text-slate-300 break-all bg-black/40 p-1.5 rounded">
                  ssh root@192.168.1.120 -p 2204
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Sent from MacBook Pro</span>
                  <span className="text-cyan-400">Copied to Clipboard</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Core Pillars Feature Grid */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Engineered for Power, Privacy, and Speed
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Everything you need to turn multiple fragmented devices into a cohesive, private digital powerhouse.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition-all hover:border-slate-700 hover:bg-slate-900/70">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/50 mb-5">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Private Rooms with 6-Digit PIN</h3>
              <p className="mt-2.5 text-xs text-slate-300 leading-relaxed">
                Unique global room names, instant invite links, and brute-force protected 6-digit access codes with 15-minute lockouts.
              </p>
              <div className="mt-4 flex flex-col gap-1.5 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Unique global slug identifier</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                  <span>SHA-256 hashed credentials</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition-all hover:border-slate-700 hover:bg-slate-900/70">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-950/80 text-indigo-400 border border-indigo-800/50 mb-5">
                <HardDrive className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Multi-Device Cloud Storage</h3>
              <p className="mt-2.5 text-xs text-slate-300 leading-relaxed">
                Drag-and-drop batch file uploads, nested directory trees, live previews for images, videos, audio & PDFs, plus 30-day trash retention.
              </p>
              <div className="mt-4 flex flex-col gap-1.5 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Streaming previews and downloads</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Expiring temporary public share links</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition-all hover:border-slate-700 hover:bg-slate-900/70">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 mb-5">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Realtime Sync & Device Mesh</h3>
              <p className="mt-2.5 text-xs text-slate-300 leading-relaxed">
                Synchronized clipboard, collaborative notes pad, in-room encrypted messaging, and instant device telemetry monitoring.
              </p>
              <div className="mt-4 flex flex-col gap-1.5 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>SSE live event push</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Device kick & role management</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
