#!/usr/bin/env node
/**
 * verify:watch — Cross-platform idle watcher for verification (macOS, Windows, Linux)
 * Triggers verification when no file changes have occurred for 2.5 seconds (idle state).
 */

import { watch } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, extname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const verifyScript = resolve(__dirname, 'verify.mjs');

const IDLE_DEBOUNCE_MS = 2500;
const WATCH_EXTENSIONS = new Set(['.ts', '.html', '.json']);
const IGNORED_PATHS = [
  'node_modules',
  '.git',
  '.nx',
  '.angular',
  'dist',
  'tmp',
  'coverage',
  '.agents',
  '.claude',
  '.cursor',
  '.codex',
];

const cliArgs = process.argv.slice(2);
const withI18n = cliArgs.includes('--with-i18n');
const filteredArgs = cliArgs.filter((arg) => arg !== '--with-i18n');
// Default to --no-i18n for fast developer iteration unless --with-i18n is explicitly requested
const passThroughArgs = withI18n
  ? filteredArgs
  : (filteredArgs.includes('--no-i18n') ? filteredArgs : ['--no-i18n', ...filteredArgs]);

let debounceTimer = null;
let isRunning = false;
let pendingTrigger = false;

function shouldWatch(filename) {
  if (!filename) return false;
  if (IGNORED_PATHS.some((ignored) => filename.includes(ignored))) return false;
  const ext = extname(filename);
  return WATCH_EXTENSIONS.has(ext);
}

function runVerification() {
  if (isRunning) {
    pendingTrigger = true;
    return;
  }

  isRunning = true;
  pendingTrigger = false;

  const timestamp = new Date().toLocaleTimeString();
  console.log(`\n⏳ [${timestamp}] System idle — running verification...`);

  const child = spawn(process.execPath, [verifyScript, ...passThroughArgs], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: false,
  });

  child.on('exit', (code) => {
    isRunning = false;
    const finishTime = new Date().toLocaleTimeString();
    if (code === 0) {
      console.log(`✅ [${finishTime}] Verification passed. Watching for changes...`);
    } else {
      console.log(`❌ [${finishTime}] Verification failed with code ${code}. Watching for changes...`);
    }

    if (pendingTrigger) {
      runVerification();
    }
  });
}

function handleFileChange(event, filename) {
  if (!shouldWatch(filename)) return;

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    runVerification();
  }, IDLE_DEBOUNCE_MS);
}

const watchDirs = ['libs', 'apps'];

console.log('👀 Starting verify:watch (idle trigger: 2.5s, mode: --no-i18n by default)...');
console.log(`📁 Watching: ${watchDirs.join(', ')} (*.ts, *.html, *.json)`);

for (const dir of watchDirs) {
  const fullDir = resolve(repoRoot, dir);
  try {
    watch(fullDir, { recursive: true }, (event, filename) => {
      handleFileChange(event, `${dir}/${filename}`);
    });
  } catch (err) {
    console.error(`⚠️ Could not watch directory ${dir}:`, err.message);
  }
}
