import type { Injector } from '@angular/core';
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
  UpdateArmamentDialogResult,
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
    shotIdx: number,
    shot: ArmamentSerieShot,
    weapons: SpecimenItem[],
    tubes: SpecimenItem[],
    injector?: Injector,
  ): Promise<UpdateArmamentDialogResult | undefined> {
    const dialogRef = this.#dialog.open<UpdateArmamentDialog, UpdateArmamentDialogData, UpdateArmamentDialogResult>(
      UpdateArmamentDialog,
      {
        width: '600px',
        injector,
        data: {
          shotNumber: shotIdx + 1,
          armament: shot.armament,
          weapons,
          tubes,
        },
      },
    );

    return firstValueFrom(dialogRef.afterClosed());
  }
}
