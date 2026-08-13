import type {
  Serie,
  ShootingConditionsUnits,
  Shot,
  UpdateConditionsRequest,
} from '../../models/shooting-conditions.model';
import type { Serie as SeriesAndShotsSerie } from '../../utils-models/series-and-shots.model';

export function mapDataToRequest(formData: Serie[]): Omit<UpdateConditionsRequest, 'trialId'> {
  const firstShot = formData[0]?.shots[0];
  const units: ShootingConditionsUnits | undefined = firstShot
    ? {
        distance: (firstShot.distanceUnit as ShootingConditionsUnits['distance']) ?? null,
        orientation: (firstShot.orientationUnit as ShootingConditionsUnits['orientation']) ?? null,
        targetInclination: (firstShot.targetInclinationUnit as ShootingConditionsUnits['targetInclination']) ?? null,
        elevation: (firstShot.elevationUnit as ShootingConditionsUnits['elevation']) ?? null,
        angle: (firstShot.angleUnit as ShootingConditionsUnits['angle']) ?? null,
        range: (firstShot.rangeUnit as ShootingConditionsUnits['range']) ?? null,
        functioningHeight: (firstShot.functioningHeightUnit as ShootingConditionsUnits['functioningHeight']) ?? null,
        nominalSpeed: (firstShot.nominalSpeedUnit as ShootingConditionsUnits['nominalSpeed']) ?? null,
        powderWeight: (firstShot.powderWeightUnit as ShootingConditionsUnits['powderWeight']) ?? null,
        projectileWeight: (firstShot.projectileWeightUnit as ShootingConditionsUnits['projectileWeight']) ?? null,
      }
    : undefined;

  return {
    units,
    shots: formData.flatMap((serie) =>
      serie.shots.map(
        ({
          globalNumber,
          date,
          distanceUnit,
          targetInclinationUnit,
          orientationUnit,
          elevationUnit,
          angleUnit,
          rangeUnit,
          functioningHeightUnit,
          powderWeightUnit,
          projectileWeightUnit,
          nominalSpeedUnit,
          ...rest
        }) => {
          const hasTarget = !!rest.targetTypeId;
          return {
            date,
            ...rest,
            targetMaterialId: hasTarget ? rest.targetMaterialId : '',
            targetDimensionsId: hasTarget ? rest.targetDimensionsId : '',
            targetThicknessId: hasTarget ? rest.targetThicknessId : '',
            distance: hasTarget ? rest.distance : 0,
            targetInclination: hasTarget ? rest.targetInclination : 0,
          };
        },
      ),
    ),
  };
}

export function buildSeriesFromStore(
  series: SeriesAndShotsSerie[],
  conditionsUnits: ShootingConditionsUnits,
  conditions?: Serie[],
): Serie[] {
  // Build flat maps from ALL condition shots regardless of how the backend groups them by serie.
  const byId = new Map<string, Shot>();
  const byGlobalNumber = new Map<number, Shot>();
  conditions?.forEach((serieCond) =>
    serieCond.shots.forEach((s) => {
      byId.set(s.shotId, s);
      if (!byGlobalNumber.has(s.globalNumber)) byGlobalNumber.set(s.globalNumber, s);
    }),
  );

  return series.map((serie) => {
    return {
      seriesId: serie.id,
      seriesName: serie.name,
      shots: serie.shots.map((shot) => {
        const existing = byId.get(shot.id) ?? byGlobalNumber.get(shot.globalNumber);
        if (existing)
          return {
            ...existing,
            shotId: shot.id,
            projectileWeight: existing.projectileWeight ?? 0,
            nominalSpeed: existing.nominalSpeed ?? 0,
          };
        // Default shot: usa las unidades del backend si ya llegaron
        return {
          shotId: shot.id,
          globalNumber: shot.globalNumber,
          date: '',
          targetTypeId: '',
          targetMaterialId: '',
          targetDimensionsId: '',
          targetThicknessId: '',
          distance: 0,
          distanceUnit: conditionsUnits?.distance ?? 'M',
          targetInclination: 0,
          targetInclinationUnit: conditionsUnits?.targetInclination ?? 'DEGREES',
          orientation: 0,
          orientationUnit: conditionsUnits?.orientation ?? 'DEGREES',
          elevation: 0,
          elevationUnit: conditionsUnits?.elevation ?? 'DEGREES',
          angle: 0,
          angleUnit: conditionsUnits?.angle ?? 'DEGREES',
          range: 0,
          rangeUnit: conditionsUnits?.range ?? 'M',
          impactZoneId: '',
          functioningHeight: 0,
          functioningHeightUnit: conditionsUnits?.functioningHeight ?? 'M',
          projectileWeight: 0,
          projectileWeightUnit: conditionsUnits?.projectileWeight ?? 'KG',
          nominalSpeed: 0,
          nominalSpeedUnit: conditionsUnits?.nominalSpeed ?? 'M_S',
          powderWeight: 0,
          powderWeightUnit: conditionsUnits?.powderWeight ?? 'KG',
          observations: '',
        };
      }),
    };
  });
}
