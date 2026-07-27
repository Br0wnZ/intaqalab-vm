import path from 'path';

export default {
  '*.{ts,html}': (files) => {
    const relFiles = files.map((file) => path.relative(process.cwd(), file).replace(/\\/g, '/'));
    return [
      `npx nx affected --target=lint --fix --no-daemon --outputStyle=stream --files=${relFiles.join(',')}`,
      `npx prettier --write ${relFiles.map((file) => `"${file}"`).join(' ')}`,
    ];
  },
  '*.{json,css,scss,md}': ['npx prettier --write'],
};

