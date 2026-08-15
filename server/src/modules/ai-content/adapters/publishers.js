import crypto from 'node:crypto';

export class ContentPublisher {
  async publish() { throw new Error('Abstract ContentPublisher method'); }
  async status() { return { connected: false }; }
}

export class MockPublisher extends ContentPublisher {
  async publish({ idempotencyKey }) {
    return {
      remotePostId: `mock_${crypto.createHash('sha256').update(idempotencyKey).digest('hex').slice(0, 18)}`,
      permalink: null,
      processing: false,
      dryRun: true,
    };
  }
  async status() { return { connected: true, mode: 'mock', dryRun: true }; }
}

export class MetaPagePublisher extends ContentPublisher {
  constructor({ graphVersion, pageId, accessToken, liveEnabled = false, baseUrl = 'https://graph.facebook.com', fetchImpl = fetch }) {
    super(); Object.assign(this, { graphVersion, pageId, accessToken, liveEnabled, baseUrl, fetchImpl });
  }

  assertReady() {
    if (!this.liveEnabled) throw Object.assign(new Error('Live Meta publishing is disabled'), { status: 403 });
    if (!/^v\d+\.\d+$/.test(this.graphVersion || '')) throw Object.assign(new Error('Invalid Meta Graph version'), { status: 400 });
    if (!this.pageId || !this.accessToken) throw Object.assign(new Error('Meta Page is not connected'), { status: 401 });
  }

  async request(path, body, { method = 'POST', headers = {}, rawBody = null } = {}) {
    this.assertReady();
    const response = await this.fetchImpl(`${this.baseUrl}/${this.graphVersion}/${path}`, {
      method, headers: { authorization: `Bearer ${this.accessToken}`, ...(rawBody == null ? { 'content-type': 'application/json' } : {}), ...headers },
      body: rawBody == null ? JSON.stringify(body) : rawBody, signal: AbortSignal.timeout(120_000),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(payload?.error?.message || `Meta HTTP ${response.status}`), { status: response.status, metaCode: payload?.error?.code });
    return payload;
  }

  async get(path, query = {}) {
    this.assertReady();
    const url = new URL(`${this.baseUrl}/${this.graphVersion}/${path}`);
    Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, String(value)));
    const response = await this.fetchImpl(url, { headers: { authorization: `Bearer ${this.accessToken}` }, signal: AbortSignal.timeout(30_000) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(payload?.error?.message || `Meta HTTP ${response.status}`), { status: response.status, metaCode: payload?.error?.code });
    return payload;
  }

  async publishImage({ caption, media }) {
    const bytes = await media.read();
    const form = new FormData();
    form.set('message', caption); form.set('published', 'true');
    form.set('source', new Blob([bytes], { type: media.mime }), media.filename);
    const payload = await this.request(`${this.pageId}/photos`, null, { rawBody: form });
    return { remotePostId: payload.post_id || payload.id, permalink: null, processing: false, dryRun: false };
  }

  async publishReel({ caption, media }) {
    const start = await this.request(`${this.pageId}/video_reels`, { upload_phase: 'start' });
    if (!start.video_id || !start.upload_url) throw Object.assign(new Error('Meta did not return a Reel upload session'), { status: 502 });
    const bytes = await media.read();
    const upload = await this.fetchImpl(start.upload_url, {
      method: 'POST',
      headers: { authorization: `OAuth ${this.accessToken}`, offset: '0', file_size: String(bytes.byteLength), 'content-type': 'application/octet-stream' },
      body: bytes, signal: AbortSignal.timeout(180_000),
    });
    const uploadPayload = await upload.json().catch(() => ({}));
    if (!upload.ok || uploadPayload.success === false) throw Object.assign(new Error(uploadPayload?.error?.message || `Meta Reel upload HTTP ${upload.status}`), { status: upload.status });
    const finish = await this.request(`${this.pageId}/video_reels`, { upload_phase: 'finish', video_id: start.video_id, video_state: 'PUBLISHED', description: caption });
    if (finish.success === false) throw Object.assign(new Error('Meta did not accept the Reel publish request'), { status: 502 });
    return { remotePostId: start.video_id, permalink: null, processing: true, dryRun: false };
  }

  async publish({ caption, link, media }) {
    if (media?.mime?.startsWith('image/')) return this.publishImage({ caption, media });
    if (media?.mime?.startsWith('video/')) return this.publishReel({ caption, media });
    const payload = await this.request(`${this.pageId}/feed`, { message: caption, ...(link ? { link } : {}) });
    return { remotePostId: payload.id, permalink: null, processing: false, dryRun: false };
  }

  async processingStatus(remotePostId) {
    const payload = await this.get(remotePostId, { fields: 'id,status,permalink_url' });
    const status = String(payload?.status?.video_status || '').toLowerCase();
    return { ready: ['ready', 'published', 'complete', 'completed'].includes(status), failed: ['error', 'failed'].includes(status), rawStatus: status || 'unknown', permalink: payload.permalink_url || null };
  }

  async findRecentExactCaption({ caption, since }) {
    const payload = await this.get(`${this.pageId}/posts`, { fields: 'id,message,created_time,permalink_url', since: Math.floor(new Date(since).getTime() / 1000), limit: 50 });
    return (payload.data || []).filter((item) => item.message === caption);
  }

  async status() {
    return { connected: Boolean(this.pageId && this.accessToken), liveEnabled: this.liveEnabled, pageId: this.pageId || null, token: this.accessToken ? '***configured***' : null };
  }
}
