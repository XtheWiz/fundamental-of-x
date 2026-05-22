// Build + publish in one shot.
//
// 1. Resets index.html from the pristine template (Vite mutates it during
//    build by injecting hashed asset refs; if we didn't reset, the NEXT
//    build would read those hashed refs as inputs and double-hash them).
// 2. Wipes the previous build's /assets/ folder at root so stale hashed
//    chunks don't accumulate.
// 3. Runs `vite build` (outputs to dist/).
// 4. Copies dist/* into the repo root so GitHub Pages serves the built
//    site from main without a settings change.
//
// All other root files (CNAME, .nojekyll, topics/, css/, js/, i18n/,
// favicons) are left untouched.

import { promises as fs } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const template = path.join(root, 'index.html.template');
const indexHtml = path.join(root, 'index.html');
const assetsDir = path.join(root, 'assets');

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  for (const entry of await fs.readdir(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) await copyDir(s, d);
    else await fs.copyFile(s, d);
  }
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: false });
    p.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`)));
  });
}

async function main() {
  await fs.copyFile(template, indexHtml);
  console.log('index.html reset from template.');
  await fs.rm(assetsDir, { recursive: true, force: true });
  await fs.rm(dist, { recursive: true, force: true });

  await run('npx', ['vite', 'build']);

  await copyDir(dist, root);
  console.log('Build copied to repo root.');
}

main().catch((e) => { console.error(e); process.exit(1); });
