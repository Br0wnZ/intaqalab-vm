import { MeasureUnitEnum } from '@intaqalab/models';

import type { MagnitudesOptions, MeasureSelectionData, SerieData } from '../../utils-models/measure-serie.model';
import type { MasterDataMeasureItem } from '../../utils-models/measures-catalog.model';
import type {
  MeasureData,
  MeasureSelection,
  MeasuresBulkUpdateRequest,
  SeriesMeasuresData,
} from '../../utils-models/measures.model';
import type { Serie } from '../../utils-models/series-and-shots.model';

export function formatMeasureOptionName(name: string): string {
  if (!name) return '';
  const trimmed = name.trimEnd();
  if (trimmed.endsWith('-')) {
    return trimmed.slice(0, -1).trimEnd();
  }
  return trimmed;
}

export function mapCatalogToMagnitudesOptions(catalog: MasterDataMeasureItem[]): MagnitudesOptions {
  if (!catalog || catalog.length === 0) {
    return {
      topografia: [],
      municiones: [],
      armamento: [],
      balistica: [],
    };
  }

  const mapItem = (item: MasterDataMeasureItem) => {
    const rawName =
      item.label ??
      (typeof item.magnitude === 'object' ? item.magnitude['es'] || item.magnitude['en'] || '' : item.magnitude || '');

    return {
      id: item.id,
      name: formatMeasureOptionName(rawName),
      active: item.active,
      favorite: item.isFavorite,
    };
  };

  return {
    topografia: catalog.filter((item) => item.unit === 'TOPOGRAPHY').map(mapItem),
    municiones: catalog.filter((item) => item.unit === 'MUNITIONS').map(mapItem),
    armamento: catalog.filter((item) => item.unit === 'ARMAMENT').map(mapItem),
    balistica: catalog.filter((item) => item.unit === 'BALLISTICS').map(mapItem),
  };
}

export function mapResponseToLocal(planningSeries: Serie[], measuresSeries?: SeriesMeasuresData[]): SerieData[] {
  return planningSeries.map((pSerie) => {
    const config = measuresSeries?.find((mSerie) => mSerie.seriesId === pSerie.id);

    return {
      id: pSerie.id,
      nombre: pSerie.name,
      expanded: false,
      topografia:
        config?.measures?.topographyMeasures?.map((m: MeasureData) => ({
          id: m.id,
          ...(m.measureUnit ? { measureUnit: m.measureUnit } : {}),
          minLimit: m.minLimit ?? null,
          maxLimit: m.maxLimit ?? null,
          deviation: m.deviation ?? null,
          expanded: false,
        })) ?? [],
      municiones:
        config?.measures?.munitionsMeasures?.map((m: MeasureData) => ({
          id: m.id,
          ...(m.measureUnit ? { measureUnit: m.measureUnit } : {}),
          minLimit: m.minLimit ?? null,
          maxLimit: m.maxLimit ?? null,
          deviation: m.deviation ?? null,
          expanded: false,
        })) ?? [],
      armamento:
        config?.measures?.armamentMeasures?.map((m: MeasureData) => ({
          id: m.id,
          ...(m.measureUnit ? { measureUnit: m.measureUnit } : {}),
          minLimit: m.minLimit ?? null,
          maxLimit: m.maxLimit ?? null,
          deviation: m.deviation ?? null,
          expanded: false,
        })) ?? [],
      balistica:
        config?.measures?.ballisticsMeasures?.map((m: MeasureData) => ({
          id: m.id,
          ...(m.measureUnit ? { measureUnit: m.measureUnit } : {}),
          minLimit: m.minLimit ?? null,
          maxLimit: m.maxLimit ?? null,
          deviation: m.deviation ?? null,
          expanded: false,
        })) ?? [],
    };
  });
}

export function mapLocalToRequest(
  data: SerieData[],
  seriesConfiguration: boolean,
  catalog: MasterDataMeasureItem[] = [],
): MeasuresBulkUpdateRequest {
  const useCommonConfig = !seriesConfiguration;
  const commonSource = useCommonConfig && data.length > 0 ? data[0] : null;
  const mapMeasure = (measure: MeasureSelectionData): MeasureSelection => {
    const unit = measure.measureUnit ?? catalog.find((item) => item.id === measure.id)?.measureUnit;
    const measureUnit = Object.values(MeasureUnitEnum).find((value) => value === unit);
    return {
      id: measure.id,
      ...(measureUnit ? { measureUnit } : {}),
      minLimit: measure.minLimit,
      maxLimit: measure.maxLimit,
      deviation: measure.deviation,
    };
  };

  return {
    series: data.map((item) => {
      const source = commonSource ?? item;
      return {
        seriesId: item.id,
        measures: {
          topographyMeasures: source.topografia.map(mapMeasure),
          munitionsMeasures: source.municiones.map(mapMeasure),
          armamentMeasures: source.armamento.map(mapMeasure),
          ballisticsMeasures: source.balistica.map(mapMeasure),
        },
      };
    }),
  };
}
