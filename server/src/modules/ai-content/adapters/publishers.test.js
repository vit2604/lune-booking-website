import assert from 'node:assert/strict';
import { test } from 'vitest';
import { MetaPagePublisher, MockPublisher } from './publishers.js';

test('mock publisher is deterministic and always dry-run', async () => {
  const publisher = new MockPublisher();
  const first = await publisher.publish({ idempotencyKey: 'same-job' });
  const second = await publisher.publish({ idempotencyKey: 'same-job' });
  assert.equal(first.remotePostId, second.remotePostId);
  assert.equal(first.dryRun, true);
});

test('Meta image publisher uploads bytes to the pinned Page photos edge', async () => {
  const calls = [];
  const publisher = new MetaPagePublisher({
    graphVersion: 'v26.0', pageId: '123', accessToken: 'token', liveEnabled: true,
    fetchImpl: async (url, options) => { calls.push({ url: String(url), options }); return new Response(JSON.stringify({ id: 'photo-id', post_id: 'post-id' }), { status: 200, headers: { 'content-type': 'application/json' } }); },
  });
  const result = await publisher.publish({ caption: 'Lune', media: { mime: 'image/jpeg', filename: 'lune.jpg', read: async () => Buffer.from([1, 2, 3]) } });
  assert.equal(result.remotePostId, 'post-id');
  assert.match(calls[0].url, /v26\.0\/123\/photos$/);
  assert.equal(calls[0].options.body instanceof FormData, true);
  assert.equal(calls[0].options.headers.authorization, 'Bearer token');
});

test('Meta Reel publisher uses start, binary upload, and finish phases', async () => {
  const calls = [];
  const responses = [
    { video_id: 'video-id', upload_url: 'https://upload.facebook.test/session' },
    { success: true },
    { success: true },
  ];
  const publisher = new MetaPagePublisher({
    graphVersion: 'v26.0', pageId: '123', accessToken: 'token', liveEnabled: true,
    fetchImpl: async (url, options) => { calls.push({ url: String(url), options }); return new Response(JSON.stringify(responses.shift()), { status: 200, headers: { 'content-type': 'application/json' } }); },
  });
  const result = await publisher.publish({ caption: 'Lune Reel', media: { mime: 'video/mp4', filename: 'lune.mp4', read: async () => Buffer.from([1, 2, 3, 4]) } });
  assert.equal(result.remotePostId, 'video-id');
  assert.equal(result.processing, true);
  assert.equal(calls.length, 3);
  assert.equal(calls[1].options.headers.authorization, 'OAuth token');
  assert.equal(calls[1].options.headers.file_size, '4');
  assert.match(String(calls[2].options.body), /"upload_phase":"finish"/);
});

test('live Meta publisher refuses to dispatch while the live flag is off', async () => {
  const publisher = new MetaPagePublisher({ graphVersion: 'v26.0', pageId: '123', accessToken: 'token', liveEnabled: false });
  await assert.rejects(() => publisher.publish({ caption: 'blocked' }), /disabled/);
});
