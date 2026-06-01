export const MEASURES_CATALOG = [
  {
    id: '550e8400-e29b-41d4-a716-446655440040',
    name: { es: 'Magnitud A', en: 'Magnitude A' },
    label: 'Magnitud A - Procedimiento A',
    active: true,
    favorite: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440041',
    name: { es: 'Magnitud B', en: 'Magnitude B' },
    label: 'Magnitud B - Procedimiento B',
    active: true,
    favorite: false,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440042',
    name: { es: 'Registro C', en: 'Record C' },
    label: 'Registro C - Procedimiento C',
    active: true,
    favorite: false,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440043',
    name: { es: 'Magnitud D', en: 'Magnitude D' },
    label: 'Magnitud D - Procedimiento D',
    active: true,
    favorite: true,
  },
];

export const TRIAL_MEASURES = {
  series: [
    {
      seriesId: 'serie-uuid-1',
      seriesName: 'Serie 1',
      measures: {
        topographyMeasures: [
          {
            id: '550e8400-e29b-41d4-a716-446655440043',
            name: 'Registro Desviación lateral - Procedimiento Desviación',
            minLimit: 0.5,
            maxLimit: 2.0,
            deviation: 0.1,
          },
        ],
        munitionsMeasures: [],
        armamentMeasures: [],
        ballisticsMeasures: [
          {
            id: '550e8400-e29b-41d4-a716-446655440040',
            name: 'Magnitud Presión en recámara - Procedimiento Presión',
            minLimit: 100,
            maxLimit: 500,
            deviation: 10,
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440041',
            name: 'Magnitud Velocidad en boca - Procedimiento Velocidad',
            minLimit: 200,
            maxLimit: 800,
            deviation: 5,
          },
        ],
      },
    },
    {
      seriesId: 'serie-uuid-2',
      seriesName: 'Serie 2',
      measures: {
        topographyMeasures: [],
        munitionsMeasures: [],
        armamentMeasures: [],
        ballisticsMeasures: [
          {
            id: '550e8400-e29b-41d4-a716-446655440041',
            name: 'Magnitud Velocidad en boca - Procedimiento Velocidad',
            minLimit: null,
            maxLimit: null,
            deviation: null,
          },
        ],
      },
    },
  ],
};
