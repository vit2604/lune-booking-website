import { sendSuccess } from '../../utils/responseUtils.js';
import * as service from './aiContent.service.js';

const context = (req) => ({ actorId: req.user.id, correlationId: req.id });
const safeJson = (value) => JSON.parse(JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() : item));

export async function dashboard(_req, res) { sendSuccess(res, safeJson(await service.getDashboard())); }
export async function settingsUpdate(req, res) { sendSuccess(res, await service.updateAiContentSettings(req.body, req.user.id, req.id)); }
export async function trends(_req, res) { sendSuccess(res, await service.listTrends()); }
export async function trendsRefresh(req, res) { sendSuccess(res, await service.refreshTrends(req.user.id, req.id), 'Official trends refreshed'); }
export async function analytics(_req, res) { sendSuccess(res, safeJson(await service.analyticsOverview())); }
export async function analyticsFetch(req, res) { sendSuccess(res, safeJson(await service.fetchPublicationAnalytics(req.params.id, req.body.windowHours, req.user.id, req.id))); }
export async function ideasToday(_req, res) { sendSuccess(res, await service.generateTodayIdeas(null, null)); }
export async function ideasGenerate(req, res) { sendSuccess(res, await service.generateTodayIdeas(req.user.id, req.id), 'Daily ideas ready', 201); }
export async function ideaSelect(req, res) { sendSuccess(res, await service.selectIdea(req.params.id, req.user.id, req.id)); }
export async function ideaFeedback(req, res) { sendSuccess(res, await service.recordIdeaFeedback(req.params.id, req.body, req.user.id, req.id)); }
export async function uploadsCreate(req, res) { sendSuccess(res, await service.saveUploads(req.files, context(req)), 'Media uploaded', 201); }
export async function uploadGet(req, res) { sendSuccess(res, await service.getUpload(req.params.id)); }
export async function uploadAnalyze(req, res) { sendSuccess(res, await service.getUpload(req.params.id), 'Analysis already completed at upload'); }
export async function uploadReview(req, res) { sendSuccess(res, await service.reviewUpload(req.params.id, req.body, req.user.id, req.id)); }
export async function uploadFile(req, res, next) { try { const file = await service.getUploadFile(req.params.id); res.set({ 'Content-Type': file.mime, 'Content-Disposition': `inline; filename="${file.filename}"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' }); res.sendFile(file.path); } catch (error) { next(error); } }
export async function uploadDelete(req, res) { sendSuccess(res, await service.deleteUpload(req.params.id, req.user.id, req.id)); }
export async function draftGenerate(req, res) { sendSuccess(res, safeJson(await service.generateDraft(req.body, req.user.id, req.id)), 'Draft generated', 201); }
export async function draftGet(req, res) { sendSuccess(res, safeJson(await service.getDraft(req.params.id))); }
export async function draftUpdate(req, res) { sendSuccess(res, await service.updateDraft(req.params.id, req.body, req.user.id, req.id)); }
export async function draftRender(req, res) { sendSuccess(res, await service.renderDraft(req.params.id, req.user.id, req.id), 'Final media rendered', 201); }
export async function draftApprove(req, res) { sendSuccess(res, await service.approveDraft(req.params.id, req.user.id, req.id)); }
export async function draftSchedule(req, res) { sendSuccess(res, await service.scheduleDraft(req.params.id, req.body.scheduledAt, req.user.id, req.id)); }
export async function publicationPublish(req, res) { sendSuccess(res, await service.publishPublication(req.params.id, req.user.id, req.id)); }
export async function publicationRetry(req, res) { sendSuccess(res, await service.publishPublication(req.params.id, req.user.id, req.id)); }
export async function publicationResume(req, res) { sendSuccess(res, await service.resumePublication(req.params.id, req.body.scheduledAt, req.user.id, req.id)); }
export async function stop(req, res) { sendSuccess(res, await service.emergencyStop(req.body.active, req.user.id, req.id)); }
export async function diagnostics(_req, res) { sendSuccess(res, safeJson(await service.diagnostics())); }
export async function metaStatus(_req, res) { sendSuccess(res, await service.metaStatus()); }
export async function metaConnect(req, res) { sendSuccess(res, await service.createMetaConnectUrl(req.user.id, req.id)); }
export async function metaCallback(req, res) { sendSuccess(res, await service.completeMetaOauth(req.body, req.user.id, req.id)); }
export async function metaDisconnect(req, res) { sendSuccess(res, await service.disconnectMeta(req.user.id, req.id)); }
