import type { UserRole, DevicePlatform } from '../types/cloudroom.ts';

export interface RateLimitStatus {
  allowed: boolean;
  attemptsRemaining: number;
  lockoutSecondsRemaining?: number;
}

export function validatePinFormat(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

export function generateRoomSlug(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 32) || 'ROOM';
}

export function checkPinRateLimit(
  failedAttempts: number,
  lastFailedTimestamp: number,
  maxAttempts: number = 5,
  lockoutDurationMs: number = 15 * 60 * 1000 // 15 mins
): RateLimitStatus {
  const now = Date.now();
  if (failedAttempts >= maxAttempts) {
    const elapsed = now - lastFailedTimestamp;
    if (elapsed < lockoutDurationMs) {
      const remainingSecs = Math.ceil((lockoutDurationMs - elapsed) / 1000);
      return {
        allowed: false,
        attemptsRemaining: 0,
        lockoutSecondsRemaining: remainingSecs,
      };
    }
  }

  const remaining = Math.max(0, maxAttempts - failedAttempts);
  return {
    allowed: true,
    attemptsRemaining: remaining,
  };
}

export function checkPermission(
  role: UserRole,
  action: 'upload' | 'delete' | 'manage_devices' | 'manage_settings' | 'view'
): boolean {
  switch (action) {
    case 'view':
      return true; // All roles can view
    case 'upload':
      return role === 'owner' || role === 'admin' || role === 'member';
    case 'delete':
      return role === 'owner' || role === 'admin';
    case 'manage_devices':
      return role === 'owner' || role === 'admin';
    case 'manage_settings':
      return role === 'owner';
    default:
      return false;
  }
}

export function calculateStorageUsage(files: { sizeBytes: number; isDeleted: boolean }[], quotaBytes: number) {
  const usedBytes = files
    .filter((f) => !f.isDeleted)
    .reduce((sum, file) => sum + file.sizeBytes, 0);
  
  const percentage = quotaBytes > 0 ? Math.min(100, (usedBytes / quotaBytes) * 100) : 0;
  const remainingBytes = Math.max(0, quotaBytes - usedBytes);

  return {
    usedBytes,
    quotaBytes,
    remainingBytes,
    percentage: Number(percentage.toFixed(1)),
    isNearQuota: percentage >= 85,
    isOverQuota: usedBytes >= quotaBytes,
  };
}

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(dm))} ${sizes[idx]}`;
}

export type FileCategory = 'images' | 'videos' | 'audio' | 'documents' | 'code' | 'archives' | 'other';

export function categorizeFile(mimeType: string, filename: string): FileCategory {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) {
    return 'images';
  }
  if (mimeType.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) {
    return 'videos';
  }
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) {
    return 'audio';
  }
  if (
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('sheet') ||
    mimeType.includes('presentation') ||
    ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf'].includes(ext)
  ) {
    return 'documents';
  }
  if (
    mimeType.includes('json') ||
    mimeType.includes('javascript') ||
    mimeType.includes('typescript') ||
    mimeType.includes('html') ||
    ['json', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'py', 'sh', 'md', 'sql', 'yaml', 'yml'].includes(ext)
  ) {
    return 'code';
  }
  if (
    mimeType.includes('zip') ||
    mimeType.includes('tar') ||
    mimeType.includes('compressed') ||
    ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)
  ) {
    return 'archives';
  }
  return 'other';
}

export function detectDevicePlatform(userAgent: string): DevicePlatform {
  const ua = userAgent.toLowerCase();
  if (ua.includes('android')) return 'android';
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) return 'ios';
  if (ua.includes('macintosh') || ua.includes('mac os')) return 'mac';
  if (ua.includes('windows')) return 'windows';
  if (ua.includes('linux')) return 'linux';
  return 'browser';
}
