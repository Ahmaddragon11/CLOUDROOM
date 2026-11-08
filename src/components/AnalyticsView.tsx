import React from 'react';
import { BarChart3, HardDrive, FileText, Folder, Smartphone, PieChart, TrendingUp, AlertTriangle } from 'lucide-react';
import type { RoomData } from '../types/cloudroom.ts';
import { calculateStorageUsage, formatBytes, categorizeFile, FileCategory } from '../utils/rules.ts';

interface AnalyticsViewProps {
  room: RoomData;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ room }) => {
  const stats = calculateStorageUsage(room.files, room.quotaBytes);
  const activeFiles = room.files.filter((f) => !f.isDeleted);

  // Group files by category
  const categories: Record<FileCategory, { count: number; bytes: number }> = {
    images: { count: 0, bytes: 0 },
    videos: { count: 0, bytes: 0 },
    audio: { count: 0, bytes: 0 },
    documents: { count: 0, bytes: 0 },
    code: { count: 0, bytes: 0 },
    archives: { count: 0, bytes: 0 },
    other: { count: 0, bytes: 0 },
  };

  for (const f of activeFiles) {
    const cat = categorizeFile(f.mimeType, f.name);
    categories[cat].count += 1;
    categories[cat].bytes += f.sizeBytes;
  }

  // Sorted largest files
  const largestFiles = [...activeFiles].sort((a, b) => b.sizeBytes - a.sizeBytes).slice(0, 5);

  const categoryColors: Record<FileCategory, string> = {
    images: 'from-cyan-400 to-cyan-500',
    videos: 'from-purple-400 to-purple-500',
    audio: 'from-pink-400 to-pink-500',
    documents: 'from-blue-400 to-blue-500',
    code: 'from-emerald-400 to-emerald-500',
    archives: 'from-amber-400 to-amber-500',
    other: 'from-slate-400 to-slate-500',
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="border-b border-slate-800 pb-5">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <BarChart3 className="h-5 w-5 text-indigo-400" />
          <span>Storage & Mesh Analytics</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Comprehensive telemetry of storage usage, file formats, and device consumption in {room.name}
        </p>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Storage Utilization</span>
            <HardDrive className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{formatBytes(stats.usedBytes)}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {stats.percentage}% of {formatBytes(room.quotaBytes)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Active Cloud Files</span>
            <FileText className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-300">{activeFiles.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across all folders</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Directories</span>
            <Folder className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300">{room.folders.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Organized folders</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Mesh Devices</span>
            <Smartphone className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">{room.devices.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {room.devices.filter((d) => d.isOnline).length} Active online
          </div>
        </div>
      </div>

      {/* Category Breakdown & Largest Files */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Bars */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-cyan-400" />
            <span>Storage by Content Category</span>
          </h3>

          <div className="space-y-3.5">
            {(Object.keys(categories) as FileCategory[]).map((cat) => {
              const data = categories[cat];
              const pct = stats.usedBytes > 0 ? (data.bytes / stats.usedBytes) * 100 : 0;

              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize text-slate-300 font-medium">{cat}</span>
                    <span className="font-mono text-slate-400">
                      {formatBytes(data.bytes)} ({pct.toFixed(1)}%) · {data.count} files
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full bg-gradient-to-r ${categoryColors[cat]} transition-all duration-500 rounded-full`}
                      style={{ width: `${Math.max(0.5, pct)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Largest Files Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-400" />
            <span>Largest Files in Storage</span>
          </h3>

          {largestFiles.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No files uploaded yet.</p>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {largestFiles.map((file, idx) => (
                <div key={file.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[10px] font-mono font-bold text-slate-500 w-4">{idx + 1}.</span>
                    <div className="truncate">
                      <div className="font-medium text-white truncate max-w-xs">{file.name}</div>
                      <div className="text-[10px] text-slate-400">By {file.uploadedByDeviceName}</div>
                    </div>
                  </div>
                  <span className="font-mono font-semibold text-cyan-300 shrink-0">
                    {formatBytes(file.sizeBytes)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Device Storage Allocation */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
        <h3 className="text-sm font-semibold text-white mb-3">Device Upload Contributions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {room.devices.map((device) => (
            <div key={device.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="text-xs font-semibold text-white truncate">{device.name}</div>
              <div className="text-[11px] text-slate-400 capitalize">{device.platform} OS</div>
              <div className="mt-2 text-sm font-bold font-mono text-cyan-400">
                {formatBytes(device.usedStorageBytes)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
