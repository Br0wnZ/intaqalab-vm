## Endpoints Existentes

Archivo: `libs/shared/config/src/lib/environment.types.ts`

```typescript
export const Endpoints = {
  LinesOfShot: 'linesOfShot',
  FireTrials: 'fireTrials',
  Users: 'users',
  Clients: 'clients',
  FireTrialTypes: 'fireTrialTypes',
  Calendar: 'calendar',
  Documents: 'documents',
  MasterData: 'masterData',
  WhareHouse: 'whareHouse',
  Specimens: 'specimens',
  EventLog: 'eventLog',
  MunitionComponentTypes: 'munitionComponentTypes',
  MunitionDenominations: 'munitionDenominations',
  FuseWorkingModes: 'fuseWorkingModes',
  Planning: 'planning',
} as const;

export type ApiEndpointKey = (typeof Endpoints)[keyof typeof Endpoints];

export interface AppEnvironment {
  production: boolean;
  apiUrl: string;
  features: AppFeatures;
  endpoints: Record<ApiEndpointKey, string>;
}
```

## Funciones de Inyección

Archivo: `libs/shared/config/src/lib/config.functions.ts`

```typescript
/**
 * Construye la URL completa para un endpoint dado.
 * Normaliza slashes para evitar dobles barras o rutas rotas.
 */
export function injectApiEndpoint(endpointKey: ApiEndpointKey): string {
  const env = inject(APP_ENV);
  const path = env.endpoints[endpointKey];
  const baseUrl = env.apiUrl.endsWith('/') ? env.apiUrl.slice(0, -1) : env.apiUrl;
  const endpointPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${endpointPath}`;
}

// Funciones específicas por API:
export function injectPlanningEndpoint(): string {
  return injectApiEndpoint(Endpoints.Planning);
}

export function injectWharehouseEndpoint(): string {
  return injectApiEndpoint(Endpoints.WhareHouse);
}

export function injectFireTrialsEndpoint(): string {
  return injectApiEndpoint(Endpoints.FireTrials);
}
// ... una por cada API
```

## Cómo Registrar una Nueva API

### Paso 1: Añadir al enum `Endpoints`

```typescript
export const Endpoints = {
  // ... existentes
  NewApi: 'newApi', // ← Añadir aquí
} as const;
```

### Paso 2: Crear la función de inyección

```typescript
export function injectNewApiEndpoint(): string {
  return injectApiEndpoint(Endpoints.NewApi);
}
```

### Paso 3: Exportar desde el barrel

Verificar que `libs/shared/config/src/index.ts` exporta las nuevas funciones.

### Paso 4: Configurar en los environment files

Los archivos de environment (`environment.ts`, `environment.mock.ts`, etc.) deben incluir el path para el nuevo endpoint:

```typescript
endpoints: {
  // ...
  newApi: 'centers/' + centerId + '/new-api/1.0.0',
}
```

## Configuración de Proxy

Archivo: `apps/intaqalab/proxy.conf.js`

### Estructura

```javascript
const USE_LOCAL_MOCKS = true;

const API_TARGETS = {
  des: 'https://apis.des.inta.es',
  pre: 'https://apis.pre.inta.es',
  pro: 'https://apis.inta.es',
  mocks: 'http://localhost:3000',
};

const REMOTE_API_BASE_PATH = '/intaqalab';
const PLANNING_API_BASE_PATH = `${REMOTE_API_BASE_PATH}/planning-api/1.0.0`;
```

### Ejemplo: Regla de Proxy para Planning API

```javascript
proxyConfig['^/api/centers/[^/]+/planning-api'] = buildProxyRule({
  remotePathRewrite: {
    // fire-trials-scoped (3+ segments after version)
    '^/api/centers/([^/]+)/planning-api/[^/]+/([^/]+)/([^/]+)/(.+)': `${PLANNING_API_BASE_PATH}/centers/$1/fire-trials/$2/$3/$4`,
    // 2 segments after version
    '^/api/centers/([^/]+)/planning-api/[^/]+/([^/]+)/(.+)': `${PLANNING_API_BASE_PATH}/centers/$1/fire-trials/$2/$3`,
    // 1 segment (center-scoped catalogs)
    '^/api/centers/([^/]+)/planning-api/[^/]+/(.+)': `${PLANNING_API_BASE_PATH}/centers/$1/$2`,
  },
  mockPathRewrite: {
    '^/api/centers/([^/]+)/planning-api/[^/]+/([^/]+)/([^/]+)/(.+)': '/api/centers/$1/fire-trials/$2/$3/$4',
    '^/api/centers/([^/]+)/planning-api/[^/]+/([^/]+)/(.+)': '/api/centers/$1/fire-trials/$2/$3',
    '^/api/centers/([^/]+)/planning-api/[^/]+/(.+)': '/api/centers/$1/$2',
  },
});
```

### Cuándo Crear una Nueva Regla

- Si la nueva API usa un **base path diferente** (ej: `/new-api/1.0.0` vs `/planning-api/1.0.0`)
- Si la nueva API tiene un **pattern de routing único** que no encaja en reglas existentes

### Reglas ya cubiertas (NO necesitan nueva entrada)

Si los endpoints del Swagger usan el mismo `servers[0].url` que un endpoint ya configurado (ej: `planning-api/1.0.0`), NO necesitas nueva regla de proxy.

## Reglas Clave

1. **Verifica primero** — ¿El endpoint base ya existe en `Endpoints`? Si sí, no crees uno nuevo
2. **Convention de naming** — camelCase para el enum, `inject*Endpoint` para la función
3. **Proxy solo si es necesario** — La mayoría de endpoints por dominio ya están cubiertos
4. **Siempre 2 rewrites** — `remotePathRewrite` (para DES/PRE/PRO) y `mockPathRewrite` (para local)
