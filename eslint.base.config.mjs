import nx from '@nx/eslint-plugin';

const baseConfig = [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            // ── App: puede importar features, core, shared y demos ──
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: ['type:feature', 'type:core', 'type:ui', 'type:data-access', 'type:util', 'type:theme', 'type:demo'],
            },
            // ── Feature: consume shared libs y core ──
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: ['type:ui', 'type:data-access', 'type:util', 'type:core', 'type:theme', 'type:feature'],
            },
            // ── Core: capa transversal (interceptors, auth, guards) ──
            {
              sourceTag: 'type:core',
              onlyDependOnLibsWithTags: ['type:ui', 'type:data-access', 'type:util', 'type:theme'],
            },
            // ── UI: solo utilidades y theme ──
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:util', 'type:theme'],
            },
            // ── Data-access: solo utilidades ──
            {
              sourceTag: 'type:data-access',
              onlyDependOnLibsWithTags: ['type:util'],
            },
            // ── Util: solo otras utilidades ──
            {
              sourceTag: 'type:util',
              onlyDependOnLibsWithTags: ['type:util'],
            },
            // ── Theme: no depende de nada ──
            {
              sourceTag: 'type:theme',
              onlyDependOnLibsWithTags: [],
            },
            // ── Demo y mock: acceso completo (solo dev) ──
            {
              sourceTag: 'type:demo',
              onlyDependOnLibsWithTags: ['type:feature', 'type:core', 'type:ui', 'type:data-access', 'type:util', 'type:theme'],
            },
            {
              sourceTag: 'type:mock',
              onlyDependOnLibsWithTags: ['type:util', 'type:data-access'],
            },
          ],
        },
      ],
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      'object-shorthand': 'error',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.ts', '*.mts', '*.cts', '*.js', '*.mjs', '*.cjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts', '**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Decorator[expression.callee.name="Input"]',
          message: 'Signal API: Reemplaza @Input() por la signal input() o input.required().',
        },
        {
          selector: 'Decorator[expression.callee.name="Output"]',
          message: 'Signal API: Reemplaza @Output() por la función output().',
        },
        {
          selector: 'PropertyDefinition[accessibility="private"]',
          message: 'Hard Privacy: Usa el prefijo # en lugar del modificador "private" de TypeScript.',
        },
        {
          selector: 'MethodDefinition[accessibility="private"]',
          message: 'Hard Privacy: Usa el prefijo # en lugar del modificador "private" de TypeScript.',
        },
      ],
    },
  },
];

export function angularLibConfig(prefix) {
  return [
    ...baseConfig,
    ...nx.configs['flat/angular'],
    ...nx.configs['flat/angular-template'],
    {
      files: ['**/*.ts'],
      rules: {
        '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix, style: 'camelCase' }],
        '@angular-eslint/component-selector': ['error', { type: 'element', prefix, style: 'kebab-case' }],
      },
    },
  ];
}

export default baseConfig;
