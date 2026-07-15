import path from 'path';

export default {
  '*.{ts,html}': (files) => {
    const relFiles = files.map((file) => path.relative(process.cwd(), file).replace(/\\/g, '/'));
    return [
      `nx affected --target=lint --fix --no-daemon --files=${relFiles.join(',')}`,
      `prettier --write ${relFiles.map((file) => `"${file}"`).join(' ')}`,
    ];
  },
  '*.{json,css,scss,md}': ['prettier --write'],
};
