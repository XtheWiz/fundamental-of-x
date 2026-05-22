// Copies the Vite build output (dist/) into the repo root so GitHub Pages
// can serve it from main. Preserves existing vanilla files (topics/, css/,
// js/, i18n/, CNAME, favicons) by only overwriting what Vite built.
//
// Run via `npm run publish`. The deploy itself is `git add . && git push`
// afterwards — committing the freshly built index.html + assets/.

import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  for (const entry of await fs.readdir(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) await copyDir(s, d);
    else await fs.copyFile(s, d);
  }
}

// Wipe the previous build's `assets/` directory at root (Vite hashes filenames
// per build, so stale chunks would accumulate). Leave all other root files alone.
async function cleanStaleAssets() {
  const assetsAtRoot = path.join(root, 'assets');
  await fs.rm(assetsAtRoot, { recursive: true, force: true });
}

async function main() {
  try {
    await fs.access(dist);
  } catch {
    console.error('dist/ not found — run `npm run build` first.');
    process.exit(1);
  }
  await cleanStaleAssets();
  await copyDir(dist, root);
  console.log('Build copied to repo root.');
}

main().catch((e) => { console.error(e); process.exit(1); });
