import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { lastValueFrom, map } from 'rxjs';

import { DialogConfirmComponent } from '../components/dialog-confirm/dialog-confirm.component';
import { DialogInputComponent } from '../components/dialog-input/dialog-input.component';
import type { UIDialogConfirm, UIDialogInput } from '../ui-dialog.model';

@Injectable({
  providedIn: 'root',
})
export class UiDialogService {
  readonly #dialog = inject(MatDialog);

  confirm(texts: UIDialogConfirm): Promise<boolean> {
    const dialogRef = this.#dialog.open(DialogConfirmComponent, {
      data: texts,
      maxWidth: 600,
      width: '100vw',
      height: 'fit-content',
      maxHeight: 300,
    });

    return lastValueFrom(dialogRef.afterClosed());
  }

  input(labels: UIDialogInput): Promise<false | string> {
    const dialogRef = this.#dialog.open(DialogInputComponent, {
      data: labels,
      maxWidth: 600,
      width: '100vw',
      height: 'fit-content',
      maxHeight: 320,
    });

    return lastValueFrom(
      dialogRef.afterClosed().pipe(
        map((result) => {
          if (result === false || result === undefined || result.trim() === '') {
            return false;
          } else {
            return result;
          }
        }),
      ),
    );
  }
}
