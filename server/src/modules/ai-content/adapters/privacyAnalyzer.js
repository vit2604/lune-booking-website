import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const defaultScript = path.resolve(moduleDir, '../../../../ai-content/detect_privacy.py');

export class OpenCvPrivacyAnalyzer {
  constructor({ enabled = true, pythonPath = 'python', scriptPath = defaultScript, timeoutMs = 45_000 } = {}) { Object.assign(this, { enabled, pythonPath, scriptPath, timeoutMs }); }
  async analyze(input) {
    if (!this.enabled) return { available: false, flags: ['LOCAL_PRIVACY_ANALYZER_DISABLED'], faceCount: 0 };
    return new Promise((resolve) => {
      const child = spawn(this.pythonPath, [this.scriptPath, input], { windowsHide: true, env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, WINDIR: process.env.WINDIR, PYTHONIOENCODING: 'utf-8' } });
      let stdout = ''; let stderr = ''; let settled = false;
      const finish = (result) => { if (settled) return; settled = true; clearTimeout(timer); resolve(result); };
      child.stdout.on('data', (chunk) => { stdout = `${stdout}${chunk}`.slice(-64_000); });
      child.stderr.on('data', (chunk) => { stderr = `${stderr}${chunk}`.slice(-2_000); });
      child.on('error', (error) => finish({ available: false, flags: ['LOCAL_PRIVACY_ANALYZER_UNAVAILABLE'], faceCount: 0, reason: error.message }));
      child.on('close', (code) => { try { const parsed = JSON.parse(stdout); finish({ available: Boolean(parsed.available), flags: Array.isArray(parsed.flags) ? parsed.flags : [], faceCount: Number(parsed.faceCount || 0), framesChecked: Number(parsed.framesChecked || 0), reason: parsed.reason || null }); } catch { finish({ available: false, flags: ['LOCAL_PRIVACY_ANALYZER_FAILED'], faceCount: 0, reason: `opencv helper exited ${code}: ${stderr}`.slice(0, 500) }); } });
      const timer = setTimeout(() => { child.kill(); finish({ available: false, flags: ['LOCAL_PRIVACY_ANALYZER_TIMEOUT'], faceCount: 0 }); }, this.timeoutMs);
    });
  }
}
