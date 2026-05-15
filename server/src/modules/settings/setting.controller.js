import { sendSuccess } from '../../utils/responseUtils.js';
import { getAllSettings, getPublicSettings, saveSetting } from './setting.service.js';

export async function publicSettings(_req, res) {
  sendSuccess(res, await getPublicSettings());
}

export async function adminSettings(_req, res) {
  sendSuccess(res, await getAllSettings());
}

export async function adminSaveSetting(req, res) {
  const saved = await saveSetting(req.params.key, req.body);
  sendSuccess(res, { key: saved.key, value: saved.valueJson }, 'Setting saved');
}
