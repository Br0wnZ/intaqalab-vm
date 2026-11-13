#!/usr/bin/env node
/**
 * Genera `apps/intaqalab/src/assets/version.json` con metadatos de Git y GitLab CI
 * antes de compilar la aplicación Angular (`prebuild` / `version:generate`).
 *
 * Compatible con:
 * - GitLab CI runners (detached HEAD, shallow clones con GIT_DEPTH=1, variables CI_*)
 * - npm v10+ (`npm run build -- --configuration <des|pre|pro>` y `npm run build:<env>`)
 * - Ejecución local sin GitLab CI
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_FILE = path.join(ROOT_DIR, 'apps', 'intaqalab', 'src', 'assets', 'version.json');
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, 'package.json');

function git(cmd, fallback = '') {
  try {
    return execSync(`git ${cmd}`, {
      cwd: ROOT_DIR,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf-8',
    }).trim();
  } catch {
    return fallback;
  }
}

function detectEnvironment() {
  const args = process.argv.slice(2);

  // 1. Si se pasa flag `--configuration <env>` o `-c <env>`
  const cfgIdx = args.findIndex((arg) => arg === '--configuration' || arg === '-c');
  if (cfgIdx !== -1 && args[cfgIdx + 1]) {
    const val = args[cfgIdx + 1].toLowerCase();
    return val === 'production' ? 'pro' : val;
  }
  const inlineCfg = args.find((arg) => arg.startsWith('--configuration='));
  if (inlineCfg) {
    const val = inlineCfg.split('=')[1].toLowerCase();
    return val === 'production' ? 'pro' : val;
  }

  // 2. Argumento posicional directo (ej. `node scripts/generate-version.mjs des`)
  const positional = args.find((arg) => !arg.startsWith('-'));
  if (positional) {
    const val = positional.toLowerCase();
    return val === 'production' ? 'pro' : val;
  }

  // 3. Variable de entorno explícita en GitLab CI (`ENV`)
  if (process.env.ENV) {
    return process.env.ENV.toLowerCase();
  }

  // 4. Inferencia por rama de GitLab CI (`CI_COMMIT_BRANCH` / `CI_COMMIT_REF_NAME`) o rama Git local
  const branch =
    process.env.CI_COMMIT_BRANCH ||
    process.env.CI_COMMIT_REF_NAME ||
    git('rev-parse --abbrev-ref HEAD', '');

  if (branch === 'master' || branch === 'main') return 'pro';
  if (branch === 'preprod') return 'pre';
  if (branch === 'develop') return 'des';

  return 'local';
}

const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8'));

// Priorizar variables nativas de GitLab CI (en GitLab Runner el repo está en detached HEAD)
const sha = process.env.CI_COMMIT_SHA || git('rev-parse HEAD', 'unknown');
const shortSha =
  process.env.CI_COMMIT_SHORT_SHA ||
  (sha !== 'unknown' ? sha.slice(0, 8) : git('rev-parse --short HEAD', 'unknown'));

const rawBranch =
  process.env.CI_COMMIT_BRANCH ||
  process.env.CI_MERGE_REQUEST_SOURCE_BRANCH_NAME ||
  process.env.CI_COMMIT_REF_NAME ||
  git('rev-parse --abbrev-ref HEAD', 'unknown');

const branch = rawBranch === 'HEAD' ? process.env.CI_COMMIT_REF_NAME || 'detached' : rawBranch;

const tag = process.env.CI_COMMIT_TAG || git('describe --tags --exact-match', '');
const commitSubject =
  process.env.CI_COMMIT_TITLE ||
  (process.env.CI_COMMIT_MESSAGE ? process.env.CI_COMMIT_MESSAGE.split(/\r?\n/)[0] : '') ||
  git('log -1 --format=%s', '');
const commitDate = process.env.CI_COMMIT_TIMESTAMP || git('log -1 --format=%cI', '');
const commitAuthor = process.env.GITLAB_USER_NAME || git('log -1 --format=%an', '');

const versionInfo = {
  app: pkg.name || 'intaqalab',
  version: pkg.version || '0.0.0',
  environment: detectEnvironment(),
  commit: {
    sha,
    shortSha,
    branch,
    tag: tag || null,
    subject: commitSubject,
    author: commitAuthor,
    committedAt: commitDate,
  },
  build: {
    builtAt: new Date().toISOString(),
    pipelineId: process.env.CI_PIPELINE_ID || null,
    pipelineIid: process.env.CI_PIPELINE_IID || null,
    jobId: process.env.CI_JOB_ID || null,
    imageTag: process.env.CI_PIPELINE_IID ? `1.0.${process.env.CI_PIPELINE_IID}` : null,
  },
};

fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(versionInfo, null, 2) + '\n', 'utf-8');

console.log(
  `[version] Generated ${path.relative(ROOT_DIR, OUTPUT_FILE)} -> env=${versionInfo.environment} sha=${versionInfo.commit.shortSha} (${versionInfo.commit.branch})`,
);
