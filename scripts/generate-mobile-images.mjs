import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve('public/images/lune');
const MOBILE_WIDTH = 750;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

for await (const file of walk(ROOT)) {
  if (!/\.(webp|jpe?g|png)$/i.test(file) || /-mobile\.webp$/i.test(file)) continue;
  const meta = await sharp(file).metadata();
  if ((meta.width ?? 0) <= 900) continue;
  const out = file.replace(/\.(webp|jpe?g|png)$/i, '-mobile.webp');
  await sharp(file).resize({ width: MOBILE_WIDTH }).webp({ quality: 78 }).toFile(out);
  const { size } = await stat(out);
  console.log(`${path.relative(ROOT, out)} ${(size / 1024).toFixed(0)} KB`);
}
