import type { SerieData } from '../../utils-models/measure-serie.model';
import type { MeasureData, MeasuresBulkUpdateRequest, SeriesMeasuresData } from '../../utils-models/measures.model';
import type { Serie } from '../../utils-models/series-and-shots.model';

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
          expanded: true,
        })) ?? [],
      municiones:
        config?.measures?.munitionsMeasures?.map((m: MeasureData) => ({
          id: m.id,
          minLimit: m.minLimit ?? null,
          maxLimit: m.maxLimit ?? null,
          deviation: m.deviation ?? null,
          expanded: true,
        })) ?? [],
      armamento:
        config?.measures?.armamentMeasures?.map((m: MeasureData) => ({
          id: m.id,
          minLimit: m.minLimit ?? null,
          maxLimit: m.maxLimit ?? null,
          deviation: m.deviation ?? null,
          expanded: true,
        })) ?? [],
      balistica:
        config?.measures?.ballisticsMeasures?.map((m: MeasureData) => ({
          id: m.id,
          minLimit: m.minLimit ?? null,
          maxLimit: m.maxLimit ?? null,
          deviation: m.deviation ?? null,
          expanded: true,
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
