import crypto from 'node:crypto';

export function publicationContentHash({ version, captionVi, captionEn, mediaAssetIds }) {
  return crypto.createHash('sha256').update(JSON.stringify({ v: version, vi: captionVi, en: captionEn, assets: [...mediaAssetIds].sort() })).digest('hex');
}
