import crypto from 'node:crypto';

function parseKey(encoded) {
  if (!encoded) throw new Error('META_TOKEN_ENCRYPTION_KEY is not configured');
  const key = /^[a-f0-9]{64}$/i.test(encoded) ? Buffer.from(encoded, 'hex') : Buffer.from(encoded, 'base64');
  if (key.length !== 32) throw new Error('META_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes');
  return key;
}

export function encryptMetaToken(token, { encodedKey, keyVersion, pageId }) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', parseKey(encodedKey), iv);
  cipher.setAAD(Buffer.from(`lune-meta-token:${keyVersion}:${pageId}`));
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return { tokenCiphertext: ciphertext.toString('base64'), tokenIv: iv.toString('base64'), tokenAuthTag: cipher.getAuthTag().toString('base64'), encryptionKeyVersion: keyVersion };
}

export function decryptMetaToken(record, { encodedKey }) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', parseKey(encodedKey), Buffer.from(record.tokenIv, 'base64'));
  decipher.setAAD(Buffer.from(`lune-meta-token:${record.encryptionKeyVersion}:${record.pageId}`));
  decipher.setAuthTag(Buffer.from(record.tokenAuthTag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(record.tokenCiphertext, 'base64')), decipher.final()]).toString('utf8');
}
