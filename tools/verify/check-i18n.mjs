#!/usr/bin/env node
// i18n ratchet check: locale key parity + hardcoded-literal detection.
//
// Compares current findings against tools/verify/i18n-baseline.json. Fails only on
// NEW missing keys or NEW hardcoded literals introduced since the baseline was taken —
// existing debt captured in the baseline does not block. Run with --update-baseline
// after intentionally fixing or knowingly adding debt to reset the baseline.
//
// Usage:
//   node tools/verify/check-i18n.mjs
//   node tools/verify/check-i18n.mjs --update-baseline

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const I18N_DIR = path.join(ROOT, 'apps/intaqalab/public/i18n');
const BASELINE_PATH = path.join(__dirname, 'i18n-baseline.json');
const LOCALES = ['es', 'en', 'de'];
const UPDATE_BASELINE = process.argv.includes('--update-baseline');

function flatten(obj, prefix = '') {
  return Object.entries(obj).flatMap(([key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) return flatten(value, nextKey);
    return [nextKey];
  });
}

function loadLocaleKeySets() {
  const sets = {};
  for (const locale of LOCALES) {
    const data = JSON.parse(fs.readFileSync(path.join(I18N_DIR, `${locale}.json`), 'utf8'));
    sets[locale] = new Set(flatten(data));
  }
  return sets;
}

function findMissingKeys() {
  const sets = loadLocaleKeySets();
  const allKeys = new Set(LOCALES.flatMap((l) => [...sets[l]]));
  const missing = {};
  for (const locale of LOCALES) {
    missing[locale] = [...allKeys].filter((k) => !sets[locale].has(k)).sort();
  }
  return missing;
}

function listSourceFiles() {
  const output = execSync(
    'git ls-files "apps/**/*.ts" "libs/**/*.ts" | grep -v ".spec.ts$"',
    { cwd: ROOT, maxBuffer: 1024 * 1024 * 50 },
  )
    .toString()
    .trim();
  return output ? output.split('\n') : [];
}

// Heuristic detectors for hardcoded, non-translated UI text in inline templates.
// Not a full HTML parser — good enough to ratchet against new violations.
const HARDCODED_PATTERNS = [
  { name: 'placeholder', re: /\bplaceholder="([A-Za-zÀ-ÿ][^{}"]{1,80})"/g, textGroup: 1 },
  { name: 'aria-label', re: /\baria-label="([A-Za-zÀ-ÿ][^{}"]{1,80})"/g, textGroup: 1 },
  {
    name: 'element-text',
    re: /<(button|mat-label|label)\b[^>]*>\s*([A-ZÀ-Ý][A-Za-zÀ-ÿ ]{2,40})\s*<\/\1>/g,
    textGroup: 2,
  },
];

function findHardcodedLiterals() {
  const findings = [];
  for (const file of listSourceFiles()) {
    const content = fs.readFileSync(path.join(ROOT, file), 'utf8');
    for (const { name, re, textGroup } of HARDCODED_PATTERNS) {
      re.lastIndex = 0;
      let match;
      while ((match = re.exec(content))) {
        const upToMatch = content.slice(0, match.index);
        const line = upToMatch.split('\n').length;
        findings.push(`${file}:${line}:${name}:${match[textGroup]}`);
      }
    }
  }
  return findings.sort();
}

function loadBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) return { missingKeys: { es: [], en: [], de: [] }, hardcoded: [] };
  return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
}

function saveBaseline(baseline) {
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n');
}

function diffNew(current, baseline) {
  const baselineSet = new Set(baseline);
  return current.filter((item) => !baselineSet.has(item));
}

function main() {
  const missingKeys = findMissingKeys();
  const hardcoded = findHardcodedLiterals();

  if (UPDATE_BASELINE) {
    saveBaseline({ missingKeys, hardcoded });
    console.info('i18n baseline updated:', BASELINE_PATH);
    return;
  }

  const baseline = loadBaseline();
  let hasNewIssues = false;

  for (const locale of LOCALES) {
    const newMissing = diffNew(missingKeys[locale], baseline.missingKeys?.[locale] ?? []);
    if (newMissing.length > 0) {
      hasNewIssues = true;
      console.error(`\n── i18n: new missing keys in ${locale}.json (${newMissing.length}) ──`);
      for (const key of newMissing) console.error(`  ${key}`);
    }
  }

  const newHardcoded = diffNew(hardcoded, baseline.hardcoded ?? []);
  if (newHardcoded.length > 0) {
    hasNewIssues = true;
    console.error(`\n── i18n: new hardcoded literal text (${newHardcoded.length}) ──`);
    for (const entry of newHardcoded) console.error(`  ${entry}`);
    console.error('\nWrap user-visible text with the translate pipe instead of a literal string.');
  }

  if (hasNewIssues) {
    console.error(
      '\nIf this is intentional (e.g. accepted debt), run `node tools/verify/check-i18n.mjs --update-baseline`.',
    );
    process.exit(1);
  }
}

main();
