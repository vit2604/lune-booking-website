import { sendSuccess } from '../../utils/responseUtils.js';
import { createMediaAsset, deleteMediaAsset, listMedia } from './media.service.js';

export async function mediaList(_req, res) {
  sendSuccess(res, await listMedia());
}

export async function mediaCreate(req, res) {
  sendSuccess(res, await createMediaAsset(req.body), 'Media asset saved', 201);
}

export async function mediaDelete(req, res) {
  sendSuccess(res, await deleteMediaAsset(req.params.id), 'Media asset deleted');
}
