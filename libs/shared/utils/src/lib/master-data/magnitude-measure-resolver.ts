import {
  type MagnitudeDisplayConfig,
  MagnitudeInputTypeEnum,
  type MagnitudeMeasureDefinition,
  type MagnitudeMeasureSource,
  QualificationTypeEnum,
} from '@intaqalab/models';

/** Estrategia que resuelve la definición de medida de un `qualificationType` concreto (Strategy Pattern). */
interface MagnitudeMeasureStrategy {
  readonly qualificationType: QualificationTypeEnum;
  resolve(source: MagnitudeMeasureSource): MagnitudeMeasureDefinition;
}

class QuantitativeMagnitudeMeasureStrategy implements MagnitudeMeasureStrategy {
  readonly qualificationType = QualificationTypeEnum.QUANTITATIVE;

  resolve(source: MagnitudeMeasureSource): MagnitudeMeasureDefinition {
    return {
      inputType: MagnitudeInputTypeEnum.NUMERIC,
      unit: source.measureUnit ?? null,
      minValue: source.minValue ?? null,
      maxValue: source.maxValue ?? null,
    };
  }
}

class QualitativeMagnitudeMeasureStrategy implements MagnitudeMeasureStrategy {
  readonly qualificationType = QualificationTypeEnum.QUALITATIVE;

  resolve(source: MagnitudeMeasureSource): MagnitudeMeasureDefinition {
    return {
      inputType: MagnitudeInputTypeEnum.SINGLE_SELECT,
      options: (source.values ?? []).map((value) => ({ code: value.code, label: value.label })),
    };
  }
}

/** Registro de estrategias. Añadir un nuevo `qualificationType` no requiere tocar el resolver (OCP). */
const MAGNITUDE_MEASURE_STRATEGIES: readonly MagnitudeMeasureStrategy[] = [
  new QuantitativeMagnitudeMeasureStrategy(),
  new QualitativeMagnitudeMeasureStrategy(),
];

/**
 * Resuelve, a partir de una magnitud del catálogo maestro seleccionada en Planificación, qué control
 * (numérico o selector) y con qué parámetros (unidad, límites, opciones) debe renderizar Ejecución.
 * Devuelve `null` cuando la magnitud no tiene `qualificationType` reconocido (p. ej. borrador incompleto).
 */
export function resolveMagnitudeDisplayConfig(source: MagnitudeMeasureSource): MagnitudeDisplayConfig | null {
  const strategy = MAGNITUDE_MEASURE_STRATEGIES.find(
    (candidate) => candidate.qualificationType === source.qualificationType,
  );
  if (!strategy) {
    return null;
  }

  return {
    magnitudeCode: source.magnitudeCode,
    magnitudeLabel: source.magnitudeLabel,
    measure: strategy.resolve(source),
  };
}
