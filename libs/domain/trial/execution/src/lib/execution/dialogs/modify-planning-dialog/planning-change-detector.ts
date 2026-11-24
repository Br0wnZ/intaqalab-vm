import type { PlanningFieldChangeEvent, PlanningSection } from '@intaqalab/planning';

import type { PlanningModification } from '../../../data-access/planning-modifications';
import type {
  FieldChangeDetectionResult,
  NewMeasurePayload,
  PlanningBaselineSnapshot,
  PlanningFieldValue,
  SeriesFieldInput,
  ShotInheritanceInput,
} from './modify-planning-dialog.models';

function normalizeShots(shots: ReadonlyArray<string> | null | undefined): string[] | null {
  if (!shots || shots.length === 0) {
    return null;
  }
  return [...shots];
}

function normalizeValue(value: PlanningFieldValue | undefined): PlanningFieldValue {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return value;
}

function areValuesEqual(a: PlanningFieldValue, b: PlanningFieldValue): boolean {
  const normA = normalizeValue(a);
  const normB = normalizeValue(b);
  if (normA === normB) {
    return true;
  }
  if (normA === null || normB === null) {
    return false;
  }
  return String(normA) === String(normB);
}

function formatParameterValue(parameter: string, value: string | number, unit?: string): string {
  const formattedValue = unit ? `${value} ${unit}` : String(value);
  return `${parameter}: ${formattedValue}`;
}

/**
 * Pure change-detection helper for planning modifications during execution.
 *
 * Maintains a deep-cloned baseline snapshot captured when the dialog opens,
 * compares subsequent edits against the baseline, removes reverted changes,
 * and handles special cases (new series without inheritance, new shot with
 * inheritance from previous shot, indivisible measures, and deletions).
 */
export class PlanningChangeDetector {
  #baseline: PlanningBaselineSnapshot = {};
  #hasCapturedBaseline = false;

  captureBaseline(snapshot: PlanningBaselineSnapshot): void {
    this.#baseline = structuredClone(snapshot);
    this.#hasCapturedBaseline = true;
  }

  hasBaseline(): boolean {
    return this.#hasCapturedBaseline;
  }

  getBaseline(): PlanningBaselineSnapshot {
    return structuredClone(this.#baseline);
  }

  getBaselineValue(key: string): PlanningFieldValue {
    return key in this.#baseline ? this.#baseline[key] : null;
  }

  buildModificationKey(
    section: PlanningSection,
    parameter: string,
    affectedShots: ReadonlyArray<string> | null | undefined,
  ): string {
    const shotsPart = affectedShots && affectedShots.length > 0 ? [...affectedShots].sort().join(',') : 'global';
    return `${section}::${parameter}::${shotsPart}`;
  }

  detectFieldChange(event: PlanningFieldChangeEvent): FieldChangeDetectionResult {
    const affectedShots = normalizeShots(event.affectedShots);
    const key = this.buildModificationKey(event.section, event.parameter, affectedShots);

    if (event.action === 'Alta') {
      return {
        type: 'upsert',
        modification: {
          id: key,
          key,
          parameter: event.parameter,
          action: 'Alta',
          previousValue: null,
          newValue: normalizeValue(event.newValue),
          affectedShots,
          status: 'BORRADOR',
          classification: 'none',
        },
      };
    }

    if (event.action === 'Baja') {
      return {
        type: 'upsert',
        modification: {
          id: key,
          key,
          parameter: event.parameter,
          action: 'Baja',
          previousValue: normalizeValue(event.previousValue),
          newValue: null,
          affectedShots,
          status: 'BORRADOR',
          classification: 'none',
        },
      };
    }

    if (!(key in this.#baseline)) {
      this.#baseline[key] = normalizeValue(event.previousValue);
    }

    const baselineValue = this.#baseline[key];
    const currentValue = normalizeValue(event.newValue);

    if (areValuesEqual(baselineValue, currentValue)) {
      return { type: 'remove', key };
    }

    return {
      type: 'upsert',
      modification: {
        id: key,
        key,
        parameter: event.parameter,
        action: 'Modificación',
        previousValue: baselineValue,
        newValue: currentValue,
        affectedShots,
        status: 'BORRADOR',
        classification: 'none',
      },
    };
  }

  /**
   * New series has NO inheritance: registers an 'Alta' for the series itself
   * plus an individual 'Alta' for every explicitly configured field.
   */
  detectNewSeries(seriesLabel: string, configuredFields: ReadonlyArray<SeriesFieldInput>): PlanningModification[] {
    const modifications: PlanningModification[] = [];

    const seriesKey = this.buildModificationKey('series-and-shots', `Nueva serie (${seriesLabel})`, null);
    modifications.push({
      id: seriesKey,
      key: seriesKey,
      parameter: 'Nueva serie',
      action: 'Alta',
      previousValue: null,
      newValue: seriesLabel,
      affectedShots: null,
      status: 'BORRADOR',
      classification: 'none',
    });

    for (const field of configuredFields) {
      const affectedShots = normalizeShots(field.affectedShots);
      const fieldKey = this.buildModificationKey(
        'series-and-shots',
        `${seriesLabel}.${field.parameter}`,
        affectedShots,
      );
      modifications.push({
        id: fieldKey,
        key: fieldKey,
        parameter: field.parameter,
        action: 'Alta',
        previousValue: null,
        newValue: field.unit ? `${field.value} ${field.unit}` : field.value,
        affectedShots,
        status: 'BORRADOR',
        classification: 'none',
      });
    }

    return modifications;
  }

  /**
   * New shot in an existing series inherits values from the previous shot.
   * Records inherited values as baseline for the shot and registers ONLY fields
   * that differ from the inherited values, formatted as `Parámetro: Valor`.
   */
  detectNewShotWithInheritance(input: ShotInheritanceInput): PlanningModification[] {
    const inheritedCopy = structuredClone(input.inheritedValues);
    const affectedShots = [input.shotLabel];
    const modifications: PlanningModification[] = [];

    const allParams = new Set([...Object.keys(inheritedCopy), ...Object.keys(input.currentValues)]);

    for (const parameter of allParams) {
      const key = this.buildModificationKey('shooting-conditions', parameter, affectedShots);
      const inheritedValue = normalizeValue(inheritedCopy[parameter]);
      const currentValue = normalizeValue(input.currentValues[parameter]);

      this.#baseline[key] = inheritedValue;

      if (areValuesEqual(inheritedValue, currentValue)) {
        continue;
      }

      const unit = input.units?.[parameter];
      const formattedNewValue = currentValue !== null ? formatParameterValue(parameter, currentValue, unit) : null;
      const formattedPreviousValue = inheritedValue !== null && unit ? `${inheritedValue} ${unit}` : inheritedValue;

      modifications.push({
        id: key,
        key,
        parameter,
        action: 'Modificación',
        previousValue: formattedPreviousValue,
        newValue: formattedNewValue,
        affectedShots,
        status: 'BORRADOR',
        classification: 'none',
      });
    }

    return modifications;
  }

  /**
   * New measure is treated as a single indivisible 'Alta' modification
   * grouping the measure and all its acceptance criteria (limits, deviations).
   */
  detectNewMeasure(payload: NewMeasurePayload): PlanningModification {
    const affectedShots = normalizeShots(payload.affectedShots);
    const key = this.buildModificationKey('measures', payload.measureName, affectedShots);
    const groupedCriteria = payload.criteria
      .map((criterion) =>
        criterion.unit
          ? `${criterion.label}: ${criterion.value} ${criterion.unit}`
          : `${criterion.label}: ${criterion.value}`,
      )
      .join('. ');

    return {
      id: key,
      key,
      parameter: payload.measureName,
      action: 'Alta',
      previousValue: null,
      newValue: groupedCriteria || payload.measureName,
      affectedShots,
      status: 'BORRADOR',
      classification: 'none',
    };
  }

  /**
   * Deletion of a series, shot, or measure produces a single 'Baja' modification.
   */
  detectDeletion(
    section: PlanningSection,
    parameter: string,
    previousValue: PlanningFieldValue,
    affectedShots?: ReadonlyArray<string> | null,
  ): PlanningModification {
    const shots = normalizeShots(affectedShots);
    const key = this.buildModificationKey(section, parameter, shots);

    return {
      id: key,
      key,
      parameter,
      action: 'Baja',
      previousValue: normalizeValue(previousValue),
      newValue: null,
      affectedShots: shots,
      status: 'BORRADOR',
      classification: 'none',
    };
  }
}
