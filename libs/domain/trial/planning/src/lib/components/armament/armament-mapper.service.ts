import { Injectable } from '@angular/core';

import type { ArmamentData, ArmamentSerie, SeriesArmamentData } from '../../utils-models/armament.model';
import type { SpecimenItem } from '../../utils-models/catalog.model';
import type { Serie as SeriesAndShotsSerie } from '../../utils-models/series-and-shots.model';
import type { SpecimenType } from '../../utils-models/specimen.model';

@Injectable({
  providedIn: 'root',
})
export class ArmamentMapperService {
  /**
   * Mapea los datos provenientes del backend a la estructura local de ArmamentSerie.
   */
  mapBackendToLocal(seriesArmament: SeriesArmamentData[]): ArmamentSerie[] {
    return seriesArmament.map((series) => ({
      seriesId: series.seriesId,
      seriesName: series.seriesName,
      shots: series.shots.map((shot) => ({
        shotId: shot.shotId,
        armament: {
          weaponType: ((shot.armament?.itemType ?? shot.armament?.weaponType)?.toLowerCase() as SpecimenType) ?? '',
          weaponName: shot.armament?.weaponName ?? '',
          weaponExternalId: shot.armament?.weaponExternalId?.toString() ?? '',
          tubeName: shot.armament?.tubeName ?? '',
          tubeExternalId: shot.armament?.tubeExternalId?.toString() ?? '',
          isInstrumented: shot.armament?.isInstrumented ?? false,
          tubeLifePercentage: shot.armament?.tubeLifePercentage ?? 0,
          observations: shot.armament?.observations ?? '',
        },
      })),
    }));
  }

  /**
   * Construye las series de armamento desde las series de planning cuando no existen datos previos en backend.
   */
  buildSeriesFromStore(series: SeriesAndShotsSerie[], seriesArmament?: SeriesArmamentData[]): ArmamentSerie[] {
    const armamentByShotId = new Map<string, ArmamentData>();

    seriesArmament?.forEach((sArm) => {
      sArm.shots?.forEach((shot) => {
        if (shot.armament) {
          armamentByShotId.set(shot.shotId, shot.armament);
        }
      });
    });

    return series.map((serie, idx) => ({
      seriesId: serie.id,
      seriesName: serie.name || `Serie ${idx + 1}`,
      shots: (serie.shots || []).map((shot) => {
        const existing = armamentByShotId.get(shot.id);
        return {
          shotId: shot.id,
          armament: {
            weaponType: existing?.weaponType ?? '',
            weaponName: existing?.weaponName ?? '',
            weaponExternalId: existing?.weaponExternalId?.toString() ?? '',
            tubeName: existing?.tubeName ?? '',
            tubeExternalId: existing?.tubeExternalId?.toString() ?? '',
            isInstrumented: existing?.isInstrumented ?? false,
            tubeLifePercentage: existing?.tubeLifePercentage ?? 0,
            observations: existing?.observations ?? '',
          },
        };
      }),
    }));
  }

  /**
   * Mapea la estructura local de ArmamentSerie al payload requerido por la API backend.
   */
  mapLocalToRequest(series: ArmamentSerie[]) {
    return series.flatMap((serie) =>
      serie.shots.map((shot) => ({
        shotId: shot.shotId,
        weaponType: shot.armament.weaponType ? (shot.armament.weaponType.toUpperCase() as SpecimenType) : undefined,
        weaponExternalId: shot.armament.weaponExternalId ? Number(shot.armament.weaponExternalId) : undefined,
        tubeExternalId: shot.armament.tubeExternalId ? Number(shot.armament.tubeExternalId) : undefined,
        isInstrumented: shot.armament.isInstrumented,
        lifeUsefulPercentage:
          shot.armament.tubeLifePercentage !== undefined &&
          shot.armament.tubeLifePercentage !== null &&
          (shot.armament.tubeLifePercentage as unknown) !== ''
            ? Number(shot.armament.tubeLifePercentage)
            : undefined,
        observations: shot.armament.observations || undefined,
      })),
    );
  }

  /**
   * Mezcla las opciones del catálogo con las opciones ya seleccionadas previamente en los disparos.
   */
  mergeCatalogOptions(
    catalog: SpecimenItem[],
    shots: ArmamentSerie['shots'],
    idKey: 'weaponExternalId' | 'tubeExternalId',
    nameKey: 'weaponName' | 'tubeName',
    fallbackType: 'WEAPON' | 'TUBE',
  ): SpecimenItem[] {
    const byId = new Map<string, SpecimenItem>();

    for (const item of catalog) {
      byId.set(item.id, item);
    }

    for (const shot of shots) {
      const id = shot.armament[idKey];
      if (!id || byId.has(id)) {
        continue;
      }

      byId.set(id, {
        id,
        name: shot.armament[nameKey] || id,
        modelName: shot.armament[nameKey] || id,
        type: fallbackType,
        active: true,
      });
    }

    return Array.from(byId.values());
  }

  /**
   * Realiza una copia profunda de un objeto para resetear estados sin mutaciones.
   */
  deepClone<T>(data: T): T {
    return structuredClone(data);
  }
}
