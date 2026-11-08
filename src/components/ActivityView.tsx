import React, { useState } from 'react';
import { 
  Activity, 
  Smartphone, 
  Cloud, 
  FolderPlus, 
  Trash2, 
  RotateCcw, 
  Clipboard, 
  ShieldAlert, 
  MessageSquare, 
  UserMinus,
  Sparkles,
  Filter
} from 'lucide-react';
import type { RoomData, ActivityEvent } from '../types/cloudroom.ts';

interface ActivityViewProps {
  room: RoomData;
}

export const ActivityView: React.FC<ActivityViewProps> = ({ room }) => {
  const [filterType, setFilterType] = useState<string>('all');

  const getEventIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'device_join':
        return <Smartphone className="h-4 w-4 text-emerald-400" />;
      case 'device_kick':
      case 'device_leave':
        return <UserMinus className="h-4 w-4 text-red-400" />;
      case 'file_upload':
        return <Cloud className="h-4 w-4 text-cyan-400" />;
      case 'file_delete':
        return <Trash2 className="h-4 w-4 text-rose-400" />;
      case 'file_restore':
        return <RotateCcw className="h-4 w-4 text-teal-400" />;
      case 'folder_create':
        return <FolderPlus className="h-4 w-4 text-indigo-400" />;
      case 'clipboard_send':
        return <Clipboard className="h-4 w-4 text-amber-400" />;
      case 'chat_message':
        return <MessageSquare className="h-4 w-4 text-blue-400" />;
      case 'pin_change':
      case 'role_change':
        return <ShieldAlert className="h-4 w-4 text-purple-400" />;
      default:
        return <Activity className="h-4 w-4 text-slate-400" />;
    }
  };

  const filtered = room.activities.filter((act) => {
    if (filterType === 'all') return true;
    if (filterType === 'devices') return act.type.includes('device');
    if (filterType === 'files') return act.type.includes('file') || act.type.includes('folder');
    if (filterType === 'clipboard') return act.type.includes('clipboard');
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header and Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Activity className="h-5 w-5 text-cyan-400" />
            <span>Room Live Activity Log</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time audit log of all events, device handshakes, and file transactions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>SSE Live Stream Active</span>
          </div>

          {/* Filter Pills */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">All Activities</option>
            <option value="devices">Devices Only</option>
            <option value="files">Files & Folders</option>
            <option value="clipboard">Clipboard</option>
          </select>
        </div>
      </div>

      {/* Activities Timeline */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No activities matching this filter.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-800">
            {filtered.map((act) => (
              <div key={act.id} className="relative group">
                {/* Event Bullet Node */}
                <div className="absolute -left-6 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 border border-slate-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
                </div>

                <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 transition-all hover:border-slate-700 hover:bg-slate-900/90">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-slate-900 text-slate-300">
                        {getEventIcon(act.type)}
                      </div>
                      <span className="text-xs font-semibold text-white">{act.title}</span>
                    </div>

                    <span className="text-[11px] font-mono text-slate-500">
                      {new Date(act.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-1 pl-7">{act.description}</p>

                  <div className="mt-2 pl-7 flex items-center gap-2 text-[10px] text-slate-500">
                    <Smartphone className="h-3 w-3 text-slate-400" />
                    <span>Device: {act.deviceName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
