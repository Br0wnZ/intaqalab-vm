export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'body-leading-blank': [2, 'always'],
    'footer-leading-blank': [2, 'always'],
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'],
    ],
    'scope-case': [2, 'always', 'kebab-case'],
    'scope-enum': [2, 'always', ['intaqalab', 'admin', 'calendar', 'master-data', 'trial', 'ware-house', 'event-log']],
    'subject-max-length': [2, 'always', 100],
  },
};
