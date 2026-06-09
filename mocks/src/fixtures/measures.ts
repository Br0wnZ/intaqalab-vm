export const MEASURES_CATALOG = [
  {
    id: '550e8400-e29b-41d4-a716-446655440040',
    name: { es: 'Magnitud Presión en recámara', en: 'Chamber Pressure' },
    label: 'Magnitud Presión en recámara - Procedimiento Presión',
    active: true,
    favorite: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440041',
    name: { es: 'Magnitud Velocidad en boca', en: 'Muzzle Velocity' },
    label: 'Magnitud Velocidad en boca - Procedimiento Velocidad',
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
    name: { es: 'Registro Desviación lateral', en: 'Lateral Deviation' },
    label: 'Registro Desviación lateral - Procedimiento Desviación',
    active: true,
    favorite: true,
  },
];

export const TRIAL_MEASURES = {
  series: [
    {
      seriesId: '3fa85f64-5717-4562-b3fc-2c963f66afa1',
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
      seriesId: '3fa85f64-5717-4562-b3fc-2c963f66afa2',
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
