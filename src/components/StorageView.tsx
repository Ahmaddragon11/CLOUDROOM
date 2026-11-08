import React, { useState, useRef } from 'react';
import { 
  Cloud, 
  Folder, 
  FolderPlus, 
  Upload, 
  Search, 
  Grid, 
  List, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Music, 
  FileCode, 
  Archive, 
  MoreVertical, 
  Download, 
  Eye, 
  Share2, 
  Trash2, 
  Edit2, 
  CornerDownRight, 
  ChevronRight, 
  Home, 
  RotateCcw,
  Sparkles,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import type { RoomData, FileItem, FolderItem, DeviceInfo, UserRole } from '../types/cloudroom.ts';
import { formatBytes, categorizeFile, checkPermission } from '../utils/rules.ts';

interface StorageViewProps {
  room: RoomData;
  currentDevice: DeviceInfo | null;
  currentRole: UserRole;
  onUploadFiles: (files: File[], folderId: string | null) => Promise<void>;
  onDownloadFile: (file: FileItem) => void;
  onPreviewFile: (file: FileItem) => void;
  onRenameFile: (file: FileItem, newName: string) => Promise<void>;
  onMoveFile: (file: FileItem, targetFolderId: string | null) => Promise<void>;
  onDeleteFile: (file: FileItem) => Promise<void>;
  onRestoreFile: (file: FileItem) => Promise<void>;
  onCreateFolder: (name: string, parentId: string | null) => Promise<void>;
  onCreateShareLink: (file: FileItem) => void;
  isUploading: boolean;
  uploadProgress: number;
}

export const StorageView: React.FC<StorageViewProps> = ({
  room,
  currentDevice,
  currentRole,
  onUploadFiles,
  onDownloadFile,
  onPreviewFile,
  onRenameFile,
  onMoveFile,
  onDeleteFile,
  onRestoreFile,
  onCreateFolder,
  onCreateShareLink,
  isUploading,
  uploadProgress,
}) => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showTrash, setShowTrash] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Modals state
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [renamingFile, setRenamingFile] = useState<FileItem | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [movingFile, setMovingFile] = useState<FileItem | null>(null);
  const [targetMoveFolderId, setTargetMoveFolderId] = useState<string>('root');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const canUpload = checkPermission(currentRole, 'upload');
  const canDelete = checkPermission(currentRole, 'delete');

  // Breadcrumbs calculation
  const getBreadcrumbs = () => {
    const crumbs: { id: string | null; name: string }[] = [{ id: null, name: 'Cloud Root' }];
    if (!currentFolderId) return crumbs;

    let currId: string | null = currentFolderId;
    const pathList: FolderItem[] = [];

    while (currId) {
      const folder = room.folders.find((f) => f.id === currId);
      if (folder) {
        pathList.unshift(folder);
        currId = folder.parentId;
      } else {
        break;
      }
    }

    pathList.forEach((f) => crumbs.push({ id: f.id, name: f.name }));
    return crumbs;
  };

  // Filter and sort items
  const activeFolders = room.folders.filter((f) => f.parentId === currentFolderId && !showTrash);

  let displayedFiles = room.files.filter((f) => {
    if (showTrash) return f.isDeleted;
    if (f.isDeleted) return false;
    return f.folderId === currentFolderId;
  });

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    displayedFiles = room.files.filter(
      (f) => (!showTrash ? !f.isDeleted : f.isDeleted) && f.name.toLowerCase().includes(q)
    );
  }

  if (categoryFilter !== 'all') {
    displayedFiles = displayedFiles.filter((f) => categorizeFile(f.mimeType, f.name) === categoryFilter);
  }

  displayedFiles.sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === 'date') {
      comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
    } else if (sortBy === 'size') {
      comparison = a.sizeBytes - b.sizeBytes;
    } else if (sortBy === 'type') {
      comparison = a.mimeType.localeCompare(b.mimeType);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (canUpload) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (!canUpload) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      await onUploadFiles(filesArray, currentFolderId);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      await onUploadFiles(filesArray, currentFolderId);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await onCreateFolder(newFolderName.trim(), currentFolderId);
    setNewFolderName('');
    setShowNewFolderModal(false);
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingFile || !newFileName.trim()) return;
    await onRenameFile(renamingFile, newFileName.trim());
    setRenamingFile(null);
  };

  const handleMoveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movingFile) return;
    const target = targetMoveFolderId === 'root' ? null : targetMoveFolderId;
    await onMoveFile(movingFile, target);
    setMovingFile(null);
  };

  // Icon Resolver
  const getFileIcon = (mimeType: string, filename: string) => {
    const cat = categorizeFile(mimeType, filename);
    switch (cat) {
      case 'images':
        return <ImageIcon className="h-6 w-6 text-cyan-400" />;
      case 'videos':
        return <Video className="h-6 w-6 text-purple-400" />;
      case 'audio':
        return <Music className="h-6 w-6 text-pink-400" />;
      case 'code':
        return <FileCode className="h-6 w-6 text-emerald-400" />;
      case 'archives':
        return <Archive className="h-6 w-6 text-amber-400" />;
      default:
        return <FileText className="h-6 w-6 text-sky-400" />;
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative min-h-[600px] space-y-6 rounded-2xl transition-all ${
        isDragOver ? 'ring-2 ring-cyan-500 bg-cyan-950/20' : ''
      }`}
    >
      {/* Hidden file input for batch upload */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Upload Drag Overlay Banner */}
      {isDragOver && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-2xl bg-cyan-950/80 backdrop-blur-md border-2 border-dashed border-cyan-400">
          <Upload className="h-12 w-12 text-cyan-300 animate-bounce mb-3" />
          <h3 className="text-lg font-bold text-white">Drop files to upload instantly</h3>
          <p className="text-xs text-cyan-200 mt-1">Multi-file batch upload into current directory</p>
        </div>
      )}

      {/* Top Action Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Cloud className="h-5 w-5 text-cyan-400" />
            <span>Shared Cloud Storage</span>
            {showTrash && (
              <span className="rounded bg-red-950/70 border border-red-800 px-2 py-0.5 text-xs text-red-300">
                Trash Bin (30-day Retention)
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Distributed storage space accessible to all authorized devices in this room
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canUpload && !showTrash && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-95 cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload Files</span>
              </button>

              <button
                onClick={() => setShowNewFolderModal(true)}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-700 active:scale-95 cursor-pointer"
              >
                <FolderPlus className="h-3.5 w-3.5 text-cyan-400" />
                <span>New Folder</span>
              </button>
            </>
          )}

          <button
            onClick={() => setShowTrash(!showTrash)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
              showTrash
                ? 'border-red-500/50 bg-red-950/40 text-red-300'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{showTrash ? 'Exit Trash' : 'Trash'}</span>
          </button>
        </div>
      </div>

      {/* Upload Progress Bar if active */}
      {isUploading && (
        <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/30 p-3.5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-cyan-300 mb-2">
            <span className="font-medium flex items-center gap-2">
              <Upload className="h-3.5 w-3.5 animate-spin" />
              <span>Uploading files to CloudRoom...</span>
            </span>
            <span className="font-mono font-semibold">{uploadProgress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Breadcrumbs Navigation & Search/Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Breadcrumb path */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs text-slate-400 min-w-0">
          {getBreadcrumbs().map((crumb, idx, arr) => (
            <React.Fragment key={crumb.id || 'root'}>
              <button
                onClick={() => {
                  setCurrentFolderId(crumb.id);
                  setShowTrash(false);
                }}
                className={`flex items-center gap-1 rounded px-2 py-1 transition-colors hover:text-white ${
                  idx === arr.length - 1 ? 'font-semibold text-cyan-300 bg-slate-800/60' : ''
                }`}
              >
                {idx === 0 && <Home className="h-3 w-3" />}
                <span>{crumb.name}</span>
              </button>
              {idx < arr.length - 1 && <ChevronRight className="h-3 w-3 text-slate-600 shrink-0" />}
            </React.Fragment>
          ))}
        </div>

        {/* Search, Filter, Sort & View mode */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-40 sm:w-52 rounded-xl border border-slate-800 bg-slate-900/80 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="images">Images</option>
            <option value="videos">Videos</option>
            <option value="audio">Audio</option>
            <option value="documents">Documents</option>
            <option value="code">Code & Data</option>
            <option value="archives">Archives</option>
          </select>

          {/* Sort Selector */}
          <div className="flex items-center gap-1 bg-slate-900/80 rounded-xl border border-slate-800 p-0.5">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent px-2 py-1 text-xs text-slate-300 focus:outline-none"
            >
              <option value="date" className="bg-slate-900">Date</option>
              <option value="name" className="bg-slate-900">Name</option>
              <option value="size" className="bg-slate-900">Size</option>
              <option value="type" className="bg-slate-900">Type</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 text-slate-400 hover:text-white"
              title="Toggle Sort Order"
            >
              <ArrowUpDown className="h-3 w-3" />
            </button>
          </div>

          {/* Grid / List View Toggle */}
          <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/80 p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <Grid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="List View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Directory Folders Section (if not in trash) */}
      {!showTrash && activeFolders.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Folders</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {activeFolders.map((folder) => {
              const fileCount = room.files.filter((f) => f.folderId === folder.id && !f.isDeleted).length;
              return (
                <div
                  key={folder.id}
                  onClick={() => setCurrentFolderId(folder.id)}
                  className="group flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 transition-all hover:border-cyan-500/50 hover:bg-slate-800/50 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Folder className="h-6 w-6 text-cyan-400 group-hover:scale-105 transition-transform" />
                    <span className="text-[10px] font-mono text-slate-500">{fileCount} files</span>
                  </div>
                  <div className="text-xs font-semibold text-white truncate">{folder.name}</div>
                  <div className="text-[10px] text-slate-400 mt-1 truncate">By {folder.createdByDeviceName}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Files Section */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
          <span>Files ({displayedFiles.length})</span>
          {showTrash && (
            <span className="text-[11px] text-slate-400 font-normal">
              Deleted items remain available for restoration
            </span>
          )}
        </div>

        {displayedFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 py-16 text-center">
            <Cloud className="h-10 w-10 text-slate-600 mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">
              {showTrash ? 'Trash bin is empty' : 'No files in this folder'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {showTrash
                ? 'Files deleted from your CloudRoom will show here for up to 30 days.'
                : 'Drag and drop any documents, images, videos or code files here, or use the Upload button.'}
            </p>
            {canUpload && !showTrash && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-xs font-medium text-cyan-400 hover:bg-slate-700"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload Now</span>
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayedFiles.map((file) => (
              <div
                key={file.id}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 transition-all hover:border-slate-700 hover:bg-slate-900/90 hover:shadow-xl"
              >
                {/* Header Icon + Actions */}
                <div className="flex items-start justify-between">
                  <div 
                    onClick={() => onPreviewFile(file)}
                    className="cursor-pointer p-2 rounded-lg bg-slate-800/80 group-hover:bg-slate-800 transition-colors"
                  >
                    {getFileIcon(file.mimeType, file.name)}
                  </div>

                  <div className="flex items-center gap-1">
                    {!showTrash ? (
                      <>
                        <button
                          onClick={() => onPreviewFile(file)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                          title="Preview"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDownloadFile(file)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                          title="Download"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onCreateShareLink(file)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition-colors"
                          title="Generate Expiring Public Share Link"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setRenamingFile(file);
                            setNewFileName(file.name);
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                          title="Rename"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => onDeleteFile(file)}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                            title="Move to Trash"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => onRestoreFile(file)}
                        className="flex items-center gap-1 rounded-lg bg-slate-800 px-2 py-1 text-xs text-emerald-400 hover:bg-slate-700"
                        title="Restore file"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Restore</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* File Details */}
                <div 
                  onClick={() => onPreviewFile(file)}
                  className="mt-3 cursor-pointer"
                >
                  <div className="text-xs font-semibold text-white truncate" title={file.name}>
                    {file.name}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{formatBytes(file.sizeBytes)}</span>
                    <span className="font-mono text-[10px] text-slate-500">
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Uploader Meta */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="truncate">From {file.uploadedByDeviceName}</span>
                  <span className="shrink-0">{file.downloadCount} DLs</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <div className="col-span-5 sm:col-span-4">File Name</div>
              <div className="col-span-2 hidden sm:block">Uploader Device</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-2 hidden sm:block">Date</div>
              <div className="col-span-5 sm:col-span-2 text-right">Actions</div>
            </div>

            <div className="divide-y divide-slate-800/60">
              {displayedFiles.map((file) => (
                <div
                  key={file.id}
                  className="grid grid-cols-12 gap-3 items-center px-4 py-3 hover:bg-slate-800/40 transition-colors text-xs"
                >
                  <div 
                    onClick={() => onPreviewFile(file)}
                    className="col-span-5 sm:col-span-4 flex items-center gap-2.5 min-w-0 cursor-pointer"
                  >
                    <div className="shrink-0">{getFileIcon(file.mimeType, file.name)}</div>
                    <span className="text-white font-medium truncate" title={file.name}>
                      {file.name}
                    </span>
                  </div>

                  <div className="col-span-2 hidden sm:block text-slate-400 truncate">
                    {file.uploadedByDeviceName}
                  </div>

                  <div className="col-span-2 text-slate-300 font-mono text-[11px]">
                    {formatBytes(file.sizeBytes)}
                  </div>

                  <div className="col-span-2 hidden sm:block text-slate-400 text-[11px]">
                    {new Date(file.uploadedAt).toLocaleDateString()}
                  </div>

                  <div className="col-span-5 sm:col-span-2 flex items-center justify-end gap-1">
                    {!showTrash ? (
                      <>
                        <button
                          onClick={() => onPreviewFile(file)}
                          className="p-1 text-slate-400 hover:text-cyan-300"
                          title="Preview"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDownloadFile(file)}
                          className="p-1 text-slate-400 hover:text-indigo-300"
                          title="Download"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onCreateShareLink(file)}
                          className="p-1 text-slate-400 hover:text-emerald-300"
                          title="Share Link"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => onDeleteFile(file)}
                            className="p-1 text-slate-400 hover:text-red-400"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => onRestoreFile(file)}
                        className="flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-xs text-emerald-400 hover:bg-slate-700"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Restore</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
            <h3 className="text-sm font-semibold text-white mb-3">Create New Directory</h3>
            <form onSubmit={handleCreateFolderSubmit} className="space-y-4">
              <input
                type="text"
                autoFocus
                required
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name (e.g. Schematics, Invoices)"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="rounded-xl px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename File Modal */}
      {renamingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
            <h3 className="text-sm font-semibold text-white mb-3">Rename File</h3>
            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <input
                type="text"
                autoFocus
                required
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenamingFile(null)}
                  className="rounded-xl px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500"
                >
                  Save Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
