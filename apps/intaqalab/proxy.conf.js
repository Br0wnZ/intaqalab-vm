// Cambia este valor a false para usar un entorno remoto definido por PROXY_TARGET
const USE_LOCAL_MOCKS = process.env['PROXY_TARGET'] === 'mocks' || process.env['VITE_MOCKS_AUTH'] === 'true' || (process.argv.some(arg => arg.includes(':mocks') || arg.includes('mocks')));

const DEFAULT_REMOTE_TARGET = 'des';
const PROXY_TARGET = USE_LOCAL_MOCKS ? 'mocks' : (process.env['PROXY_TARGET'] ?? DEFAULT_REMOTE_TARGET);

const API_TARGETS = {
  des: 'https://apis.des.inta.es',
  pre: 'https://apis.pre.inta.es',
  pro: 'https://apis.inta.es',
  mocks: 'http://localhost:3000',
};

const REMOTE_API_BASE_PATH = '/intaqalab';
const FIRE_TRIALS_API_BASE_PATH = `${REMOTE_API_BASE_PATH}/fire-trials-api/1.0.0`;
const CLIENTS_API_BASE_PATH = `${REMOTE_API_BASE_PATH}/clients-api/1.0.0`;
const USERS_API_BASE_PATH = `${REMOTE_API_BASE_PATH}/users-api/1.0.0`;
const PLANNING_API_BASE_PATH = `${REMOTE_API_BASE_PATH}/planning-api/1.1.0`;
const EXECUTION_API_BASE_PATH = `${REMOTE_API_BASE_PATH}/execution-api/1.0.0`;

const activeTargetKey = API_TARGETS[PROXY_TARGET] ? PROXY_TARGET : USE_LOCAL_MOCKS ? 'mocks' : DEFAULT_REMOTE_TARGET;
const activeTargetUrl = API_TARGETS[activeTargetKey];
const isRemote = activeTargetKey !== 'mocks';

console.log(`\n🔀 [proxy] Entorno activo: ${activeTargetKey} → ${activeTargetUrl}\n`);

if (USE_LOCAL_MOCKS) {
  console.log('\n🧪 [proxy] Modo mocks local activado\n');
}

/**
 * Construye una regla de proxy que SIEMPRE apunta a los mocks locales,
 * independientemente del entorno activo (des, pre, pro, mocks).
 */
function buildAlwaysMockRule(mockPathRewrite = {}) {
  const mocksUrl = API_TARGETS['mocks'];
  console.log(`\n🔒 [proxy] Endpoint forzado a mocks: ${JSON.stringify(mockPathRewrite)}\n`);
  return {
    target: mocksUrl,
    secure: false,
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: mockPathRewrite,
    bypass(req) {
      if (req.url.startsWith('/api')) {
        let finalPath = req.url;
        for (const [pattern, replacement] of Object.entries(mockPathRewrite)) {
          const regex = new RegExp(pattern);
          if (regex.test(finalPath)) {
            finalPath = finalPath.replace(regex, replacement);
            break;
          }
        }
        console.log(`\n🧪 [Proxy/Always-Mock] ${req.method} ${req.url}`);
        console.log(`   👉 Destino Final: ${mocksUrl}${finalPath}`);
      }
    },
    onError(err, req) {
      console.error(`\n❌ [Proxy/Always-Mock Error] ${req.url}: ${err.message}`);
    },
  };
}

function buildProxyRule({ remotePathRewrite = {}, mockPathRewrite = {} }) {
  const targetDomain = activeTargetUrl;
  const pathRewrite = isRemote ? remotePathRewrite : mockPathRewrite;
  const isSecure = targetDomain.startsWith('https');

  return {
    target: targetDomain,
    secure: isSecure,
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite,
    bypass(req) {
      if (req.url.startsWith('/api')) {
        // Calculamos la ruta final para mostrarla en el log
        let finalPath = req.url;
        for (const [pattern, replacement] of Object.entries(pathRewrite)) {
          const regex = new RegExp(pattern);
          if (regex.test(finalPath)) {
            finalPath = finalPath.replace(regex, replacement);
            break;
          }
        }
        console.log(`\n🕵️‍♂️ [Proxy] Petición interceptada: ${req.method} ${req.url}`);
        console.log(`   👉 Destino Final: ${targetDomain}${finalPath}`);
      }
    },
    // Handler para capturar errores de proxy
    onError(err, req) {
      console.error(`\n❌ [Proxy Error] Hubo un problema conectando al endpoint:`);
      console.error(`   - Target: ${targetDomain}`);
      console.error(`   - Ruta: ${req.url}`);
      console.error(`   - Error: ${err.message}`);
    },
  };
}

// 3. Definición de Rutas (Formato Object / Diccionario)
// Vite soporta mapear por clave de ruta en lugar de array
const proxyConfig = {};

// Excepciones (Priority Rules)
// centers-api siempre necesita la ruta versionada, tanto en mocks como en remoto.
proxyConfig['/api/centers-api'] = buildProxyRule({
  remotePathRewrite: {
    '^/api/centers-api': `${REMOTE_API_BASE_PATH}/centers-api/1.0.0/centers`,
  },
  mockPathRewrite: {
    '^/api/centers-api': '/api/centers',
  },
});

// Fire Trials API
// /centers/{centerId}/fire-trials-api/1.0.0...
proxyConfig['^/api/centers/[^/]+/fire-trials-api'] = buildProxyRule({
  remotePathRewrite: {
    '^/api/centers/([^/]+)/fire-trials-api/[^/]+': `${FIRE_TRIALS_API_BASE_PATH}/centers/$1`,
  },
  mockPathRewrite: {
    '^/api/centers/([^/]+)/fire-trials-api/[^/]+': '/api/centers/$1',
  },
});

// Fire Trials API
// /centers/{centerId}/calendar-api/1.0.0...
proxyConfig['^/api/centers/[^/]+/calendar-api'] = buildProxyRule({
  remotePathRewrite: {
    '^/api/centers/([^/]+)/calendar-api/[^/]+': `${FIRE_TRIALS_API_BASE_PATH}/centers/$1/calendar`,
  },
  mockPathRewrite: {
    '^/api/centers/([^/]+)/calendar-api/[^/]+': '/api/centers/$1/calendar',
  },
});

// Fire Trials API
// /centers/{centerId}/lines-of-shot-api/1.0.0...
proxyConfig['^/api/centers/[^/]+/lines-of-shot-api'] = buildProxyRule({
  remotePathRewrite: {
    '^/api/centers/([^/]+)/lines-of-shot-api/[^/]+': `${FIRE_TRIALS_API_BASE_PATH}/centers/$1/lines-of-shoot`,
  },
  mockPathRewrite: {
    '^/api/centers/([^/]+)/lines-of-shot-api/[^/]+': '/api/centers/$1/lines-of-shoot',
  },
});

// Fire Trials API
// /fire-trial-types-api/1.0.0... (sin center, usa SKIP_CENTER_INTERCEPTOR)
proxyConfig['^/api/fire-trial-types-api'] = buildProxyRule({
  remotePathRewrite: {
    '^/api/fire-trial-types-api/[^/]+': `${FIRE_TRIALS_API_BASE_PATH}/fire-trial-types`,
  },
  mockPathRewrite: {
    '^/api/fire-trial-types-api/[^/]+': '/api/fire-trial-types',
  },
});

// Clients API — /intaqalab/clients-api/1.0.0/clients (sin center, usa SKIP_CENTER_INTERCEPTOR)
proxyConfig['^/api/clients-api'] = buildProxyRule({
  remotePathRewrite: {
    '^/api/clients-api/[^/]+': `${CLIENTS_API_BASE_PATH}/clients`,
  },
  mockPathRewrite: {
    '^/api/clients-api/[^/]+': '/api/clients',
  },
});

// Users API — /intaqalab/users-api/1.0.0/users (sin center, usa SKIP_CENTER_INTERCEPTOR)
proxyConfig['^/api/users-api'] = buildProxyRule({
  remotePathRewrite: {
    '^/api/users-api/.*': `${USERS_API_BASE_PATH}/users`,
  },
  mockPathRewrite: {
    '^/api/users-api/.*': '/api/users',
  },
});

// Fire Trials Documents API
// /centers/{centerId}/fire-trials-documents-api/1.0.0/... (con center)
// Dos tipos de rutas:
// 1. Trial-scoped: .../fire-trials/{trialId}/documents...
// 2. Document-scoped: .../documents/{documentId}...
proxyConfig['^/api/centers/[^/]+/fire-trials-documents-api'] = buildProxyRule({
  remotePathRewrite: {
    '^/api/centers/([^/]+)/fire-trials-documents-api/([^/]+)(.*)': `${REMOTE_API_BASE_PATH}/fire-trials-documents-api/$2/centers/$1$3`,
  },
  mockPathRewrite: {
    // Rutas trial-scoped: /fire-trials/{id}/documents... → pasan tal cual (trialsRouter las maneja)
    '^/api/centers/([^/]+)/fire-trials-documents-api/[^/]+(/fire-trials/.*)': '/api/centers/$1$2',
    // Rutas document-scoped: /documents/{documentId}... → pasan tal cual (el servicio ya incluye /documents)
    '^/api/centers/([^/]+)/fire-trials-documents-api/[^/]+(.*)': '/api/centers/$1$2',
  },
});

// Fire Trials Documents API
// /document-types (sin center, usa SKIP_CENTER_INTERCEPTOR)
proxyConfig['^/api/fire-trials-documents-api'] = buildProxyRule({
  remotePathRewrite: { '^/api': REMOTE_API_BASE_PATH },
  mockPathRewrite: {
    '^/api/fire-trials-documents-api/[^/]+': '/api',
  },
});

// Planning API
// /centers/{centerId}/planning-api/1.0.0...
// Routes with 2+ path segments after version (e.g. {trialId}/planning/info) are fire-trials-scoped.
// Routes with 1 path segment (e.g. target-types) are center-scoped catalogs.
proxyConfig['^/api/centers/[^/]+/planning-api'] = buildProxyRule({
  remotePathRewrite: {
    '^/api/centers/([^/]+)/planning-api/[^/]+/([^/]+)/([^/]+)/(.+)': `${PLANNING_API_BASE_PATH}/centers/$1/fire-trials/$2/$3/$4`,
    '^/api/centers/([^/]+)/planning-api/[^/]+/([^/]+)/(.+)': `${PLANNING_API_BASE_PATH}/centers/$1/fire-trials/$2/$3`,
    '^/api/centers/([^/]+)/planning-api/[^/]+/(.+)': `${PLANNING_API_BASE_PATH}/centers/$1/$2`,
  },
  mockPathRewrite: {
    // Strip planning-api/version/ → mock server gets /api/centers/{id}/{rest} which
    // matches existing routes (fire-trials, specimens, target-types, etc.) directly.
    '^/api/centers/([^/]+)/planning-api/[^/]+/(.+)': '/api/centers/$1/$2',
  },
});

// Execution API
// /centers/{centerId}/execution-api/1.0.0/fire-trials/{fireTrialId}/execution/...
// Maps to: /centers/{centerId}/fire-trials/{fireTrialId}/execution/...
proxyConfig['^/api/centers/[^/]+/execution-api'] = buildProxyRule({
  remotePathRewrite: {
    '^/api/centers/([^/]+)/execution-api/[^/]+(/.*)': `${EXECUTION_API_BASE_PATH}/centers/$1$2`,
  },
  mockPathRewrite: {
    // Strip execution-api/version/ → mock gets /api/centers/{id}/fire-trials/{trialId}/execution/...
    '^/api/centers/([^/]+)/execution-api/[^/]+(/.*)': '/api/centers/$1$2',
  },
});

// Warehouse API
// /centers/{centerId}/warehouse-api/1.0.0/warehouse/munition-types|denominations...
// La URL tiene estructura: warehouse-api/1.0.0/warehouse/<recurso>
// Hay que stripear "warehouse-api/version/warehouse/" para que el mock reciba /:centerId/warehouse/<recurso>
proxyConfig['^/api/centers/[^/]+/warehouse-api'] = buildProxyRule({
  remotePathRewrite: {
    '^/api/centers/([^/]+)/warehouse-api/[^/]+/(.+)': `${REMOTE_API_BASE_PATH}/centers/$1/warehouse/$2`,
  },
  mockPathRewrite: {
    '^/api/centers/([^/]+)/warehouse-api/[^/]+/warehouse/(.+)': '/api/centers/$1/warehouse/$2',
    '^/api/centers/([^/]+)/warehouse-api/[^/]+/(.+)': '/api/centers/$1/warehouse/$2',
  },
});

// Fuse Working Modes API
// /centers/{centerId}/fuse-working-modes-api/1.0.0...
proxyConfig['^/api/centers/[^/]+/fuse-working-modes-api'] = buildProxyRule({
  remotePathRewrite: {
    '^/api/centers/([^/]+)/fuse-working-modes-api/[^/]+(.*)': `${REMOTE_API_BASE_PATH}/centers/$1/fuse-working-modes$2`,
  },
  mockPathRewrite: {
    '^/api/centers/([^/]+)/fuse-working-modes-api/[^/]+(.*)': '/api/centers/$1/fuse-working-modes$2',
  },
});

// Regla Default
// Se aplica a cualquier /api que no haya machacado una regla más específica arriba
proxyConfig['/api'] = buildProxyRule({
  remotePathRewrite: { '^/api': REMOTE_API_BASE_PATH }, // En pre/pro/des el path base es /intaqalab
});

module.exports = proxyConfig;
