#!/usr/bin/env node
// Regla de tráfico `/planning/`: cero URLs de lectura de planning en execution fuera de data-access-planning.
// Node puro (sin grep/shell) para funcionar igual en macOS, Linux y Windows.
// Uso: npm run check:planning-urls  (también se ejecuta en el pre-commit vía lint-staged)
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCOPE_DIR = path.join(ROOT_DIR, 'libs', 'domain', 'trial', 'execution', 'src');
const PATTERN =
  /planning\/(series|conditions|munitions|armament|measures|propelling-charge-parameters|stanag-criteria)/;
// Líneas de comentario (JSDoc / línea) que citan el endpoint no cuentan como URL.
const COMMENT_LINE = /^\s*(\*|\/\/|\/\*)/;

function collectSourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(fullPath);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts') ? [fullPath] : [];
  });
}

const offenders = collectSourceFiles(SCOPE_DIR).flatMap((file) =>
  fs
    .readFileSync(file, 'utf-8')
    .split(/\r?\n/)
    .flatMap((line, index) =>
      PATTERN.test(line) && !COMMENT_LINE.test(line)
        ? [`${path.relative(ROOT_DIR, file).replace(/\\/g, '/')}:${index + 1}: ${line.trim()}`]
        : [],
    ),
);

if (offenders.length > 0) {
  console.error(
    'URLs de lectura de planning fuera de @intaqalab/data-access-planning (usa sus servicios query):\n' +
      offenders.join('\n'),
  );
  process.exit(1);
}
console.log('check:planning-urls OK');
