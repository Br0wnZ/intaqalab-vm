import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import type { Observable } from 'rxjs';
import { from, of, switchMap } from 'rxjs';

import type { SpecialDayActionToPerform } from './components/shell/special-days-manager-modal-shell.component';
import { SpecialDaysManagerComponent } from './components/shell/special-days-manager-modal-shell.component';
import { SpecialDaysDataServiceService } from './data/special-days-data-service.service';

@Injectable({
  providedIn: 'root',
})
export class SpecialDaysManagerService {
  #specialDaysDataServiceService = inject(SpecialDaysDataServiceService);
  readonly #dialog = inject(MatDialog);
  manage() {
    const dialogRef = this.#dialog.open(SpecialDaysManagerComponent, {
      maxWidth: 1200,
      width: '100vw',
      height: '100vh',
      maxHeight: 800,
    });
    const ref: Observable<SpecialDayActionToPerform[] | false> = dialogRef.afterClosed();

    return ref.pipe(
      switchMap((actions) => {
        if (actions) {
          return from(this.#specialDaysDataServiceService.dispatchActions(actions));
        } else {
          return of(false);
        }
      }),
    );
  }
}
