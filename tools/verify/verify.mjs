#!/usr/bin/env node
// verify.mjs — cross-platform (macOS & Windows)
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');

/** Run a command, exit on failure */
function run(label, cmd, args) {
  console.log(`\n${label}`);
  const result = spawnSync(cmd, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: false,
  });
  if (result.status !== 0) {
    console.error(`── ${label} failed ──`);
    process.exit(result.status ?? 1);
  }
}

// Resolve npx/node executables (Windows needs .cmd suffix)
const isWin = process.platform === 'win32';
const npx = isWin ? 'npx.cmd' : 'npx';
const node = process.execPath; // always the current node binary

run(
  'Running lint on affected scope...',
  npx,
  ['nx', 'affected', '--target=lint', '--parallel'],
);

run(
  'Running i18n parity/hardcoded-literal check...',
  node,
  [resolve(__dirname, 'check-i18n.mjs')],
);

console.log('\nAll checks passed.');
