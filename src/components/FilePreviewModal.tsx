import React, { useState, useEffect } from 'react';
import { X, Download, Share2, FileText, Calendar, HardDrive, Smartphone, Eye, ExternalLink } from 'lucide-react';
import type { FileItem } from '../types/cloudroom.ts';
import { formatBytes, categorizeFile } from '../utils/rules.ts';
import { getFileDownloadUrl, getFileStreamUrl } from '../services/api.ts';

interface FilePreviewModalProps {
  file: FileItem | null;
  roomId: string;
  onClose: () => void;
  onDownload: (file: FileItem) => void;
  onShare: (file: FileItem) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  roomId,
  onClose,
  onDownload,
  onShare,
}) => {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoadingText, setIsLoadingText] = useState(false);

  useEffect(() => {
    if (file) {
      const category = categorizeFile(file.mimeType, file.name);
      if (category === 'code' || file.mimeType.startsWith('text/')) {
        setIsLoadingText(true);
        fetch(getFileStreamUrl(file.path))
          .then((res) => res.text())
          .then((txt) => setTextContent(txt.slice(0, 10000))) // first 10k chars
          .catch(() => setTextContent('Could not read text content.'))
          .finally(() => setIsLoadingText(false));
      } else {
        setTextContent(null);
      }
    }
  }, [file]);

  if (!file) return null;

  const category = categorizeFile(file.mimeType, file.name);
  const streamUrl = getFileStreamUrl(file.path);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-slate-950/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
              <Eye className="h-4 w-4" />
            </div>
            <div className="truncate">
              <h3 className="text-sm font-semibold text-white truncate max-w-md">{file.name}</h3>
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>{formatBytes(file.sizeBytes)}</span>
                <span>·</span>
                <span className="capitalize">{category}</span>
                <span>·</span>
                <span>{file.mimeType}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onShare(file)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white"
            >
              <Share2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Share Link</span>
            </button>
            <button
              onClick={() => onDownload(file)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:brightness-110"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-black/40 min-h-[300px]">
          {category === 'images' ? (
            <div className="max-h-[60vh] max-w-full flex items-center justify-center">
              <img
                src={streamUrl}
                alt={file.name}
                className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-2xl"
              />
            </div>
          ) : category === 'videos' ? (
            <div className="w-full max-w-2xl">
              <video
                controls
                src={streamUrl}
                className="w-full rounded-xl bg-black max-h-[60vh]"
              />
            </div>
          ) : category === 'audio' ? (
            <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-pink-950/60 border border-pink-800 flex items-center justify-center text-pink-400">
                <FileText className="h-8 w-8" />
              </div>
              <p className="text-sm font-semibold text-white mb-4">{file.name}</p>
              <audio controls src={streamUrl} className="w-full" />
            </div>
          ) : category === 'documents' && file.mimeType.includes('pdf') ? (
            <div className="w-full h-[60vh] rounded-xl overflow-hidden bg-slate-950">
              <iframe
                src={`${streamUrl}#toolbar=0`}
                title={file.name}
                className="w-full h-full border-0"
              />
            </div>
          ) : textContent !== null ? (
            <div className="w-full h-full max-h-[60vh] overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200">
              {isLoadingText ? 'Loading text...' : <pre>{textContent}</pre>}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/80 text-cyan-400 mb-4 border border-slate-700">
                <FileText className="h-8 w-8" />
              </div>
              <h4 className="text-base font-semibold text-white">{file.name}</h4>
              <p className="mt-1 text-xs text-slate-400 max-w-sm">
                Direct streaming preview is not supported for this file type ({file.mimeType}).
              </p>
              <button
                onClick={() => onDownload(file)}
                className="mt-4 flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Original File</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Metadata Strip */}
        <div className="border-t border-slate-800 px-5 py-3 bg-slate-950/70 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5 text-cyan-400" />
              <span>Uploaded by {file.uploadedByDeviceName}</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-indigo-400" />
              <span>{new Date(file.uploadedAt).toLocaleString()}</span>
            </span>
          </div>
          <div className="text-slate-500 font-mono text-[11px]">
            Downloads: {file.downloadCount}
          </div>
        </div>
      </div>
    </div>
  );
};
