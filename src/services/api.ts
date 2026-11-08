import type { 
  RoomData, 
  DeviceInfo, 
  FileItem, 
  FolderItem, 
  ChatMessage, 
  ClipboardItem, 
  RoomNote, 
  TemporaryShareLink,
  UserRole 
} from '../types/cloudroom.ts';
import { detectDevicePlatform } from '../utils/rules.ts';

const DEVICE_ID_KEY = 'cloudroom_device_id';
const DEVICE_NAME_KEY = 'cloudroom_device_name';
const ACTIVE_ROOM_KEY = 'cloudroom_active_room_id';

export function getClientDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getClientDeviceName(): string {
  let name = localStorage.getItem(DEVICE_NAME_KEY);
  if (!name) {
    const platform = detectDevicePlatform(navigator.userAgent);
    const platformLabel = platform.charAt(0).toUpperCase() + platform.slice(1);
    name = `My ${platformLabel} Device`;
    localStorage.setItem(DEVICE_NAME_KEY, name);
  }
  return name;
}

export function setClientDeviceName(name: string): void {
  localStorage.setItem(DEVICE_NAME_KEY, name);
}

export function getStoredActiveRoomId(): string | null {
  return localStorage.getItem(ACTIVE_ROOM_KEY);
}

export function setStoredActiveRoomId(roomId: string | null): void {
  if (roomId) {
    localStorage.setItem(ACTIVE_ROOM_KEY, roomId);
  } else {
    localStorage.removeItem(ACTIVE_ROOM_KEY);
  }
}

// API Methods
export async function checkRoomName(name: string): Promise<{ available: boolean; slug: string }> {
  const res = await fetch(`/api/rooms/check-name/${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error('Failed to verify room name');
  return res.json();
}

export async function createRoom(params: {
  name: string;
  pin: string;
  deviceName?: string;
}): Promise<{ room: RoomData; currentDevice: DeviceInfo; role: UserRole }> {
  const deviceName = params.deviceName || getClientDeviceName();
  const devicePlatform = detectDevicePlatform(navigator.userAgent);

  const res = await fetch('/api/rooms/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: params.name,
      pin: params.pin,
      deviceName,
      devicePlatform,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create room');

  setStoredActiveRoomId(data.room.id);
  setClientDeviceName(deviceName);
  return data;
}

export async function joinRoom(params: {
  identifier: string;
  pin: string;
  deviceName?: string;
}): Promise<{ room: RoomData; currentDevice: DeviceInfo; role: UserRole }> {
  const deviceName = params.deviceName || getClientDeviceName();
  const devicePlatform = detectDevicePlatform(navigator.userAgent);
  const existingDeviceId = getClientDeviceId();

  const res = await fetch('/api/rooms/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: params.identifier,
      pin: params.pin,
      deviceName,
      devicePlatform,
      existingDeviceId,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to join room');

  setStoredActiveRoomId(data.room.id);
  setClientDeviceName(deviceName);
  return data;
}

export async function fetchRoomData(roomId: string): Promise<RoomData> {
  const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}`);
  if (!res.ok) throw new Error('Room not found or inaccessible');
  return res.json();
}

export async function uploadFiles(
  roomId: string,
  files: File[],
  folderId: string | null,
  uploaderDeviceId: string,
  uploaderRole: UserRole,
  onProgress?: (percent: number) => void
): Promise<FileItem[]> {
  const formData = new FormData();
  for (const f of files) {
    formData.append('files', f);
  }
  if (folderId) formData.append('folderId', folderId);
  formData.append('uploaderDeviceId', uploaderDeviceId);
  formData.append('uploaderRole', uploaderRole);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/rooms/${encodeURIComponent(roomId)}/files`);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const percent = Math.round((evt.loaded / evt.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          resolve(json.files);
        } catch (e) {
          reject(new Error('Invalid response from server'));
        }
      } else {
        try {
          const json = JSON.parse(xhr.responseText);
          reject(new Error(json.error || 'Upload failed'));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
}

export function getFileDownloadUrl(roomId: string, fileId: string): string {
  return `/api/rooms/${encodeURIComponent(roomId)}/files/${encodeURIComponent(fileId)}/download`;
}

export function getFileStreamUrl(fileName: string): string {
  return `/uploads/${encodeURIComponent(fileName)}`;
}

export async function renameFile(roomId: string, fileId: string, name: string): Promise<FileItem> {
  const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/files/${encodeURIComponent(fileId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to rename file');
  return data.file;
}

export async function moveFile(roomId: string, fileId: string, folderId: string | null): Promise<FileItem> {
  const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/files/${encodeURIComponent(fileId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folderId: folderId || 'null' }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to move file');
  return data.file;
}

export async function deleteFile(roomId: string, fileId: string, deviceId: string, deviceName: string): Promise<void> {
  const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, deviceName }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to delete file');
  }
}

export async function restoreFile(roomId: string, fileId: string, deviceId: string, deviceName: string): Promise<FileItem> {
  const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/files/${encodeURIComponent(fileId)}/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, deviceName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to restore file');
  return data.file;
}

export async function createFolder(
  roomId: string,
  name: string,
  parentId: string | null,
  deviceId: string,
  deviceName: string,
  color?: string
): Promise<FolderItem> {
  const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, parentId, deviceId, deviceName, color }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create folder');
  return data.folder;
}

export async function broadcastClipboard(
  roomId: string,
  content: string,
  deviceId: string,
  deviceName: string,
  pinned?: boolean
): Promise<ClipboardItem> {
  const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/clipboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, deviceId, deviceName, pinned }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to sync clipboard');
  return data.item;
}

export async function sendChatMessage(
  roomId: string,
  text: string,
  deviceId: string,
  deviceName: string,
  role: UserRole,
  fileAttachment?: { id: string; name: string; sizeBytes: number; mimeType: string }
): Promise<ChatMessage> {
  const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, deviceId, deviceName, role, fileAttachment }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send message');
  return data.message;
}

export async function saveNote(
  roomId: string,
  id: string,
  title: string,
  content: string,
  deviceId: string,
  deviceName: string
): Promise<RoomNote> {
  const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/notes`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, title, content, deviceId, deviceName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save note');
  return data.note;
}

export async function createTemporaryShareLink(
  roomId: string,
  payload: { fileId: string; expiryHours: number; password?: string; maxDownloads?: number; deviceId: string }
): Promise<TemporaryShareLink> {
  const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create share link');
  return data.shareLink;
}

export async function renameDevice(roomId: string, deviceId: string, name: string): Promise<DeviceInfo> {
  const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/devices/${encodeURIComponent(deviceId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to rename device');
  return data.device;
}

export async function kickDevice(roomId: string, deviceId: string): Promise<void> {
  const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/devices/${encodeURIComponent(deviceId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to remove device');
  }
}

export async function updateRoomSettings(
  roomId: string,
  payload: {
    newPin?: string;
    currentPin?: string;
    quotaBytes?: number;
    settings?: Partial<RoomData['settings']>;
    deviceId: string;
    deviceName: string;
  }
): Promise<RoomData> {
  const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update settings');
  return data.room;
}

export function subscribeToRoomEvents(
  roomId: string,
  deviceId: string,
  onEvent: (event: string, data: any) => void
): () => void {
  const eventSource = new EventSource(`/api/rooms/${encodeURIComponent(roomId)}/events?deviceId=${encodeURIComponent(deviceId)}`);

  const eventTypes = [
    'connected',
    'device_joined',
    'device_status',
    'device_renamed',
    'device_kicked',
    'files_uploaded',
    'file_updated',
    'file_deleted',
    'file_restored',
    'folder_created',
    'clipboard_new',
    'chat_message',
    'note_updated',
    'settings_updated',
  ];

  for (const t of eventTypes) {
    eventSource.addEventListener(t, (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        onEvent(t, parsed);
      } catch (err) {
        console.error('Failed to parse SSE event data', err);
      }
    });
  }

  return () => {
    eventSource.close();
  };
}
