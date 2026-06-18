# Mock Fixtures y Dispatchers (`mocks/src/fixtures/`)

Los fixtures son datos estáticos en JSON y los dispatchers son funciones TypeScript que encapsulan lógica dinámica sobre esos datos (filtrado, paginación, mutación in-memory).

## Estructura de Directorio

```
mocks/src/fixtures/
├── armament/
│   ├── catalog-dispatcher.ts           ← Dispatcher con filtrado y paginación
│   ├── trial-armament-dispatcher.ts    ← Dispatcher con store mutable
│   └── trial-armament-fixture.json     ← Datos estáticos
├── trial-planning/
│   ├── series-and-shots-fixture.json
│   ├── specimens-fixture.json
│   ├── specimens-dispatcher.ts         ← Dispatcher simple
│   ├── target-types-fixture.json
│   └── ...
└── measures.ts                         ← Datos exportados directamente
```

## Utilidades Compartidas

Archivo: `mocks/src/utils.ts`

```typescript
import * as fs from 'fs';
import * as path from 'path';

/**
 * Lee un fixture JSON desde disco.
 * @param fixturePath  ruta relativa desde src/
 * @param fixtureName  nombre del archivo incluyendo extensión
 */
export function getFixture<T = any>(fixturePath: string, fixtureName: string): T {
  const fixturePath2 = path.join(__dirname, ...fixturePath.split('/'));
  const fullFilePath = `${fixturePath2}${path.sep}${fixtureName}`;
  const content = fs.readFileSync(fullFilePath, { encoding: 'utf8' });
  return JSON.parse(content) as T;
}

export function paginate<T>(allData: T[], params: RequestPaginationParams): PaginatedApiResponse<T> {
  const { pageSize, page } = params;
  const totalElements = allData.length;
  const startIndex = (page - 1) * pageSize;
  const paginatedData = allData.slice(startIndex, startIndex + pageSize);
  return { page, pageSize, totalElements, items: paginatedData };
}

export function searchableByName<T extends { name: string }>(allData: T[], params: { name?: string }): T[] {
  if (!params.name?.trim()) return allData;
  const name = params.name.toLocaleLowerCase();
  return allData.filter((e) => e.name.toLocaleLowerCase().includes(name));
}

export function getPagination(req: any): { page: number; pageSize: number } {
  const page = parseInt(req.query.page as string, 10) || 1;
  const pageSize = parseInt(req.query.pageSize as string, 10) || 25;
  return { page, pageSize };
}
```

## Ejemplo Real: Dispatcher Simple (Fixture Estático)

Archivo: `mocks/src/fixtures/trial-planning/specimens-dispatcher.ts`

```typescript
import type { Request } from 'express';
import { getFixture } from '../../utils';

type Specimen = {
  id: string;
  name: string;
  type: string;
  active: boolean;
};

type PaginatedSpecimens = {
  page: number;
  pageSize: number;
  totalElements: number;
  items: Specimen[];
};

export const specimensDispatcher = (req: Request) => {
  const specimens = getFixture('fixtures/trial-planning', 'specimens-fixture.json') as PaginatedSpecimens;
  return specimens;
};
```

## Ejemplo Real: Dispatcher con Filtrado y Paginación

Archivo: `mocks/src/fixtures/armament/catalog-dispatcher.ts`

```typescript
import type { Request } from 'express';
import { getFixture } from '../../utils';

interface SpecimenItem {
  id: string;
  name: string;
  type: 'WEAPON' | 'TUBE' | 'MUNITION';
  active: boolean;
}

interface PaginatedResponse<T> {
  page: number;
  pageSize: number;
  totalElements: number;
  items: T[];
}

function parseQueryParams(req: Request) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 100;
  const name = req.query.name as string | undefined;
  const active = req.query.active !== undefined ? req.query.active === 'true' : undefined;
  return { page, pageSize, name, active };
}

export function createWeaponsCatalogDispatcher() {
  const allSpecimens: SpecimenItem[] = getFixture<{ items: SpecimenItem[] }>(
    'fixtures/trial-planning',
    'specimens-fixture.json',
  ).items;

  const getAll = (req: Request): PaginatedResponse<SpecimenItem> => {
    const params = parseQueryParams(req);
    let filtered = allSpecimens.filter((item) => item.type === 'WEAPON');

    if (params.active !== undefined) {
      filtered = filtered.filter((item) => item.active === params.active);
    }
    if (params.name) {
      const searchTerm = params.name.toLowerCase();
      filtered = filtered.filter((item) => item.name.toLowerCase().includes(searchTerm));
    }

    const totalElements = filtered.length;
    const startIndex = (params.page - 1) * params.pageSize;
    const items = filtered.slice(startIndex, startIndex + params.pageSize);

    return { page: params.page, pageSize: params.pageSize, totalElements, items };
  };

  return { getAll };
}
```

## Ejemplo Real: Dispatcher con Store In-Memory Mutable

Archivo: `mocks/src/fixtures/armament/trial-armament-dispatcher.ts`

```typescript
import type { Request } from 'express';
import { getFixture } from '../../utils';

interface TrialArmamentResponse {
  series: SeriesArmamentData[];
}
// ... (interfaces omitidas por brevedad)

const trialArmamentStore: Map<string, TrialArmamentResponse> = new Map();
const defaultFixture = getFixture<TrialArmamentResponse>('fixtures/armament', 'trial-armament-fixture.json');

export function getArmamentDispatcher(req: Request): TrialArmamentResponse {
  const { fireTrialId } = req.params;
  const storedData = trialArmamentStore.get(fireTrialId);
  if (storedData) return storedData;

  const clonedFixture = JSON.parse(JSON.stringify(defaultFixture)) as TrialArmamentResponse;
  trialArmamentStore.set(fireTrialId, clonedFixture);
  return clonedFixture;
}

export function updateArmamentDispatcher(req: Request): TrialArmamentResponse {
  const { fireTrialId } = req.params;
  const body = req.body as ArmamentBulkUpdateRequest;

  let currentData = trialArmamentStore.get(fireTrialId);
  if (!currentData) {
    currentData = JSON.parse(JSON.stringify(defaultFixture)) as TrialArmamentResponse;
  }

  // Actualizar shots con los datos del body
  for (const shotUpdate of body.shots) {
    for (const series of currentData.series) {
      const shot = series.shots.find((s) => s.shotId === shotUpdate.shotId);
      if (shot) {
        if (!shot.armament) shot.armament = {};
        if (shotUpdate.weaponExternalId) {
          shot.armament.weaponExternalId = shotUpdate.weaponExternalId;
          shot.armament.weaponName = `Weapon ${shotUpdate.weaponExternalId.substring(0, 8)}`;
        }
        // ... más campos
        break;
      }
    }
  }

  trialArmamentStore.set(fireTrialId, currentData);
  return currentData;
}
```

## Ejemplo Real: Fixture JSON

Archivo: `mocks/src/fixtures/armament/trial-armament-fixture.json`

> Genera datos realistas con UUIDs, nombres coherentes con el dominio y al menos 3-5 elementos para listas.

```json
{
  "series": [
    {
      "seriesId": "550e8400-e29b-41d4-a716-446655440100",
      "seriesName": "Serie 1 - Prueba Estándar",
      "shots": [
        {
          "shotId": "550e8400-e29b-41d4-a716-446655440200",
          "armament": {
            "weaponName": "Cañón Mk-42 155mm",
            "weaponExternalId": "550e8400-e29b-41d4-a716-446655440300",
            "tubeName": "Tubo L/52 #001",
            "tubeExternalId": "550e8400-e29b-41d4-a716-446655440400",
            "isInstrumented": true,
            "tubeLifePercentage": 85.5,
            "observations": "Sin anomalías"
          }
        }
      ]
    }
  ]
}
```

## Cuándo Usar Cada Patrón

| Necesidad | Patrón | Ejemplo |
|-----------|--------|---------|
| Datos estáticos sin búsqueda | `getFixture()` directo en la route | Target types, dimensions |
| Datos con paginación/filtrado | Dispatcher con `parseQueryParams` | Weapons catalog, measures |
| Datos mutables (PUT/POST) | Map in-memory + JSON.parse(JSON.stringify) para clonar | Trial armament |
| Datos con lista exportada | Export de array TS (no JSON) | `MEASURES_CATALOG` |

## Reglas Clave

1. **JSON fixtures en la ruta correcta** — `mocks/src/fixtures/<domain>/<entity>-fixture.json`
2. **Dispatchers junto al fixture** — Si el fixture necesita lógica, crea un `*-dispatcher.ts` al lado
3. **Clonar antes de mutar** — `JSON.parse(JSON.stringify(fixture))` para evitar corromper el original
4. **Datos realistas** — Usar ejemplos del Swagger y UUIDs reales
5. **Mínimo 3-5 items** — En listas paginadas

