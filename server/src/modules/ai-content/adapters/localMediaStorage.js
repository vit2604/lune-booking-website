import fs from 'node:fs/promises';
import path from 'node:path';

export class LocalMediaStorage {
  constructor(root) {
    this.root = path.resolve(root);
    const forbidden = [path.resolve(process.cwd(), 'public'), path.resolve(process.cwd(), 'dist')];
    if (forbidden.some((candidate) => this.root === candidate || this.root.startsWith(`${candidate}${path.sep}`))) throw new Error('AI Content media root cannot be public');
  }
  async ensure() {
    await Promise.all(['originals', 'previews', 'renders', 'temp'].map((dir) => fs.mkdir(path.join(this.root, dir), { recursive: true })));
  }
  resolve(bucket, key) {
    if (!['originals', 'previews', 'renders', 'temp'].includes(bucket)) throw new Error('Invalid media bucket');
    const target = path.resolve(this.root, bucket, path.basename(key));
    if (!target.startsWith(`${this.root}${path.sep}`)) throw new Error('Unsafe media path');
    return target;
  }
  async put(bucket, key, buffer) { await this.ensure(); const target = this.resolve(bucket, key); await fs.writeFile(target, buffer, { flag: 'wx' }); return `${bucket}/${path.basename(key)}`; }
  async adopt(bucket, key, sourcePath) { await this.ensure(); const target = this.resolve(bucket, key); await fs.rename(sourcePath, target); return `${bucket}/${path.basename(key)}`; }
  async remove(storageKey) { const [bucket, key] = storageKey.split('/'); await fs.rm(this.resolve(bucket, key), { force: true }); }
  async read(storageKey) { const [bucket, key] = storageKey.split('/'); return fs.readFile(this.resolve(bucket, key)); }
  pathFor(storageKey) { const [bucket, key] = storageKey.split('/'); return this.resolve(bucket, key); }
}
