export interface MeasureCatalogItem {
  id: string;
  unit: 'TOPOGRAPHY' | 'MUNITIONS' | 'ARMAMENT' | 'BALLISTICS';
  measurementAreaCode: string;
  magnitudeCode: string;
  magnitude: { es: string; en: string };
  label: string;
  measureUnit: string;
  qualificationType: 'QUANTITATIVE' | 'QUALITATIVE';
  minValue: number;
  maxValue: number;
  values: Array<{ code: string; name: { es: string; en: string }; active: boolean }>;
  equipmentTypes: string[];
  procedure: { es: string; en: string };
  accreditation: boolean;
  grubbs: boolean;
  builtIn: boolean;
  uncertainty: string;
  magnitudeLabel: string;
  procedureLabel: string;
  active: boolean;
  favorite: boolean;
}

interface MeasureSeed {
  area: string;
  unit: MeasureCatalogItem['unit'];
  code: string;
  name: string;
  measureUnit: string;
  equipmentTypes: string[];
  minValue?: number;
  maxValue?: number;
  qualitative?: boolean;
}

const MEASURE_SEEDS: MeasureSeed[] = [
  {
    area: 'INITIAL_VELOCITY',
    unit: 'BALLISTICS',
    code: 'MUZZLE_VELOCITY',
    name: 'Velocidad inicial',
    measureUnit: 'M_S',
    equipmentTypes: ['DOPPLER_RADAR', 'ANTENNA'],
    minValue: 100,
    maxValue: 2000,
  },
  {
    area: 'PIEZOELECTRIC_PRESSURE',
    unit: 'BALLISTICS',
    code: 'CHAMBER_PRESSURE',
    name: 'Presión piezoeléctrica',
    measureUnit: 'BAR',
    equipmentTypes: ['PIEZOELECTRIC_SENSOR', 'AMPLIFIER'],
    minValue: 0,
    maxValue: 10000,
  },
  {
    area: 'TRAJECTOGRAPHY',
    unit: 'BALLISTICS',
    code: 'TRAJECTORY',
    name: 'Trayectografía',
    measureUnit: 'M',
    equipmentTypes: ['TRAJECTOGRAPHY_RADAR'],
    minValue: 0,
    maxValue: 50000,
  },
  {
    area: 'SOUND',
    unit: 'BALLISTICS',
    code: 'SOUND_LEVEL',
    name: 'Nivel sonoro',
    measureUnit: 'DB',
    equipmentTypes: ['SOUND_LEVEL_METER'],
    minValue: 0,
    maxValue: 200,
  },
  {
    area: 'HIGH_SPEED_VIDEO',
    unit: 'BALLISTICS',
    code: 'HIGH_SPEED_RECORD',
    name: 'Vídeo de alta velocidad',
    measureUnit: 'FPS',
    equipmentTypes: ['HIGH_SPEED_CAMERA', 'RECORDER'],
    qualitative: true,
  },
  {
    area: 'CONVENTIONAL_VIDEO',
    unit: 'BALLISTICS',
    code: 'CONVENTIONAL_RECORD',
    name: 'Vídeo convencional',
    measureUnit: 'FPS',
    equipmentTypes: ['CONVENTIONAL_CAMERA', 'RECORDER'],
    qualitative: true,
  },
  {
    area: 'LENGTH',
    unit: 'ARMAMENT',
    code: 'TUBE_LENGTH',
    name: 'Longitud',
    measureUnit: 'MM',
    equipmentTypes: ['TRACE_RULER'],
    minValue: 0,
    maxValue: 10000,
  },
  {
    area: 'MANOMETER_PRESSURE',
    unit: 'MUNITIONS',
    code: 'MANOMETER_READING',
    name: 'Presión de manómetro',
    measureUnit: 'BAR',
    equipmentTypes: ['PRESSURE_GAUGE', 'CRUSHER', 'PROBE'],
    minValue: 0,
    maxValue: 5000,
  },
  {
    area: 'IPG_PRESSURE',
    unit: 'MUNITIONS',
    code: 'IPG_READING',
    name: 'Presión IPG',
    measureUnit: 'BAR',
    equipmentTypes: ['IPG'],
    minValue: 0,
    maxValue: 5000,
  },
  {
    area: 'WEIGHT',
    unit: 'MUNITIONS',
    code: 'PROJECTILE_WEIGHT',
    name: 'Peso',
    measureUnit: 'KG',
    equipmentTypes: ['BALANCE'],
    minValue: 0,
    maxValue: 1000,
  },
  {
    area: 'CONDITIONING',
    unit: 'MUNITIONS',
    code: 'CONDITIONING_STATUS',
    name: 'Acondicionamiento',
    measureUnit: 'CELSIUS',
    equipmentTypes: ['CLIMATIC_CHAMBER'],
    qualitative: true,
  },
  {
    area: 'TIME',
    unit: 'TOPOGRAPHY',
    code: 'ELAPSED_TIME',
    name: 'Tiempo',
    measureUnit: 'S',
    equipmentTypes: ['CHRONOMETER'],
    minValue: 0,
    maxValue: 3600,
  },
];

export const MEASURES_CATALOG: MeasureCatalogItem[] = MEASURE_SEEDS.map((seed, index) => {
  const procedureLabel = `Procedimiento ${seed.name}`;
  const qualitative = seed.qualitative ?? false;
  return {
    id: `550e8400-e29b-41d4-a716-${String(446655440040 + index).padStart(12, '0')}`,
    unit: seed.unit,
    measurementAreaCode: seed.area,
    magnitudeCode: seed.code,
    magnitude: { es: seed.name, en: seed.name },
    label: `${seed.name} - ${procedureLabel}`,
    measureUnit: seed.measureUnit,
    qualificationType: qualitative ? 'QUALITATIVE' : 'QUANTITATIVE',
    minValue: seed.minValue ?? 0,
    maxValue: seed.maxValue ?? 0,
    values: qualitative
      ? [
          { code: 'COMPLIANT', name: { es: 'Conforme', en: 'Compliant' }, active: true },
          { code: 'NON_COMPLIANT', name: { es: 'No conforme', en: 'Non-compliant' }, active: true },
        ]
      : [],
    equipmentTypes: seed.equipmentTypes,
    procedure: { es: procedureLabel, en: procedureLabel },
    accreditation: index % 3 !== 0,
    grubbs: !qualitative && index % 2 === 0,
    builtIn: index < 2,
    uncertainty: qualitative ? '' : `${(index % 3) + 1}%`,
    magnitudeLabel: seed.name,
    procedureLabel,
    active: index !== MEASURE_SEEDS.length - 1,
    favorite: index % 4 === 0,
  };
});

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
