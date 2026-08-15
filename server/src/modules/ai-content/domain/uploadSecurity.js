import crypto from 'node:crypto';
import path from 'node:path';

const MIME_SIGNATURES = [
  { mime: 'image/jpeg', match: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/png', match: (b) => b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  { mime: 'image/webp', match: (b) => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP' },
  { mime: 'video/quicktime', match: (b) => b.subarray(4, 8).toString() === 'ftyp' && b.subarray(8, 12).toString().includes('qt') },
  { mime: 'video/mp4', match: (b) => b.subarray(4, 8).toString() === 'ftyp' },
];

export function detectMime(buffer) {
  return MIME_SIGNATURES.find((entry) => entry.match(buffer))?.mime || null;
}

export function safeStoredFilename(originalName, mime) {
  const extensionByMime = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'video/mp4': '.mp4', 'video/quicktime': '.mov' };
  const extension = extensionByMime[mime];
  if (!extension) throw new Error('Unsupported media type');
  path.basename(originalName || 'upload');
  return `${crypto.randomUUID()}${extension}`;
}

export function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export async function sha256File(filePath) {
  const { createReadStream } = await import('node:fs');
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}
