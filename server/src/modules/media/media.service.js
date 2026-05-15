import { prisma } from '../../config/prisma.js';
import { createHttpError } from '../../utils/responseUtils.js';

export function listMedia() {
  return prisma.mediaAsset.findMany({ orderBy: { createdAt: 'desc' } });
}

export function createMediaAsset(input) {
  return prisma.mediaAsset.create({
    data: {
      url: input.url,
      type: input.type || 'IMAGE',
      altText: input.altText || null,
      source: input.source || 'URL',
    },
  });
}

export async function deleteMediaAsset(id) {
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset) throw createHttpError(404, 'Media asset not found');
  return prisma.mediaAsset.delete({ where: { id } });
}
