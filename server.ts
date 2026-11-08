import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import type { 
  RoomData, 
  DeviceInfo, 
  FileItem, 
  FolderItem, 
  ActivityEvent, 
  ChatMessage, 
  ClipboardItem, 
  RoomNote, 
  TemporaryShareLink,
  SecurityAuditEntry,
  UserRole
} from './src/types/cloudroom.ts';
import { checkPinRateLimit, generateRoomSlug, formatBytes } from './src/utils/rules.ts';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Ensure data directories exist
const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Setup Multer for real file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const safeExt = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB per file max in dev
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically for direct previews
app.use('/uploads', express.static(UPLOADS_DIR));

// SSE connections map: roomId -> Set of Response objects
const sseClients = new Map<string, Set<{ res: Response; deviceId?: string }>>();

function broadcastRoomEvent(roomId: string, eventName: string, data: any) {
  const clients = sseClients.get(roomId);
  if (!clients || clients.size === 0) return;
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    try {
      client.res.write(payload);
    } catch (e) {
      clients.delete(client);
    }
  }
}

// In-Memory Database with JSON backing
interface DatabaseSchema {
  rooms: Record<string, RoomData>;
  rateLimits: Record<string, { failedAttempts: number; lastFailedTimestamp: number }>;
}

function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(pin).digest('hex');
}

function seedDatabase(): DatabaseSchema {
  const dragonRoomId = 'CR-DRAGON-8921';
  const ownerDeviceId = 'dev_mac_ahmad_01';
  const pin482913 = hashPin('482913');

  // Create sample dummy sample files on disk if not existing
  const samplePdfName = 'sample_whitepaper.pdf';
  const samplePdfPath = path.join(UPLOADS_DIR, samplePdfName);
  if (!fs.existsSync(samplePdfPath)) {
    fs.writeFileSync(samplePdfPath, '%PDF-1.4\n1 0 obj\n<< /Title (CLOUDROOM Whitepaper) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
  }

  const sampleDocName = 'architecture_overview.txt';
  const sampleDocPath = path.join(UPLOADS_DIR, sampleDocName);
  if (!fs.existsSync(sampleDocPath)) {
    fs.writeFileSync(sampleDocPath, 'CLOUDROOM ARCHITECTURE SPECIFICATION\n===================================\n- Zero Knowledge Rooms\n- Multi-Device Live Sync\n- Encrypted Storage\n- P2P Quick Share Protocol');
  }

  const now = new Date().toISOString();

  const initialRoom: RoomData = {
    id: dragonRoomId,
    name: 'DRAGON SPACE',
    slug: 'DRAGONSPACE',
    pinHash: pin482913,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    ownerDeviceId: ownerDeviceId,
    quotaBytes: 50 * 1024 * 1024 * 1024, // 50 GB
    usedBytes: 1024 * 1024 * 15 + 45000,
    devices: [
      {
        id: ownerDeviceId,
        name: "Ahmad's MacBook Pro M3",
        platform: 'mac',
        isOnline: true,
        lastSeen: now,
        ipAddress: '192.168.1.42',
        browser: 'Chrome 122 / macOS',
        usedStorageBytes: 1024 * 1024 * 15,
        joinedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: 'dev_samsung_s24',
        name: 'Samsung Galaxy S24 Ultra',
        platform: 'android',
        isOnline: true,
        lastSeen: now,
        ipAddress: '192.168.1.88',
        browser: 'Samsung Internet / Android 14',
        usedStorageBytes: 1024 * 512,
        joinedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
      {
        id: 'dev_linux_station',
        name: 'Dragon Linux Workstation',
        platform: 'linux',
        isOnline: false,
        lastSeen: new Date(Date.now() - 3600000 * 2).toISOString(),
        ipAddress: '10.0.0.15',
        browser: 'Firefox Developer / Ubuntu',
        usedStorageBytes: 0,
        joinedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      },
    ],
    folders: [
      {
        id: 'fld_projects',
        name: 'Projects & Schematics',
        parentId: null,
        createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
        createdByDeviceId: ownerDeviceId,
        createdByDeviceName: "Ahmad's MacBook Pro M3",
        color: '#06b6d4',
      },
      {
        id: 'fld_media',
        name: 'Media & Recordings',
        parentId: null,
        createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        createdByDeviceId: ownerDeviceId,
        createdByDeviceName: "Ahmad's MacBook Pro M3",
        color: '#818cf8',
      },
    ],
    files: [
      {
        id: 'file_spec_doc',
        name: 'CloudRoom_Platform_Specification.pdf',
        originalName: 'CloudRoom_Platform_Specification.pdf',
        sizeBytes: 1024 * 1024 * 4 + 250000,
        mimeType: 'application/pdf',
        folderId: 'fld_projects',
        uploadedByDeviceId: ownerDeviceId,
        uploadedByDeviceName: "Ahmad's MacBook Pro M3",
        uploaderRole: 'owner',
        uploadedAt: new Date(Date.now() - 3600000 * 9).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 9).toISOString(),
        isDeleted: false,
        path: samplePdfName,
        tags: ['Spec', 'V1.0', 'Confidential'],
        downloadCount: 4,
      },
      {
        id: 'file_arch_text',
        name: 'Architecture_Overview.txt',
        originalName: 'architecture_overview.txt',
        sizeBytes: 1024 * 24,
        mimeType: 'text/plain',
        folderId: 'fld_projects',
        uploadedByDeviceId: ownerDeviceId,
        uploadedByDeviceName: "Ahmad's MacBook Pro M3",
        uploaderRole: 'owner',
        uploadedAt: new Date(Date.now() - 3600000 * 7).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 7).toISOString(),
        isDeleted: false,
        path: sampleDocName,
        tags: ['Architecture', 'Notes'],
        downloadCount: 7,
      },
    ],
    activities: [
      {
        id: 'act_1',
        type: 'device_join',
        title: 'Device Connected',
        description: "Ahmad's MacBook Pro M3 joined room as Room Owner",
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        deviceId: ownerDeviceId,
        deviceName: "Ahmad's MacBook Pro M3",
      },
      {
        id: 'act_2',
        type: 'folder_create',
        title: 'Folder Created',
        description: 'Created folder "Projects & Schematics"',
        timestamp: new Date(Date.now() - 3600000 * 10).toISOString(),
        deviceId: ownerDeviceId,
        deviceName: "Ahmad's MacBook Pro M3",
      },
      {
        id: 'act_3',
        type: 'file_upload',
        title: 'File Uploaded',
        description: 'Uploaded "CloudRoom_Platform_Specification.pdf" (4.2 MB)',
        timestamp: new Date(Date.now() - 3600000 * 9).toISOString(),
        deviceId: ownerDeviceId,
        deviceName: "Ahmad's MacBook Pro M3",
      },
      {
        id: 'act_4',
        type: 'device_join',
        title: 'New Device Paired',
        description: 'Samsung Galaxy S24 Ultra authenticated into DRAGON SPACE',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        deviceId: 'dev_samsung_s24',
        deviceName: 'Samsung Galaxy S24 Ultra',
      },
    ],
    chatMessages: [
      {
        id: 'msg_1',
        senderDeviceId: ownerDeviceId,
        senderDeviceName: "Ahmad's MacBook Pro M3",
        senderRole: 'owner',
        text: 'Welcome to DRAGON SPACE! Feel free to sync your mobile device and drop your project schematics here.',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
      {
        id: 'msg_2',
        senderDeviceId: 'dev_samsung_s24',
        senderDeviceName: 'Samsung Galaxy S24 Ultra',
        senderRole: 'member',
        text: 'Connected successfully from mobile. Cloud sync and clipboard are working instantaneously!',
        timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
    ],
    clipboardItems: [
      {
        id: 'clip_1',
        content: 'https://cloudroom.io/join/DRAGONSPACE?code=482913',
        fromDeviceId: ownerDeviceId,
        fromDeviceName: "Ahmad's MacBook Pro M3",
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        pinned: true,
      },
      {
        id: 'clip_2',
        content: 'ssh root@192.168.1.120 -p 2204 # Production Gateway Node',
        fromDeviceId: ownerDeviceId,
        fromDeviceName: "Ahmad's MacBook Pro M3",
        timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
        pinned: false,
      },
    ],
    notes: [
      {
        id: 'note_main',
        title: '🚀 DRAGON SPACE Operational Directives',
        content: `## Welcome to DRAGON SPACE Private Cloud\n\nThis room serves as our unified multi-device workspace.\n\n### Key Guidelines:\n- **Storage Quota:** 50 GB allocated across all connected devices.\n- **Clipboard Sync:** Toggle auto-accept in the Clipboard tab to sync snippets.\n- **Public Sharing:** Generate expiring links for external collaborators.\n- **Trash Retention:** Deleted files can be restored for up to 30 days.`,
        lastEditedByDeviceId: ownerDeviceId,
        lastEditedByDeviceName: "Ahmad's MacBook Pro M3",
        updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
    ],
    temporaryShares: [],
    securityAudits: [
      {
        id: 'sec_1',
        action: 'Room Created',
        status: 'success',
        details: 'DRAGON SPACE initialized with 6-digit access PIN and owner credentials',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: 'sec_2',
        action: 'Device Authentication',
        status: 'success',
        details: 'Samsung Galaxy S24 Ultra joined room via PIN verification',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
    ],
    settings: {
      allowMemberUpload: true,
      allowMemberDelete: false,
      requireApprovalForDevices: false,
      trashRetentionDays: 30,
      clipboardAutoSync: true,
    },
  };

  return {
    rooms: {
      [dragonRoomId]: initialRoom,
    },
    rateLimits: {},
  };
}

let db: DatabaseSchema;
if (fs.existsSync(DB_FILE)) {
  try {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (err) {
    db = seedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  }
} else {
  db = seedDatabase();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Failed to save DB:', err);
  }
}

// Helper to find a room by Slug or ID
function findRoom(identifier: string): RoomData | undefined {
  const normalized = identifier.trim().toUpperCase();
  for (const r of Object.values(db.rooms)) {
    if (r.id.toUpperCase() === normalized || r.slug.toUpperCase() === normalized || r.name.toUpperCase() === normalized) {
      return r;
    }
  }
  return undefined;
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// 1. Check room name availability
app.get('/api/rooms/check-name/:name', (req: Request, res: Response) => {
  const name = req.params.name;
  const slug = generateRoomSlug(name);
  const existing = findRoom(slug);
  res.json({
    available: !existing,
    name,
    slug,
  });
});

// 2. Create Room
app.post('/api/rooms/create', (req: Request, res: Response) => {
  const { name, pin, deviceName, devicePlatform } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Room name is required' });
  }

  const slug = generateRoomSlug(name);
  if (findRoom(slug)) {
    return res.status(409).json({ error: 'A room with this name or slug already exists' });
  }

  if (!pin || !/^\d{6}$/.test(pin)) {
    return res.status(400).json({ error: 'A valid 6-digit PIN is required' });
  }

  const roomId = `CR-${slug}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const ownerDeviceId = `dev_${crypto.randomBytes(6).toString('hex')}`;
  const now = new Date().toISOString();

  const newRoom: RoomData = {
    id: roomId,
    name: name.trim(),
    slug,
    pinHash: hashPin(pin),
    createdAt: now,
    ownerDeviceId,
    quotaBytes: 50 * 1024 * 1024 * 1024, // 50 GB
    usedBytes: 0,
    devices: [
      {
        id: ownerDeviceId,
        name: deviceName || 'Master Device',
        platform: devicePlatform || 'browser',
        isOnline: true,
        lastSeen: now,
        ipAddress: req.ip,
        usedStorageBytes: 0,
        joinedAt: now,
        isCurrentDevice: true,
      },
    ],
    folders: [],
    files: [],
    activities: [
      {
        id: `act_${Date.now()}`,
        type: 'device_join',
        title: 'Room Created',
        description: `Room "${name}" created with Master Device "${deviceName || 'Master Device'}"`,
        timestamp: now,
        deviceId: ownerDeviceId,
        deviceName: deviceName || 'Master Device',
      },
    ],
    chatMessages: [
      {
        id: `msg_${Date.now()}`,
        senderDeviceId: ownerDeviceId,
        senderDeviceName: deviceName || 'Master Device',
        senderRole: 'owner',
        text: `Welcome to your private CloudRoom "${name}". Your 6-digit access code is set. Share the invite link with your devices to connect.`,
        timestamp: now,
      },
    ],
    clipboardItems: [],
    notes: [
      {
        id: `note_${Date.now()}`,
        title: `Welcome to ${name}`,
        content: `# ${name}\n\nThis is your private, encrypted digital room. Use this space for team collaboration, multi-device cloud storage, shared clipboard, and quick transfers.`,
        lastEditedByDeviceId: ownerDeviceId,
        lastEditedByDeviceName: deviceName || 'Master Device',
        updatedAt: now,
      },
    ],
    temporaryShares: [],
    securityAudits: [
      {
        id: `sec_${Date.now()}`,
        action: 'Room Created',
        status: 'success',
        details: `Room created by ${deviceName || 'Master Device'} from IP ${req.ip || 'local'}`,
        timestamp: now,
      },
    ],
    settings: {
      allowMemberUpload: true,
      allowMemberDelete: false,
      requireApprovalForDevices: false,
      trashRetentionDays: 30,
      clipboardAutoSync: true,
    },
  };

  db.rooms[roomId] = newRoom;
  saveDb();

  res.json({
    success: true,
    room: newRoom,
    currentDevice: newRoom.devices[0],
    role: 'owner',
  });
});

// 3. Join Room with 6-digit PIN
app.post('/api/rooms/join', (req: Request, res: Response) => {
  const { identifier, pin, deviceName, devicePlatform, existingDeviceId } = req.body;

  if (!identifier) {
    return res.status(400).json({ error: 'Room name or ID is required' });
  }

  const room = findRoom(identifier);
  if (!room) {
    return res.status(404).json({ error: 'Room not found. Check the name or invite link.' });
  }

  // Rate Limiting on PIN verification
  const clientIp = req.ip || 'unknown';
  const rateLimitKey = `${room.id}_${clientIp}`;
  const rateInfo = db.rateLimits[rateLimitKey] || { failedAttempts: 0, lastFailedTimestamp: 0 };
  const rateCheck = checkPinRateLimit(rateInfo.failedAttempts, rateInfo.lastFailedTimestamp);

  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: `Too many failed attempts. Locked for ${rateCheck.lockoutSecondsRemaining} seconds.`,
      lockoutSecondsRemaining: rateCheck.lockoutSecondsRemaining,
    });
  }

  const incomingPinHash = hashPin(pin || '');
  if (incomingPinHash !== room.pinHash) {
    rateInfo.failedAttempts += 1;
    rateInfo.lastFailedTimestamp = Date.now();
    db.rateLimits[rateLimitKey] = rateInfo;
    saveDb();

    // Log security failure
    room.securityAudits.unshift({
      id: `sec_${Date.now()}`,
      action: 'Authentication Failed',
      status: 'failed',
      details: `Failed PIN attempt from device "${deviceName || 'Unknown'}" (IP: ${clientIp})`,
      timestamp: new Date().toISOString(),
    });
    saveDb();

    const remaining = Math.max(0, 5 - rateInfo.failedAttempts);
    return res.status(401).json({
      error: 'Invalid 6-digit PIN',
      attemptsRemaining: remaining,
    });
  }

  // PIN succeeded, reset rate limit
  delete db.rateLimits[rateLimitKey];

  const now = new Date().toISOString();
  let device = existingDeviceId ? room.devices.find((d) => d.id === existingDeviceId) : undefined;
  let isNew = false;

  if (!device) {
    isNew = true;
    device = {
      id: `dev_${crypto.randomBytes(6).toString('hex')}`,
      name: deviceName || 'Companion Device',
      platform: devicePlatform || 'browser',
      isOnline: true,
      lastSeen: now,
      ipAddress: clientIp,
      usedStorageBytes: 0,
      joinedAt: now,
    };
    room.devices.push(device);
  } else {
    device.isOnline = true;
    device.lastSeen = now;
    if (deviceName) device.name = deviceName;
  }

  const role: UserRole = room.ownerDeviceId === device.id ? 'owner' : 'member';

  if (isNew) {
    room.activities.unshift({
      id: `act_${Date.now()}`,
      type: 'device_join',
      title: 'Device Connected',
      description: `${device.name} (${device.platform}) joined the room`,
      timestamp: now,
      deviceId: device.id,
      deviceName: device.name,
    });
    broadcastRoomEvent(room.id, 'device_joined', { device, roomName: room.name });
  }

  room.securityAudits.unshift({
    id: `sec_${Date.now()}`,
    action: 'Device Joined',
    status: 'success',
    details: `${device.name} verified and granted access (Role: ${role})`,
    timestamp: now,
  });

  saveDb();

  res.json({
    success: true,
    room,
    currentDevice: device,
    role,
  });
});

// 4. Get Room Data
app.get('/api/rooms/:roomId', (req: Request, res: Response) => {
  const room = findRoom(req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json(room);
});

// 5. Real-Time Server-Sent Events (SSE)
app.get('/api/rooms/:roomId/events', (req: Request, res: Response) => {
  const room = findRoom(req.params.roomId);
  if (!room) {
    return res.status(404).end();
  }

  const deviceId = req.query.deviceId as string | undefined;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });
  res.write('\n');

  if (!sseClients.has(room.id)) {
    sseClients.set(room.id, new Set());
  }

  const clientObj = { res, deviceId };
  sseClients.get(room.id)!.add(clientObj);

  // Send initial ping
  res.write(`event: connected\ndata: ${JSON.stringify({ connected: true, roomId: room.id })}\n\n`);

  req.on('close', () => {
    const clients = sseClients.get(room.id);
    if (clients) {
      clients.delete(clientObj);
      if (clients.size === 0) sseClients.delete(room.id);
    }
  });
});

// 6. Device Heartbeat / Status
app.post('/api/rooms/:roomId/devices/ping', (req: Request, res: Response) => {
  const room = findRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const { deviceId } = req.body;
  const device = room.devices.find((d) => d.id === deviceId);
  if (device) {
    device.isOnline = true;
    device.lastSeen = new Date().toISOString();
    saveDb();
    broadcastRoomEvent(room.id, 'device_status', { deviceId, isOnline: true });
  }
  res.json({ success: true });
});

// 7. Device Rename
app.patch('/api/rooms/:roomId/devices/:deviceId', (req: Request, res: Response) => {
  const room = findRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const device = room.devices.find((d) => d.id === req.params.deviceId);
  if (!device) return res.status(404).json({ error: 'Device not found' });

  const { name } = req.body;
  if (name && name.trim()) {
    const oldName = device.name;
    device.name = name.trim();
    saveDb();
    broadcastRoomEvent(room.id, 'device_renamed', { deviceId: device.id, name: device.name, oldName });
  }
  res.json({ success: true, device });
});

// 8. Device Kick / Remove
app.delete('/api/rooms/:roomId/devices/:deviceId', (req: Request, res: Response) => {
  const room = findRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const deviceId = req.params.deviceId;
  if (deviceId === room.ownerDeviceId) {
    return res.status(400).json({ error: 'Cannot kick the room owner device' });
  }

  const deviceIdx = room.devices.findIndex((d) => d.id === deviceId);
  if (deviceIdx === -1) return res.status(404).json({ error: 'Device not found' });

  const kicked = room.devices.splice(deviceIdx, 1)[0];
  const now = new Date().toISOString();

  room.activities.unshift({
    id: `act_${Date.now()}`,
    type: 'device_kick',
    title: 'Device Removed',
    description: `Device "${kicked.name}" was removed from the room`,
    timestamp: now,
    deviceId: kicked.id,
    deviceName: kicked.name,
  });

  saveDb();
  broadcastRoomEvent(room.id, 'device_kicked', { deviceId: kicked.id, deviceName: kicked.name });
  res.json({ success: true });
});

// 9. Upload Files (Multi-file support)
app.post('/api/rooms/:roomId/files', upload.array('files', 10), (req: Request, res: Response) => {
  const room = findRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files provided for upload' });
  }

  const { folderId, uploaderDeviceId, uploaderRole } = req.body;
  const uploaderDevice = room.devices.find((d) => d.id === uploaderDeviceId);
  const deviceName = uploaderDevice ? uploaderDevice.name : 'Unknown Device';
  const now = new Date().toISOString();

  const createdFiles: FileItem[] = [];

  for (const f of files) {
    const fileItem: FileItem = {
      id: `file_${crypto.randomBytes(6).toString('hex')}`,
      name: f.originalname,
      originalName: f.originalname,
      sizeBytes: f.size,
      mimeType: f.mimetype || 'application/octet-stream',
      folderId: folderId && folderId !== 'null' ? folderId : null,
      uploadedByDeviceId: uploaderDeviceId || 'unknown',
      uploadedByDeviceName: deviceName,
      uploaderRole: (uploaderRole as UserRole) || 'member',
      uploadedAt: now,
      updatedAt: now,
      isDeleted: false,
      path: f.filename,
      tags: [],
      downloadCount: 0,
    };

    room.files.unshift(fileItem);
    room.usedBytes += f.size;
    if (uploaderDevice) {
      uploaderDevice.usedStorageBytes += f.size;
    }
    createdFiles.push(fileItem);

    room.activities.unshift({
      id: `act_${Date.now()}_${Math.random()}`,
      type: 'file_upload',
      title: 'File Uploaded',
      description: `Uploaded "${f.originalname}" (${formatBytes(f.size)})`,
      timestamp: now,
      deviceId: uploaderDeviceId || 'unknown',
      deviceName,
    });
  }

  saveDb();
  broadcastRoomEvent(room.id, 'files_uploaded', { files: createdFiles });
  res.json({ success: true, files: createdFiles });
});

// 10. File Download (Real streaming)
app.get('/api/rooms/:roomId/files/:fileId/download', (req: Request, res: Response) => {
  const room = findRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const file = room.files.find((f) => f.id === req.params.fileId);
  if (!file) return res.status(404).json({ error: 'File not found' });

  const diskPath = path.join(UPLOADS_DIR, file.path);
  if (!fs.existsSync(diskPath)) {
    return res.status(404).json({ error: 'Physical file missing from storage' });
  }

  file.downloadCount += 1;
  saveDb();

  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
  res.setHeader('Content-Type', file.mimeType);
  fs.createReadStream(diskPath).pipe(res);
});

// 11. Rename or Move File
app.patch('/api/rooms/:roomId/files/:fileId', (req: Request, res: Response) => {
  const room = findRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const file = room.files.find((f) => f.id === req.params.fileId);
  if (!file) return res.status(404).json({ error: 'File not found' });

  const { name, folderId } = req.body;
  if (name && name.trim()) {
    file.name = name.trim();
  }
  if (folderId !== undefined) {
    file.folderId = folderId === 'null' || !folderId ? null : folderId;
  }
  file.updatedAt = new Date().toISOString();

  saveDb();
  broadcastRoomEvent(room.id, 'file_updated', { file });
  res.json({ success: true, file });
});

// 12. Delete File (Soft delete to Trash)
app.delete('/api/rooms/:roomId/files/:fileId', (req: Request, res: Response) => {
  const room = findRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const file = room.files.find((f) => f.id === req.params.fileId);
  if (!file) return res.status(404).json({ error: 'File not found' });

  file.isDeleted = true;
  file.deletedAt = new Date().toISOString();

  room.activities.unshift({
    id: `act_${Date.now()}`,
    type: 'file_delete',
    title: 'File Deleted',
    description: `Moved "${file.name}" to trash`,
    timestamp: new Date().toISOString(),
    deviceId: req.body.deviceId || 'unknown',
    deviceName: req.body.deviceName || 'Device',
  });

  saveDb();
  broadcastRoomEvent(room.id, 'file_deleted', { fileId: file.id });
  res.json({ success: true });
});

// 13. Restore File from Trash
app.post('/api/rooms/:roomId/files/:fileId/restore', (req: Request, res: Response) => {
  const room = findRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const file = room.files.find((f) => f.id === req.params.fileId);
  if (!file) return res.status(404).json({ error: 'File not found' });

  file.isDeleted = false;
  file.deletedAt = undefined;
  file.updatedAt = new Date().toISOString();

  room.activities.unshift({
    id: `act_${Date.now()}`,
    type: 'file_restore',
    title: 'File Restored',
    description: `Restored "${file.name}" from trash`,
    timestamp: new Date().toISOString(),
    deviceId: req.body.deviceId || 'unknown',
    deviceName: req.body.deviceName || 'Device',
  });

  saveDb();
  broadcastRoomEvent(room.id, 'file_restored', { file });
  res.json({ success: true, file });
});

// 14. Folders: Create
app.post('/api/rooms/:roomId/folders', (req: Request, res: Response) => {
  const room = findRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const { name, parentId, deviceId, deviceName, color } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Folder name required' });

  const folder: FolderItem = {
    id: `fld_${crypto.randomBytes(5).toString('hex')}`,
    name: name.trim(),
    parentId: parentId || null,
    createdAt: new Date().toISOString(),
    createdByDeviceId: deviceId || 'unknown',
    createdByDeviceName: deviceName || 'Device',
    color: color || '#38bdf8',
  };

  room.folders.push(folder);
  room.activities.unshift({
    id: `act_${Date.now()}`,
    type: 'folder_create',
    title: 'Folder Created',
    description: `Created folder "${folder.name}"`,
    timestamp: new Date().toISOString(),
    deviceId: deviceId || 'unknown',
    deviceName: deviceName || 'Device',
  });

  saveDb();
  broadcastRoomEvent(room.id, 'folder_created', { folder });
  res.json({ success: true, folder });
});

// 15. Shared Clipboard: Broadcast snippet
app.post('/api/rooms/:roomId/clipboard', (req: Request, res: Response) => {
  const room = findRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const { content, deviceId, deviceName, pinned } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Clipboard content empty' });

  const item: ClipboardItem = {
    id: `clip_${Date.now()}`,
    content: content.trim(),
    fromDeviceId: deviceId,
    fromDeviceName: deviceName || 'Device',
    timestamp: new Date().toISOString(),
    pinned: !!pinned,
  };

  room.clipboardItems.unshift(item);
  if (room.clipboardItems.length > 50) room.clipboardItems.pop(); // keep last 50

  room.activities.unshift({
    id: `act_${Date.now()}`,
    type: 'clipboard_send',
    title: 'Clipboard Shared',
    description: `New text shared by ${deviceName || 'Device'} (${content.slice(0, 30)}...)`,
    timestamp: new Date().toISOString(),
    deviceId,
    deviceName: deviceName || 'Device',
  });

  saveDb();
  broadcastRoomEvent(room.id, 'clipboard_new', { item });
  res.json({ success: true, item });
});

// 16. Chat: Post message
app.post('/api/rooms/:roomId/chat', (req: Request, res: Response) => {
  const room = findRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const { text, deviceId, deviceName, role, fileAttachment } = req.body;
  if (!text && !fileAttachment) return res.status(400).json({ error: 'Message cannot be empty' });

  const message: ChatMessage = {
    id: `msg_${Date.now()}`,
    senderDeviceId: deviceId,
    senderDeviceName: deviceName || 'Device',
    senderRole: role || 'member',
    text: text || '',
    fileAttachment,
    timestamp: new Date().toISOString(),
  };

  room.chatMessages.push(message);
  if (room.chatMessages.length > 200) room.chatMessages.shift();

  saveDb();
  broadcastRoomEvent(room.id, 'chat_message', { message });
  res.json({ success: true, message });
});

// 17. Shared Notes: Update note
app.put('/api/rooms/:roomId/notes', (req: Request, res: Response) => {
  const room = findRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const { id, title, content, deviceId, deviceName } = req.body;
  let note = room.notes.find((n) => n.id === id);

  if (!note) {
    note = {
      id: id || `note_${Date.now()}`,
      title: title || 'Untitled Note',
      content: content || '',
      lastEditedByDeviceId: deviceId,
      lastEditedByDeviceName: deviceName || 'Device',
      updatedAt: new Date().toISOString(),
    };
    room.notes.push(note);
  } else {
    note.title = title !== undefined ? title : note.title;
    note.content = content !== undefined ? content : note.content;
    note.lastEditedByDeviceId = deviceId;
    note.lastEditedByDeviceName = deviceName || 'Device';
    note.updatedAt = new Date().toISOString();
  }

  saveDb();
  broadcastRoomEvent(room.id, 'note_updated', { note });
  res.json({ success: true, note });
});

// 18. Temporary Public Sharing Link
app.post('/api/rooms/:roomId/share', (req: Request, res: Response) => {
  const room = findRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const { fileId, expiryHours, password, maxDownloads, deviceId } = req.body;
  const file = room.files.find((f) => f.id === fileId);
  if (!file) return res.status(404).json({ error: 'File not found' });

  const token = crypto.randomBytes(16).toString('hex');
  const hours = parseInt(expiryHours, 10) || 24;
  const expiresAt = new Date(Date.now() + hours * 3600000).toISOString();

  const shareLink: TemporaryShareLink = {
    id: `share_${crypto.randomBytes(5).toString('hex')}`,
    token,
    fileId: file.id,
    fileName: file.name,
    fileSizeBytes: file.sizeBytes,
    mimeType: file.mimeType,
    createdAt: new Date().toISOString(),
    expiresAt,
    passwordProtected: !!password,
    passwordHash: password ? hashPin(password) : undefined,
    downloadCount: 0,
    maxDownloads: maxDownloads ? parseInt(maxDownloads, 10) : undefined,
    isRevoked: false,
    createdByDeviceId: deviceId,
  };

  room.temporaryShares.unshift(shareLink);
  saveDb();
  res.json({ success: true, shareLink });
});

// 19. Public Share Preview & Download
app.get('/api/public/share/:token', (req: Request, res: Response) => {
  const token = req.params.token;
  let targetLink: TemporaryShareLink | undefined;
  let targetRoom: RoomData | undefined;

  for (const r of Object.values(db.rooms)) {
    const found = r.temporaryShares.find((s) => s.token === token && !s.isRevoked);
    if (found) {
      targetLink = found;
      targetRoom = r;
      break;
    }
  }

  if (!targetLink || !targetRoom) {
    return res.status(404).json({ error: 'Share link not found or has been revoked' });
  }

  if (new Date(targetLink.expiresAt).getTime() < Date.now()) {
    return res.status(410).json({ error: 'This share link has expired' });
  }

  if (targetLink.maxDownloads && targetLink.downloadCount >= targetLink.maxDownloads) {
    return res.status(410).json({ error: 'Download limit exceeded for this link' });
  }

  const file = targetRoom.files.find((f) => f.id === targetLink!.fileId);
  if (!file) return res.status(404).json({ error: 'Target file no longer exists' });

  res.json({
    token: targetLink.token,
    fileName: file.name,
    fileSizeBytes: file.sizeBytes,
    mimeType: file.mimeType,
    expiresAt: targetLink.expiresAt,
    passwordProtected: targetLink.passwordProtected,
    roomName: targetRoom.name,
  });
});

app.post('/api/public/share/:token/download', (req: Request, res: Response) => {
  const token = req.params.token;
  const { password } = req.body;
  let targetLink: TemporaryShareLink | undefined;
  let targetRoom: RoomData | undefined;

  for (const r of Object.values(db.rooms)) {
    const found = r.temporaryShares.find((s) => s.token === token && !s.isRevoked);
    if (found) {
      targetLink = found;
      targetRoom = r;
      break;
    }
  }

  if (!targetLink || !targetRoom) return res.status(404).json({ error: 'Link invalid' });
  if (targetLink.passwordProtected && hashPin(password || '') !== targetLink.passwordHash) {
    return res.status(401).json({ error: 'Incorrect download password' });
  }

  const file = targetRoom.files.find((f) => f.id === targetLink!.fileId);
  if (!file) return res.status(404).json({ error: 'File missing' });

  const diskPath = path.join(UPLOADS_DIR, file.path);
  if (!fs.existsSync(diskPath)) return res.status(404).json({ error: 'File not on disk' });

  targetLink.downloadCount += 1;
  saveDb();

  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
  res.setHeader('Content-Type', file.mimeType);
  fs.createReadStream(diskPath).pipe(res);
});

// 20. Update Room Settings / Change PIN
app.patch('/api/rooms/:roomId/settings', (req: Request, res: Response) => {
  const room = findRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const { newPin, currentPin, quotaBytes, settings, deviceId, deviceName } = req.body;

  if (newPin) {
    if (hashPin(currentPin || '') !== room.pinHash) {
      return res.status(401).json({ error: 'Current PIN is incorrect' });
    }
    if (!/^\d{6}$/.test(newPin)) {
      return res.status(400).json({ error: 'New PIN must be 6 digits' });
    }
    room.pinHash = hashPin(newPin);
    room.securityAudits.unshift({
      id: `sec_${Date.now()}`,
      action: 'PIN Changed',
      status: 'warning',
      details: `6-digit Room PIN changed by ${deviceName || 'Owner'}`,
      timestamp: new Date().toISOString(),
    });
  }

  if (quotaBytes) room.quotaBytes = quotaBytes;
  if (settings) room.settings = { ...room.settings, ...settings };

  saveDb();
  broadcastRoomEvent(room.id, 'settings_updated', { settings: room.settings });
  res.json({ success: true, room });
});

// -------------------------------------------------------------
// Vite middleware mounting (Development) & Static Serving (Production)
// -------------------------------------------------------------
async function setupVite() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CLOUDROOM server running at http://0.0.0.0:${PORT}`);
  });
}

setupVite();
