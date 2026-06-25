import { prisma } from '../../config/prisma.js';
import { createHttpError } from '../../utils/responseUtils.js';
import { cleanText, sanitizePublicAssetUrl } from '../../utils/sanitizeUtils.js';

export function listMedia() {
  return prisma.mediaAsset.findMany({ orderBy: { createdAt: 'desc' } });
}

export function createMediaAsset(input) {
  const sanitizedUrl = sanitizePublicAssetUrl(input.url, { allowDataImage: input.type === 'IMAGE' });
  if (!sanitizedUrl) throw createHttpError(400, 'Media URL must be HTTPS, /images/*, or a safe image data URL');
  return prisma.mediaAsset.create({
    data: {
      url: sanitizedUrl,
      type: input.type || 'IMAGE',
      altText: cleanText(input.altText, 160) || null,
      source: input.source || 'URL',
    },
  });
}

export async function deleteMediaAsset(id) {
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset) throw createHttpError(404, 'Media asset not found');
  return prisma.mediaAsset.delete({ where: { id } });
}
