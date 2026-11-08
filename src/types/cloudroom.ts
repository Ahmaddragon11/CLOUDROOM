export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export type DevicePlatform = 'windows' | 'mac' | 'linux' | 'android' | 'ios' | 'browser';

export interface DeviceInfo {
  id: string;
  name: string;
  platform: DevicePlatform;
  isOnline: boolean;
  lastSeen: string;
  ipAddress?: string;
  browser?: string;
  usedStorageBytes: number;
  joinedAt: string;
  isCurrentDevice?: boolean;
}

export interface FileItem {
  id: string;
  name: string;
  originalName: string;
  sizeBytes: number;
  mimeType: string;
  folderId: string | null; // null = root
  uploadedByDeviceId: string;
  uploadedByDeviceName: string;
  uploaderRole: UserRole;
  uploadedAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt?: string;
  path: string; // server relative path
  tags?: string[];
  downloadCount: number;
}

export interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  createdByDeviceId: string;
  createdByDeviceName: string;
  color?: string;
}

export interface ActivityEvent {
  id: string;
  type: 'device_join' | 'device_leave' | 'file_upload' | 'file_delete' | 'file_restore' | 'file_rename' | 'folder_create' | 'clipboard_send' | 'chat_message' | 'pin_change' | 'role_change' | 'device_kick';
  title: string;
  description: string;
  timestamp: string;
  deviceId: string;
  deviceName: string;
  metadata?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  senderDeviceId: string;
  senderDeviceName: string;
  senderRole: UserRole;
  text: string;
  fileAttachment?: {
    id: string;
    name: string;
    sizeBytes: number;
    mimeType: string;
  };
  timestamp: string;
}

export interface ClipboardItem {
  id: string;
  content: string;
  fromDeviceId: string;
  fromDeviceName: string;
  timestamp: string;
  pinned?: boolean;
}

export interface RoomNote {
  id: string;
  title: string;
  content: string;
  lastEditedByDeviceId: string;
  lastEditedByDeviceName: string;
  updatedAt: string;
}

export interface TemporaryShareLink {
  id: string;
  token: string;
  fileId: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  createdAt: string;
  expiresAt: string; // ISO timestamp
  passwordProtected: boolean;
  passwordHash?: string;
  downloadCount: number;
  maxDownloads?: number;
  isRevoked: boolean;
  createdByDeviceId: string;
}

export interface SecurityAuditEntry {
  id: string;
  action: string;
  status: 'success' | 'failed' | 'warning';
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface RoomData {
  id: string;
  name: string; // Unique global name
  slug: string; // Lowercase URL slug
  pinHash: string; // 6-digit hashed PIN
  createdAt: string;
  ownerDeviceId: string;
  quotaBytes: number; // e.g. 50GB
  usedBytes: number;
  devices: DeviceInfo[];
  files: FileItem[];
  folders: FolderItem[];
  activities: ActivityEvent[];
  chatMessages: ChatMessage[];
  clipboardItems: ClipboardItem[];
  notes: RoomNote[];
  temporaryShares: TemporaryShareLink[];
  securityAudits: SecurityAuditEntry[];
  settings: {
    allowMemberUpload: boolean;
    allowMemberDelete: boolean;
    requireApprovalForDevices: boolean;
    trashRetentionDays: number;
    clipboardAutoSync: boolean;
  };
}

export type ActiveView = 
  | 'dashboard'
  | 'storage'
  | 'devices'
  | 'chat'
  | 'clipboard'
  | 'notes'
  | 'analytics'
  | 'activity'
  | 'settings';
