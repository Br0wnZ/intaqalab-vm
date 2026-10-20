import path from 'path';

export default {
  '*.{ts,html}': (files) => {
    const relFiles = files.map((file) => path.relative(process.cwd(), file).replace(/\\/g, '/'));
    return [
      `npx nx affected --target=lint --fix --outputStyle=stream --files=${relFiles.join(',')}`,
      `npx prettier --write ${relFiles.map((file) => `"${file}"`).join(' ')}`,
    ];
  },
  // Regla ADR-017: execution no declara URLs de lectura `/planning/` (Node puro, multiplataforma).
  'libs/domain/trial/execution/src/**/*.ts': () => 'node scripts/check-planning-urls.mjs',
  '*.{json,css,scss,md}': ['npx prettier --write'],
};
