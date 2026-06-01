import { angularLibConfig } from './eslint.base.config.mjs';

export default [
  ...angularLibConfig('app'),
  {
    ignores: ['**/dist', '**/vitest.config.*.timestamp*'],
  },
];
