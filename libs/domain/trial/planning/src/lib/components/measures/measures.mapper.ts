import type { MagnitudesOptions, SerieData } from '../../utils-models/measure-serie.model';
import type { MasterDataMeasureItem } from '../../utils-models/measures-catalog.model';
import type { MeasureData, MeasuresBulkUpdateRequest, SeriesMeasuresData } from '../../utils-models/measures.model';
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
      favorite: item.favorite,
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
          minLimit: m.minLimit ?? null,
          maxLimit: m.maxLimit ?? null,
          deviation: m.deviation ?? null,
          expanded: false,
        })) ?? [],
      municiones:
        config?.measures?.munitionsMeasures?.map((m: MeasureData) => ({
          id: m.id,
          minLimit: m.minLimit ?? null,
          maxLimit: m.maxLimit ?? null,
          deviation: m.deviation ?? null,
          expanded: false,
        })) ?? [],
      armamento:
        config?.measures?.armamentMeasures?.map((m: MeasureData) => ({
          id: m.id,
          minLimit: m.minLimit ?? null,
          maxLimit: m.maxLimit ?? null,
          deviation: m.deviation ?? null,
          expanded: false,
        })) ?? [],
      balistica:
        config?.measures?.ballisticsMeasures?.map((m: MeasureData) => ({
          id: m.id,
          minLimit: m.minLimit ?? null,
          maxLimit: m.maxLimit ?? null,
          deviation: m.deviation ?? null,
          expanded: false,
        })) ?? [],
    };
  });
}

export function mapLocalToRequest(data: SerieData[], seriesConfiguration: boolean): MeasuresBulkUpdateRequest {
  const useCommonConfig = !seriesConfiguration;
  const commonSource = useCommonConfig && data.length > 0 ? data[0] : null;

  return {
    series: data.map((item) => {
      const source = commonSource ?? item;
      return {
        seriesId: item.id,
        measures: {
          topographyMeasures: source.topografia.map((m) => ({
            id: m.id,
            minLimit: m.minLimit,
            maxLimit: m.maxLimit,
            deviation: m.deviation,
          })),
          munitionsMeasures: source.municiones.map((m) => ({
            id: m.id,
            minLimit: m.minLimit,
            maxLimit: m.maxLimit,
            deviation: m.deviation,
          })),
          armamentMeasures: source.armamento.map((m) => ({
            id: m.id,
            minLimit: m.minLimit,
            maxLimit: m.maxLimit,
            deviation: m.deviation,
          })),
          ballisticsMeasures: source.balistica.map((m) => ({
            id: m.id,
            minLimit: m.minLimit,
            maxLimit: m.maxLimit,
            deviation: m.deviation,
          })),
        },
      };
    }),
  };
}
