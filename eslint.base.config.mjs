import nx from '@nx/eslint-plugin';
import importX from 'eslint-plugin-import-x';
import jestDom from 'eslint-plugin-jest-dom';
import testingLibrary from 'eslint-plugin-testing-library';
import vitest from '@vitest/eslint-plugin';

// Degrada un mapa de reglas de plugin (recommended) a severidad 'warn',
// preservando las opciones de cada regla. Permite adoptar un ruleset sin
// bloquear la deuda existente; subir a 'error' regla a regla tras el burn-down.
function downgradeToWarn(rules) {
  return Object.fromEntries(
    Object.entries(rules).map(([id, value]) => {
      if (Array.isArray(value)) return [id, ['warn', ...value.slice(1)]];
      if (value === 'off' || value === 0) return [id, value];
      return [id, 'warn'];
    }),
  );
}

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
      // Prohíbe console.log/debug; permite info/warn/error para logging intencional.
      // En 'warn' mientras se limpian los ~37 logs existentes; subir a 'error' tras el burn-down.
      'no-console': ['warn', { allow: ['info', 'warn', 'error'] }],
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
  // ── RxJS: veto a .subscribe() manual en código fuente (no en specs). ──
  //    En 'warn' mientras se migra la deuda existente; subir a 'error' tras el burn-down.
  //    Se usa no-restricted-properties (id propio) para poder darle severidad
  //    independiente del no-restricted-syntax anterior.
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      'no-restricted-properties': [
        'warn',
        {
          property: 'subscribe',
          message:
            'RxJS: Evita .subscribe() manual. Usa toSignal()/httpResource o firstValueFrom(). Si es imprescindible, encadena takeUntilDestroyed().',
        },
      ],
    },
  },
  // ── Detección de ciclos de importación (a nivel de fichero). ──
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { 'import-x': importX },
    settings: {
      'import-x/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: 'tsconfig.base.json',
        },
      },
    },
    rules: {
      'import-x/no-cycle': ['error', { ignoreExternal: true }],
      'import-x/no-self-import': 'error',
    },
  },
  // ── Reglas de testing para specs (Vitest + Testing Library + jest-dom). ──
  //    En 'warn' para no bloquear los specs existentes; subir a 'error' tras el burn-down.
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx'],
    plugins: { vitest, 'testing-library': testingLibrary, 'jest-dom': jestDom },
    rules: {
      ...downgradeToWarn(vitest.configs.recommended.rules),
      ...downgradeToWarn(testingLibrary.configs['flat/angular'].rules),
      ...downgradeToWarn(jestDom.configs['flat/recommended'].rules),
      // Testing Library auto-asserta con sus queries; expect-expect da falsos positivos.
      'vitest/expect-expect': 'off',
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
