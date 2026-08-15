import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export class SharpImageRenderer {
  async analyze(buffer) {
    const image = sharp(buffer, { failOn: 'error', limitInputPixels: 80_000_000 });
    const metadata = await image.metadata();
    const stats = await image.stats();
    const mean = stats.channels.slice(0, 3).reduce((sum, channel) => sum + channel.mean, 0) / Math.max(stats.channels.length, 1);
    return { width: metadata.width, height: metadata.height, orientation: metadata.orientation, exposureScore: Math.round((mean / 255) * 100), blurScore: Number(stats.sharpness || 0), entropy: Number(stats.entropy || 0), format: metadata.format };
  }
  async perceptualHash(input) {
    const { data } = await sharp(input, { failOn: 'error' }).rotate().resize(8, 8, { fit: 'fill' }).greyscale().raw().toBuffer({ resolveWithObject: true });
    const mean = [...data].reduce((sum, value) => sum + value, 0) / Math.max(data.length, 1);
    let bits = '';
    for (const value of data) bits += value >= mean ? '1' : '0';
    return BigInt(`0b${bits}`).toString(16).padStart(16, '0');
  }
  async renderSocial({ input, output, width = 1080, height = 1350 }) {
    await fs.mkdir(path.dirname(output), { recursive: true });
    await sharp(input).rotate().resize(width, height, { fit: 'cover', position: 'attention' }).jpeg({ quality: 88, mozjpeg: true }).toFile(output);
    return output;
  }
}

function run(command, args, timeoutMs = 120_000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, ['-nostdin', ...args], { windowsHide: true, env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, WINDIR: process.env.WINDIR } });
    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr = `${stderr}${chunk}`.slice(-4000); });
    const timer = setTimeout(() => { child.kill(); reject(new Error(`${command} timed out`)); }, timeoutMs);
    child.on('error', (error) => { clearTimeout(timer); reject(error); });
    child.on('close', (code) => { clearTimeout(timer); code === 0 ? resolve() : reject(new Error(`${command} exited ${code}: ${stderr}`)); });
  });
}

function runCapture(command, args, timeoutMs = 30_000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, ['-nostdin', ...args], { windowsHide: true, env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, WINDIR: process.env.WINDIR } });
    let stdout = ''; let stderr = '';
    child.stdout.on('data', (chunk) => { stdout = `${stdout}${chunk}`; if (stdout.length > 1_000_000) child.kill(); });
    child.stderr.on('data', (chunk) => { stderr = `${stderr}${chunk}`.slice(-4000); });
    const timer = setTimeout(() => { child.kill(); reject(new Error(`${command} timed out`)); }, timeoutMs);
    child.on('error', (error) => { clearTimeout(timer); reject(error); });
    child.on('close', (code) => { clearTimeout(timer); code === 0 ? resolve(stdout) : reject(new Error(`${command} exited ${code}: ${stderr}`)); });
  });
}

export class FFmpegVideoRenderer {
  constructor({ ffmpegPath = 'ffmpeg', ffprobePath = 'ffprobe' } = {}) { Object.assign(this, { ffmpegPath, ffprobePath }); }
  async health() { try { await run(this.ffmpegPath, ['-version'], 3_000); return { available: true }; } catch { return { available: false }; } }
  async analyze(input) {
    const output = await runCapture(this.ffprobePath, ['-v', 'error', '-show_entries', 'format=format_name,duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,avg_frame_rate,tags,side_data_list', '-of', 'json', input]);
    const parsed = JSON.parse(output); const video = parsed.streams?.find((stream) => stream.codec_type === 'video'); const audio = parsed.streams?.find((stream) => stream.codec_type === 'audio');
    const durationSeconds = Number(parsed.format?.duration || 0);
    if (!video || !['h264', 'hevc', 'vp9', 'av1', 'mpeg4'].includes(video.codec_name) || durationSeconds <= 0 || durationSeconds > 90 || (video.width || 0) < 540 || (video.height || 0) < 540) throw new Error('Video does not meet codec, duration, or resolution requirements');
    const [fpsNumerator, fpsDenominator = 1] = String(video.avg_frame_rate || video.r_frame_rate || '0/1').split('/').map(Number);
    const rotation = Number(video.tags?.rotate ?? video.side_data_list?.find((item) => item.rotation != null)?.rotation ?? 0);
    return { width: video.width, height: video.height, durationSeconds, format: parsed.format?.format_name, codec: video.codec_name, fps: fpsDenominator ? fpsNumerator / fpsDenominator : 0, rotation, hasAudio: Boolean(audio), audioCodec: audio?.codec_name || null };
  }
  async extractSampleFrame({ input, output }) { await run(this.ffmpegPath, ['-y', '-ss', '0', '-i', input, '-frames:v', '1', '-q:v', '2', output], 30_000); return output; }
  async renderReel({ input, output }) {
    await fs.mkdir(path.dirname(output), { recursive: true });
    await run(this.ffmpegPath, ['-y', '-i', input, '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920', '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', output]);
    return output;
  }
}

export class NoOpSpeechToTextProvider {
  async transcribe() { return { text: '', segments: [], available: false, reason: 'LOCAL_STT_NOT_CONFIGURED' }; }
}
