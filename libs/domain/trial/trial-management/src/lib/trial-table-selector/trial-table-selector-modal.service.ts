import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import type { FireTrial } from '@intaqalab/models';
import { lastValueFrom } from 'rxjs';

import { TrialTableSelectorModalShellComponent } from './components/shell/trial-table-selector-modal-shell.component';

@Injectable({
  providedIn: 'root',
})
export class TrialTableSelectorModalService {
  readonly #dialog = inject(MatDialog);

  select(): Promise<false | FireTrial> {
    const dialogRef = this.#dialog.open(TrialTableSelectorModalShellComponent, {
      maxWidth: 1200,
      width: '100vw',
      height: '100vh',
      maxHeight: 800,
    });

    return lastValueFrom(dialogRef.afterClosed());
  }
}
