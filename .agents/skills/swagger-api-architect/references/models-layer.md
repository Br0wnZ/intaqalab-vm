# Capa de Modelos (`utils-models/`)

Los modelos TypeScript se generan a partir de la sección `components.schemas` del Swagger. Son tipos puros sin lógica, usados tanto por los servicios como por los stores.

## Convenciones de Nomenclatura

## Mapeo de Tipos Swagger → TypeScript

| Swagger Type                      | TypeScript Type              |
| --------------------------------- | ---------------------------- |
| `string`                          | `string`                     |
| `string` + `format: uuid`         | `string`                     |
| `string` + `format: date`         | `string`                     |
| `integer`                         | `number`                     |
| `number`                          | `number`                     |
| `boolean`                         | `boolean`                    |
| `array` + `items`                 | `T[]`                        |
| `object` + `additionalProperties` | `Record<string, string>`     |
| `$ref`                            | Import del tipo referenciado |

## Ejemplo Real: Armament Models

Archivo: `libs/domain/trial/planning/src/lib/utils-models/armament.model.ts`

```typescript
import type { SpecimenItem } from './catalog.model';

export type ArmamentData = {
  weaponName?: string;
  weaponExternalId?: string;
  tubeName?: string;
  tubeExternalId?: string;
  isInstrumented?: boolean;
  tubeLifePercentage?: number;
  observations?: string;
};

export type ShotArmamentData = {
  shotId: string;
  armament?: ArmamentData;
};

export type SeriesArmamentData = {
  seriesId: string;
  seriesName: string;
  shots: ShotArmamentData[];
};

export type TrialArmamentResponse = {
  series: SeriesArmamentData[];
};

export type ShotArmamentUpdateRequest = {
  shotId: string;
  weaponExternalId?: string;
  tubeExternalId?: string;
  isInstrumented?: boolean;
  lifeUsefulPercentage?: number;
  observations?: string;
};

export type ArmamentBulkUpdateRequest = {
  shots: ShotArmamentUpdateRequest[];
};
```

## Ejemplo Real: Catalog Models (Compartidos)

Archivo: `libs/domain/trial/planning/src/lib/utils-models/catalog.model.ts`

```typescript
export type SpecimenItem = {
  id: string;
  name: string;
  type: 'WEAPON' | 'TUBE' | 'MUNITION';
  active: boolean;
};

export type SpecimenListResponse = {
  page: number;
  pageSize: number;
  totalElements: number;
  items: SpecimenItem[];
};

export type CatalogQueryParams = {
  name?: string;
  page?: number;
  pageSize?: number;
  active?: boolean;
  sort?: string[];
};

export type MasterDataI18nItem = {
  id: string;
  name: Record<string, string>;
  label: string;
  active: boolean;
};

export type MasterDataIItem = {
  id: string;
  name: string;
  active: boolean;
};

export type MasterDataIItemUpdateRequest = {
  name: Record<string, string>;
  category?: string;
  active?: boolean;
};
```

## Ejemplo Real: Measures Models

Archivo: `libs/domain/trial/planning/src/lib/utils-models/measures.model.ts`

```typescript
export type MeasureData = {
  id: string;
  name: string;
  minLimit?: number;
  maxLimit?: number;
  deviation?: number;
};

export type SeriesMeasuresData = {
  seriesId: string;
  seriesName: string;
  measures: {
    topographyMeasures: MeasureData[];
    munitionsMeasures: MeasureData[];
    armamentMeasures: MeasureData[];
    ballisticsMeasures: MeasureData[];
  };
};

export type TrialMeasuresResponse = {
  series: SeriesMeasuresData[];
};

export type MeasureSelection = {
  id: string;
  minLimit?: number;
  maxLimit?: number;
  deviation?: number;
};

export type MeasuresBulkUpdateRequest = {
  series: {
    seriesId: string;
    measures: {
      topographyMeasures: MeasureSelection[];
      munitionsMeasures: MeasureSelection[];
      armamentMeasures: MeasureSelection[];
      ballisticsMeasures: MeasureSelection[];
    };
  }[];
};
```

## Reglas Clave

1. Los campos listados en `required` del Swagger son propiedades normales en TS
2. Los campos NO required son `?` (optional)
3. Si un schema usa `$ref`, importar el tipo del archivo correspondiente
4. Si un schema usa `allOf`, hacer merge de propiedades en un solo type
5. No generar tipos para `ProblemDetail` (es transversal y ya existe)
