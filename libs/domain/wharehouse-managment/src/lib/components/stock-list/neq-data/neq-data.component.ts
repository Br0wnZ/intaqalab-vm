import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { MunitionsDumpsStore } from '../../../+state/munition-dumps.store';
import type { MunitionsDumpModelCell } from '../../../models/munitions-dumps.model';

@Component({
  selector: 'inta-stock-list-neq-data',
  imports: [MatButtonModule, MatExpansionModule, TranslateModule, IntaIconComponent],
  template: `
    @for (munitionDump of munitionDumpsStore.items(); track munitionDump.id) {
      <mat-expansion-panel hideToggle class="neq-panel" (click)="$event.stopPropagation()" #panel>
        <mat-expansion-panel-header class="neq-panel__header">
          <mat-panel-title class="neq-panel__title">
            {{ munitionDump.munitionDumpId }}
          </mat-panel-title>

          <ui-inta-icon
            name="chevronDown"
            size="xxl"
            class="neq-panel__chevron"
            [class.neq-panel__chevron--open]="panel.expanded"
          />
        </mat-expansion-panel-header>

        <div class="neq-content">
          <div class="neq-row">
            <span>{{ 'WHAREHOUSE_MANAGMENT.STOCK_LIST.NEQ_DATA.NEQ' | translate }}</span>
            <strong>{{ munitionDump.currentNeq }} / {{ munitionDump.maxNeq }}</strong>
          </div>

          @for (cell of munitionDump.cells; track cell.name) {
            <div class="neq-row">
              <span>{{ cell.name }}</span>
              <strong>{{ setCellNeqLabel(cell, munitionDump.maxRiskGroupNeqPerCell, munitionDump.maxNeq) }}</strong>
            </div>
          }
        </div>
      </mat-expansion-panel>
    }
  `,
  styleUrl: './neq-data.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NeqDataComponent {
  readonly munitionDumpsStore = inject(MunitionsDumpsStore);

  setCellNeqLabel(cell: MunitionsDumpModelCell, maxRiskGroupNeqPerCell: number, maxNeq: number): string {
    const current = (cell.currentRiskGroups11And12Neq ?? 0) + (cell.currentOtherRiskGroupsNeq ?? 0);

    if (!current) return '0';

    const maxRisk = cell.currentRiskGroups11And12Neq ? maxRiskGroupNeqPerCell : maxNeq;
    return `${current.toFixed(2)} / ${maxRisk}`;
  }
}
