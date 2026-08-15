import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, test } from 'vitest';
import sharp from 'sharp';
import { OpenCvPrivacyAnalyzer } from './privacyAnalyzer.js';
import { SharpImageRenderer } from './renderers.js';

const temporaryDirectories = [];
afterEach(async () => { await Promise.all(temporaryDirectories.splice(0).map((target) => fs.rm(target, { recursive: true, force: true }))); });

test('Sharp quality fixture reports dimensions/exposure and stable perceptual hash', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'lune-media-test-')); temporaryDirectories.push(directory);
  const input = path.join(directory, 'input.png');
  await sharp({ create: { width: 900, height: 1200, channels: 3, background: { r: 120, g: 150, b: 180 } } }).png().toFile(input);
  const renderer = new SharpImageRenderer();
  const analysis = await renderer.analyze(input);
  assert.equal(analysis.width, 900); assert.equal(analysis.height, 1200);
  assert.ok(analysis.exposureScore > 8 && analysis.exposureScore < 96);
  assert.match(await renderer.perceptualHash(input), /^[a-f0-9]{16}$/);
});

test('Sharp social renderer strips metadata and emits required portrait size', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'lune-render-test-')); temporaryDirectories.push(directory);
  const input = path.join(directory, 'input.jpg'); const output = path.join(directory, 'output.jpg');
  await sharp({ create: { width: 800, height: 800, channels: 3, background: '#988060' } }).withMetadata({ orientation: 6 }).jpeg().toFile(input);
  const renderer = new SharpImageRenderer(); await renderer.renderSocial({ input, output });
  const metadata = await sharp(output).metadata();
  assert.equal(metadata.width, 1080); assert.equal(metadata.height, 1350); assert.equal(metadata.orientation, undefined);
});

test('privacy analyzer has an explicit fail-closed disabled result', async () => {
  assert.deepEqual(await new OpenCvPrivacyAnalyzer({ enabled: false }).analyze('unused'), { available: false, flags: ['LOCAL_PRIVACY_ANALYZER_DISABLED'], faceCount: 0 });
});
