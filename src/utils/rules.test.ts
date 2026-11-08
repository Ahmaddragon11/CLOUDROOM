import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePinFormat,
  generateRoomSlug,
  checkPinRateLimit,
  checkPermission,
  calculateStorageUsage,
  formatBytes,
  categorizeFile,
  detectDevicePlatform,
} from './rules.ts';

test('validatePinFormat validates strictly 6 digit numbers', () => {
  assert.equal(validatePinFormat('123456'), true);
  assert.equal(validatePinFormat('482913'), true);
  assert.equal(validatePinFormat('12345'), false);
  assert.equal(validatePinFormat('1234567'), false);
  assert.equal(validatePinFormat('12345a'), false);
  assert.equal(validatePinFormat(''), false);
});

test('generateRoomSlug normalizes alphanumeric room slugs', () => {
  assert.equal(generateRoomSlug('DRAGON SPACE'), 'DRAGONSPACE');
  assert.equal(generateRoomSlug('My-Room #1!'), 'MYROOM1');
  assert.equal(generateRoomSlug(''), 'ROOM');
});

test('checkPinRateLimit enforces lockout after maximum attempts', () => {
  const allowed = checkPinRateLimit(2, Date.now(), 5);
  assert.equal(allowed.allowed, true);
  assert.equal(allowed.attemptsRemaining, 3);

  const locked = checkPinRateLimit(5, Date.now() - 1000, 5, 60000);
  assert.equal(locked.allowed, false);
  assert.equal(locked.attemptsRemaining, 0);
  assert.ok((locked.lockoutSecondsRemaining ?? 0) > 0);

  const expired = checkPinRateLimit(5, Date.now() - 70000, 5, 60000);
  assert.equal(expired.allowed, true);
});

test('checkPermission handles RBAC roles properly', () => {
  assert.equal(checkPermission('owner', 'manage_settings'), true);
  assert.equal(checkPermission('admin', 'manage_settings'), false);

  assert.equal(checkPermission('admin', 'delete'), true);
  assert.equal(checkPermission('member', 'delete'), false);

  assert.equal(checkPermission('member', 'upload'), true);
  assert.equal(checkPermission('viewer', 'upload'), false);

  assert.equal(checkPermission('viewer', 'view'), true);
});

test('calculateStorageUsage computes quota and usage correctly', () => {
  const files = [
    { sizeBytes: 1024 * 1024 * 50, isDeleted: false }, // 50MB
    { sizeBytes: 1024 * 1024 * 25, isDeleted: false }, // 25MB
    { sizeBytes: 1024 * 1024 * 100, isDeleted: true }, // deleted, ignored
  ];
  const quota = 1024 * 1024 * 100; // 100MB
  const result = calculateStorageUsage(files, quota);

  assert.equal(result.usedBytes, 75 * 1024 * 1024);
  assert.equal(result.percentage, 75.0);
  assert.equal(result.isNearQuota, false);
  assert.equal(result.isOverQuota, false);
});

test('formatBytes produces readable strings', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(1024 * 1024 * 5), '5 MB');
});

test('categorizeFile accurately groups extensions and mime types', () => {
  assert.equal(categorizeFile('image/png', 'photo.png'), 'images');
  assert.equal(categorizeFile('video/mp4', 'demo.mp4'), 'videos');
  assert.equal(categorizeFile('application/pdf', 'doc.pdf'), 'documents');
  assert.equal(categorizeFile('text/typescript', 'app.tsx'), 'code');
  assert.equal(categorizeFile('application/zip', 'backup.zip'), 'archives');
});

test('detectDevicePlatform detects OS correctly', () => {
  assert.equal(detectDevicePlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'), 'mac');
  assert.equal(detectDevicePlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64)'), 'windows');
  assert.equal(detectDevicePlatform('Mozilla/5.0 (Linux; Android 14; SM-S928B)'), 'android');
  assert.equal(detectDevicePlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'), 'ios');
});
