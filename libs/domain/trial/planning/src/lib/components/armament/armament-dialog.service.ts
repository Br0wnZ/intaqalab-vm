import { Injectable, inject } from '@angular/core';
import type { MatDialogRef } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import type {
  ArmamentSerie,
  ArmamentSerieShot,
  MassiveConfigData,
  MassiveShotsConfigurationDialogData,
  UpdateArmamentDialogData,
} from '../../utils-models/armament.model';
import type { SpecimenItem } from '../../utils-models/catalog.model';
import { MassiveShotsConfigurationDialog } from './massive-shots-configuration-dialog';
import { UpdateArmamentDialog } from './update-armament-dialog';

@Injectable({
  providedIn: 'root',
})
export class ArmamentDialogService {
  readonly #dialog = inject(MatDialog);

  openMassiveConfiguration(
    series: ArmamentSerie[],
    onDialogOpened?: (ref: MatDialogRef<MassiveShotsConfigurationDialog, MassiveConfigData | undefined>) => void,
  ): Promise<MassiveConfigData | undefined> {
    const dialogRef = this.#dialog.open<
      MassiveShotsConfigurationDialog,
      MassiveShotsConfigurationDialogData,
      MassiveConfigData | undefined
    >(MassiveShotsConfigurationDialog, {
      width: '800px',
      data: {
        series: series.map((s) => ({ id: s.seriesId, name: s.seriesName })),
      },
    });

    onDialogOpened?.(dialogRef);

    return firstValueFrom(dialogRef.afterClosed());
  }

  openUpdateDialog(
    trialId: string,
    shotIdx: number,
    shot: ArmamentSerieShot,
    weapons: SpecimenItem[],
    tubes: SpecimenItem[],
  ): Promise<boolean | undefined> {
    const dialogRef = this.#dialog.open<UpdateArmamentDialog, UpdateArmamentDialogData, boolean>(UpdateArmamentDialog, {
      width: '600px',
      data: {
        trialId,
        shotNumber: shotIdx + 1,
        shotId: shot.shotId,
        armament: shot.armament,
        weapons,
        tubes,
      },
    });

    return firstValueFrom(dialogRef.afterClosed());
  }
}
