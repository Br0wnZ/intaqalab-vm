export type EquipmentMagnitudeTagValue =
  | 'INITIAL_VELOCITY'
  | 'PIEZOELECTRIC_PRESSURE'
  | 'TRAJECTOGRAPHY'
  | 'SOUND'
  | 'HIGH_SPEED_VIDEO'
  | 'CONVENTIONAL_VIDEO'
  | 'LENGTH'
  | 'MANOMETER_PRESSURE'
  | 'IPG_PRESSURE'
  | 'WEIGHT'
  | 'CONDITIONING'
  | 'TIME';

export interface MeasureCatalogItem {
  id: string;
  unit: 'TOPOGRAPHY' | 'MUNITIONS' | 'ARMAMENT' | 'BALLISTICS';
  measurementArea: string;
  measurements: EquipmentMagnitudeTagValue[];
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
  isFavorite: boolean;
}

interface MeasureSeed {
  area: string;
  measurements: EquipmentMagnitudeTagValue[];
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
    measurements: ['INITIAL_VELOCITY'],
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
    measurements: ['PIEZOELECTRIC_PRESSURE'],
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
    measurements: ['TRAJECTOGRAPHY'],
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
    measurements: ['SOUND'],
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
    measurements: ['HIGH_SPEED_VIDEO'],
    unit: 'BALLISTICS',
    code: 'HIGH_SPEED_RECORD',
    name: 'Vídeo de alta velocidad',
    measureUnit: 'FPS',
    equipmentTypes: ['HIGH_SPEED_CAMERA', 'RECORDER'],
    qualitative: true,
  },
  {
    area: 'HIGH_SPEED_VIDEO',
    measurements: ['HIGH_SPEED_VIDEO'],
    unit: 'BALLISTICS',
    code: 'BAL_CAMERA_HIGH_VELOCITY_ENTRANCE',
    name: 'Vídeo Alta Velocidad en Boca',
    measureUnit: 'FPS',
    equipmentTypes: ['HIGH_SPEED_CAMERA', 'RECORDER'],
    minValue: 1000,
    maxValue: 30000,
  },
  {
    area: 'HIGH_SPEED_VIDEO',
    measurements: ['HIGH_SPEED_VIDEO'],
    unit: 'BALLISTICS',
    code: 'BAL_CAMERA_HIGH_VELOCITY_SEAL',
    name: 'Vídeo Alta Velocidad en Cierre',
    measureUnit: 'FPS',
    equipmentTypes: ['HIGH_SPEED_CAMERA', 'RECORDER'],
    minValue: 1000,
    maxValue: 30000,
  },
  {
    area: 'HIGH_SPEED_VIDEO',
    measurements: ['HIGH_SPEED_VIDEO'],
    unit: 'BALLISTICS',
    code: 'BAL_CAMERA_HIGH_VELOCITY_RIVALRY',
    name: 'Vídeo Alta Velocidad en Pique',
    measureUnit: 'FPS',
    equipmentTypes: ['HIGH_SPEED_CAMERA', 'RECORDER'],
    minValue: 1000,
    maxValue: 30000,
  },
  {
    area: 'HIGH_SPEED_VIDEO',
    measurements: ['HIGH_SPEED_VIDEO'],
    unit: 'BALLISTICS',
    code: 'BAL_CAMERA_HIGH_VELOCITY_TARJET',
    name: 'Vídeo Alta Velocidad en Blanco',
    measureUnit: 'FPS',
    equipmentTypes: ['HIGH_SPEED_CAMERA', 'RECORDER'],
    minValue: 0,
    maxValue: 50000,
  },
  {
    area: 'CONVENTIONAL_VIDEO',
    measurements: ['CONVENTIONAL_VIDEO'],
    unit: 'BALLISTICS',
    code: 'CONVENTIONAL_RECORD',
    name: 'Vídeo convencional',
    measureUnit: 'FPS',
    equipmentTypes: ['CONVENTIONAL_CAMERA', 'RECORDER'],
    qualitative: true,
  },
  {
    area: 'CONVENTIONAL_VIDEO',
    measurements: ['CONVENTIONAL_VIDEO'],
    unit: 'BALLISTICS',
    code: 'BAL_CAMERA_CONV_ENTRANCE',
    name: 'Vídeo Convencional en Boca',
    measureUnit: 'FPS',
    equipmentTypes: ['CONVENTIONAL_CAMERA', 'RECORDER'],
    qualitative: true,
  },
  {
    area: 'CONVENTIONAL_VIDEO',
    measurements: ['CONVENTIONAL_VIDEO'],
    unit: 'BALLISTICS',
    code: 'BAL_CAMERA_CONV_RIVALRY',
    name: 'Vídeo Convencional en Piques',
    measureUnit: 'FPS',
    equipmentTypes: ['CONVENTIONAL_CAMERA', 'RECORDER'],
    qualitative: true,
  },
  {
    area: 'CONVENTIONAL_VIDEO',
    measurements: ['CONVENTIONAL_VIDEO'],
    unit: 'BALLISTICS',
    code: 'BAL_CAMERA_CONV_TARJET',
    name: 'Vídeo Convencional en Blanco',
    measureUnit: 'FPS',
    equipmentTypes: ['CONVENTIONAL_CAMERA', 'RECORDER'],
    qualitative: true,
  },
  {
    area: 'CONVENTIONAL_VIDEO',
    measurements: ['CONVENTIONAL_VIDEO'],
    unit: 'BALLISTICS',
    code: 'BAL_CAMERA_CONV_SEAL',
    name: 'Vídeo Convencional en Cierre',
    measureUnit: 'FPS',
    equipmentTypes: ['CONVENTIONAL_CAMERA', 'RECORDER'],
    qualitative: true,
  },
  {
    area: 'CONVENTIONAL_VIDEO',
    measurements: ['CONVENTIONAL_VIDEO'],
    unit: 'BALLISTICS',
    code: 'BAL_VIGILANCE',
    name: 'Registro de video-vigilancia de la prueba',
    measureUnit: 'FPS',
    equipmentTypes: ['CONVENTIONAL_CAMERA', 'RECORDER'],
    qualitative: true,
  },
  {
    area: 'LENGTH',
    measurements: ['LENGTH'],
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
    measurements: ['MANOMETER_PRESSURE'],
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
    measurements: ['IPG_PRESSURE'],
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
    measurements: ['WEIGHT'],
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
    measurements: ['CONDITIONING'],
    unit: 'MUNITIONS',
    code: 'CONDITIONING_STATUS',
    name: 'Acondicionamiento',
    measureUnit: 'CELSIUS',
    equipmentTypes: ['CLIMATIC_CHAMBER'],
    qualitative: true,
  },
  {
    area: 'TIME',
    measurements: ['TIME'],
    unit: 'TOPOGRAPHY',
    code: 'ELAPSED_TIME',
    name: 'Tiempo',
    measureUnit: 'S',
    equipmentTypes: ['CHRONOMETER'],
    minValue: 0,
    maxValue: 3600,
  },
];

const SEED_CUSTOM_IDS: Record<string, string> = {
  BAL_CAMERA_HIGH_VELOCITY_ENTRANCE: 'edac8dfe-89f2-4d3b-9eef-5193a93a483f',
  BAL_CAMERA_HIGH_VELOCITY_SEAL: '56255e40-3d41-45f4-adbe-2a392bef7297',
  BAL_CAMERA_HIGH_VELOCITY_RIVALRY: '5bfb456c-fab1-4984-9bea-352ba0ace0b0',
  BAL_CAMERA_HIGH_VELOCITY_TARJET: '77d46c2c-4e3e-4135-8ccc-bdca22d53e05',
  BAL_CAMERA_CONV_ENTRANCE: 'c5e8ac36-5d75-4c60-aaa5-034a31e7c188',
  BAL_CAMERA_CONV_RIVALRY: '97cdca8e-307f-41a1-91cf-b70dc731a10c',
  BAL_CAMERA_CONV_TARJET: 'a37513db-45ff-4646-a590-143f6970994e',
  BAL_CAMERA_CONV_SEAL: '2e09862a-d02f-4b30-bb7d-fb7c24d52281',
  BAL_VIGILANCE: '8268cb19-c6cc-4bcf-808b-327ed694259e',
};

export const MEASURES_CATALOG: MeasureCatalogItem[] = MEASURE_SEEDS.map((seed, index) => {
  const procedureLabel = `Procedimiento ${seed.name}`;
  const qualitative = seed.qualitative ?? false;
  return {
    id: SEED_CUSTOM_IDS[seed.code] ?? `550e8400-e29b-41d4-a716-${String(446655440040 + index).padStart(12, '0')}`,
    unit: seed.unit,
    measurementArea: seed.area,
    measurements: seed.measurements,
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
    isFavorite: index % 4 === 0,
  };
});

export const TRIAL_MEASURES = {
  series: [
    {
      seriesId: '2eb59874-82f7-4a1b-ab01-d2ab21ddf504',
      seriesName: 'Serie 2',
      measures: {
        topographyMeasures: [],
        munitionsMeasures: [],
        armamentMeasures: [],
        ballisticsMeasures: [
          {
            id: '8268cb19-c6cc-4bcf-808b-327ed694259e',
            name: 'Registro de video-vigilancia de la prueba',
            unit: 'BALLISTICS',
            measurementArea: 'Vigilancia/Seguridad',
            magnitudeCode: 'BAL_VIGILANCE',
            minLimit: null,
            maxLimit: null,
            deviation: null,
          },
          {
            id: 'edac8dfe-89f2-4d3b-9eef-5193a93a483f',
            name: 'Vídeo Alta Velocidad en Boca',
            unit: 'BALLISTICS',
            measurementArea: 'Cámaras de vídeo de alta velocidad y convencionales',
            magnitudeCode: 'BAL_CAMERA_HIGH_VELOCITY_ENTRANCE',
            minLimit: null,
            maxLimit: null,
            deviation: null,
          },
          {
            id: 'c5e8ac36-5d75-4c60-aaa5-034a31e7c188',
            name: 'Vídeo Convencional en Boca',
            unit: 'BALLISTICS',
            measurementArea: 'Cámaras de vídeo de alta velocidad y convencionales',
            magnitudeCode: 'BAL_CAMERA_CONV_ENTRANCE',
            minLimit: null,
            maxLimit: null,
            deviation: null,
          },
          {
            id: '97cdca8e-307f-41a1-91cf-b70dc731a10c',
            name: 'Vídeo Convencional en Piques',
            unit: 'BALLISTICS',
            measurementArea: 'Cámaras de vídeo de alta velocidad y convencionales',
            magnitudeCode: 'BAL_CAMERA_CONV_RIVALRY',
            minLimit: null,
            maxLimit: null,
            deviation: null,
          },
          {
            id: '56255e40-3d41-45f4-adbe-2a392bef7297',
            name: 'Vídeo Alta Velocidad en Cierre',
            unit: 'BALLISTICS',
            measurementArea: 'Cámaras de vídeo de alta velocidad y convencionales',
            magnitudeCode: 'BAL_CAMERA_HIGH_VELOCITY_SEAL',
            minLimit: null,
            maxLimit: null,
            deviation: null,
          },
          {
            id: 'a37513db-45ff-4646-a590-143f6970994e',
            name: 'Vídeo Convencional en Blanco',
            unit: 'BALLISTICS',
            measurementArea: 'Cámaras de vídeo de alta velocidad y convencionales',
            magnitudeCode: 'BAL_CAMERA_CONV_TARJET',
            minLimit: null,
            maxLimit: null,
            deviation: null,
          },
          {
            id: '5bfb456c-fab1-4984-9bea-352ba0ace0b0',
            name: 'Vídeo Alta Velocidad en Pique',
            unit: 'BALLISTICS',
            measurementArea: 'Cámaras de vídeo de alta velocidad y convencionales',
            magnitudeCode: 'BAL_CAMERA_HIGH_VELOCITY_RIVALRY',
            minLimit: null,
            maxLimit: null,
            deviation: null,
          },
          {
            id: '2e09862a-d02f-4b30-bb7d-fb7c24d52281',
            name: 'Vídeo Convencional en Cierre',
            unit: 'BALLISTICS',
            measurementArea: 'Cámaras de vídeo de alta velocidad y convencionales',
            magnitudeCode: 'BAL_CAMERA_CONV_SEAL',
            minLimit: null,
            maxLimit: null,
            deviation: null,
          },
          {
            id: '77d46c2c-4e3e-4135-8ccc-bdca22d53e05',
            name: 'Vídeo Alta Velocidad en Blanco',
            unit: 'BALLISTICS',
            measurementArea: 'Cámaras de vídeo de alta velocidad y convencionales',
            magnitudeCode: 'BAL_CAMERA_HIGH_VELOCITY_TARJET',
            minLimit: null,
            maxLimit: null,
            deviation: null,
          },
        ],
      },
    },
    {
      seriesId: '663b86f7-aa2a-4655-8e1b-23362f4c9985',
      seriesName: 'Serie 1',
      measures: {
        topographyMeasures: [],
        munitionsMeasures: [],
        armamentMeasures: [],
        ballisticsMeasures: [
          {
            id: '77d46c2c-4e3e-4135-8ccc-bdca22d53e05',
            name: 'Vídeo Alta Velocidad en Blanco',
            unit: 'BALLISTICS',
            measurementArea: 'Cámaras de vídeo de alta velocidad y convencionales',
            magnitudeCode: 'BAL_CAMERA_HIGH_VELOCITY_TARJET',
            minLimit: null,
            maxLimit: null,
            deviation: null,
          },
          {
            id: '97cdca8e-307f-41a1-91cf-b70dc731a10c',
            name: 'Vídeo Convencional en Piques',
            unit: 'BALLISTICS',
            measurementArea: 'Cámaras de vídeo de alta velocidad y convencionales',
            magnitudeCode: 'BAL_CAMERA_CONV_RIVALRY',
            minLimit: null,
            maxLimit: null,
            deviation: null,
          },
          {
            id: '8268cb19-c6cc-4bcf-808b-327ed694259e',
            name: 'Registro de video-vigilancia de la prueba',
            unit: 'BALLISTICS',
            measurementArea: 'Vigilancia/Seguridad',
            magnitudeCode: 'BAL_VIGILANCE',
            minLimit: null,
            maxLimit: null,
            deviation: null,
          },
          {
            id: 'edac8dfe-89f2-4d3b-9eef-5193a93a483f',
            name: 'Vídeo Alta Velocidad en Boca',
            unit: 'BALLISTICS',
            measurementArea: 'Cámaras de vídeo de alta velocidad y convencionales',
            magnitudeCode: 'BAL_CAMERA_HIGH_VELOCITY_ENTRANCE',
            minLimit: null,
            maxLimit: null,
            deviation: null,
          },
          {
            id: '5bfb456c-fab1-4984-9bea-352ba0ace0b0',
            name: 'Vídeo Alta Velocidad en Pique',
            unit: 'BALLISTICS',
            measurementArea: 'Cámaras de vídeo de alta velocidad y convencionales',
            magnitudeCode: 'BAL_CAMERA_HIGH_VELOCITY_RIVALRY',
            minLimit: null,
            maxLimit: null,
            deviation: null,
          },
          {
            id: 'c5e8ac36-5d75-4c60-aaa5-034a31e7c188',
            name: 'Vídeo Convencional en Boca',
            unit: 'BALLISTICS',
            measurementArea: 'Cámaras de vídeo de alta velocidad y convencionales',
            magnitudeCode: 'BAL_CAMERA_CONV_ENTRANCE',
            minLimit: null,
            maxLimit: null,
            deviation: null,
          },
          {
            id: '56255e40-3d41-45f4-adbe-2a392bef7297',
            name: 'Vídeo Alta Velocidad en Cierre',
            unit: 'BALLISTICS',
            measurementArea: 'Cámaras de vídeo de alta velocidad y convencionales',
            magnitudeCode: 'BAL_CAMERA_HIGH_VELOCITY_SEAL',
            minLimit: null,
            maxLimit: null,
            deviation: null,
          },
          {
            id: 'a37513db-45ff-4646-a590-143f6970994e',
            name: 'Vídeo Convencional en Blanco',
            unit: 'BALLISTICS',
            measurementArea: 'Cámaras de vídeo de alta velocidad y convencionales',
            magnitudeCode: 'BAL_CAMERA_CONV_TARJET',
            minLimit: null,
            maxLimit: null,
            deviation: null,
          },
          {
            id: '2e09862a-d02f-4b30-bb7d-fb7c24d52281',
            name: 'Vídeo Convencional en Cierre',
            unit: 'BALLISTICS',
            measurementArea: 'Cámaras de vídeo de alta velocidad y convencionales',
            magnitudeCode: 'BAL_CAMERA_CONV_SEAL',
            minLimit: null,
            maxLimit: null,
            deviation: null,
          },
        ],
      },
    },
  ],
};
