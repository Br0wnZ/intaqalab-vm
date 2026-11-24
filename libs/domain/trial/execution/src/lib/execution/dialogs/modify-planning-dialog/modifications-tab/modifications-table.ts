import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StopClick } from '@intaqalab/ui';
import { TranslatePipe } from '@ngx-translate/core';

import type {
  ModificationClassification,
  PlanningChange,
  PlanningModification,
} from '../../../../data-access/planning-modifications';
import type { ModificationClassificationChangeEvent } from '../modify-planning-dialog.models';

export type PlanningModificationRow = PlanningModification | PlanningChange;

const DISPLAYED_COLUMNS: ReadonlyArray<string> = [
  'parameter',
  'action',
  'previousValue',
  'newValue',
  'affectedShots',
  'status',
  'accept',
  'request',
];

const FIELD_LABEL_MAP: Record<string, string> = {
  goal: 'Objetivo',
  temperature: 'Temperatura',
  minTime: 'Tiempo mínimo',
  maxTime: 'Tiempo máximo',
  elevation: 'Elevación',
  orientation: 'Orientación',
  distance: 'Distancia',
  powderWeight: 'Peso de pólvora',
  projectileLot: 'Lote proyectil',
  observations: 'Observaciones',
  maxEmissionDates: 'Fechas máximas de emisión',
  stanagCriteriaIds: 'Criterios STANAG',
  'ratingCriteria.v0c.useful1Min': 'Tiempo mínimo',
};

@Component({
  selector: 'inta-modifications-table',
  imports: [MatTableModule, MatSlideToggleModule, MatIconModule, MatTooltipModule, StopClick, TranslatePipe],
  styles: [
    `
      .planning-slide-toggle {
        --mdc-switch-selected-track-color: #7c3aed;
        --mdc-switch-selected-handle-color: #ffffff;
        --mdc-switch-selected-hover-track-color: #6d28d9;
        --mdc-switch-selected-hover-handle-color: #ffffff;
        --mdc-switch-selected-focus-track-color: #7c3aed;
        --mdc-switch-selected-focus-handle-color: #ffffff;
        --mdc-switch-selected-pressed-track-color: #6d28d9;
        --mdc-switch-selected-pressed-handle-color: #ffffff;
      }
    `,
  ],
  template: `
    @if (modifications().length === 0) {
      <div class="flex flex-col items-center justify-center py-12 px-4 text-center text-gray-500 border border-dashed border-gray-300 rounded-lg bg-gray-50">
        <mat-icon class="text-gray-400 !w-10 !h-10 !text-[40px] mb-2">playlist_add_check</mat-icon>
        <p class="text-sm m-0">
          {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.DIALOG.EMPTY_STATE' | translate }}
        </p>
      </div>
    } @else {
      <div class="overflow-x-auto border border-gray-200/80 rounded-xl bg-white shadow-xs">
        <table mat-table [dataSource]="modifications()" class="w-full">
          <ng-container matColumnDef="parameter">
            <th mat-header-cell *matHeaderCellDef class="font-normal text-gray-500 text-sm py-3.5 px-6">
              {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.PARAMETER' | translate }}
            </th>
            <td mat-cell *matCellDef="let row" class="text-sm text-gray-700 font-normal py-4 px-6">
              {{ getParameter(row) }}
            </td>
          </ng-container>

          <ng-container matColumnDef="action">
            <th mat-header-cell *matHeaderCellDef class="font-normal text-gray-500 text-sm py-3.5 px-6">
              <span class="inline-flex items-center gap-1">
                <span>{{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.ACTION' | translate }}</span>
                <span class="text-xs text-gray-400">↓</span>
              </span>
            </th>
            <td mat-cell *matCellDef="let row" class="py-4 px-6">
              <span
                class="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium"
                [class]="getActionBadgeClass(row)"
              >
                {{ getActionLabel(row) }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="previousValue">
            <th mat-header-cell *matHeaderCellDef class="font-normal text-gray-500 text-sm py-3.5 px-6">
              {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.PREVIOUS_VALUE' | translate }}
            </th>
            <td mat-cell *matCellDef="let row" class="text-sm text-gray-400 font-normal py-4 px-6">
              {{ getPreviousValue(row) }}
            </td>
          </ng-container>

          <ng-container matColumnDef="newValue">
            <th mat-header-cell *matHeaderCellDef class="font-normal text-gray-500 text-sm py-3.5 px-6">
              {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.NEW_VALUE' | translate }}
            </th>
            <td mat-cell *matCellDef="let row" class="text-sm text-gray-600 font-normal py-4 px-6">
              {{ getNewValue(row) }}
            </td>
          </ng-container>

          <ng-container matColumnDef="affectedShots">
            <th mat-header-cell *matHeaderCellDef class="font-normal text-gray-500 text-sm py-3.5 px-6">
              {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.AFFECTED_SHOTS' | translate }}
            </th>
            <td mat-cell *matCellDef="let row" class="text-sm text-gray-600 font-normal py-4 px-6">
              {{ getAffectedShots(row) }}
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef class="font-normal text-gray-500 text-sm py-3.5 px-6">
              <span class="inline-flex items-center gap-1">
                <span>{{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.STATUS' | translate }}</span>
                <span class="text-xs text-gray-400">↓</span>
              </span>
            </th>
            <td mat-cell *matCellDef="let row" class="py-4 px-6">
              <span
                class="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium"
                [class]="getStatusBadgeClass(row)"
              >
                {{ getStatusLabel(row) }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="accept">
            <th
              mat-header-cell
              *matHeaderCellDef
              class="font-normal text-gray-500 text-sm text-center py-3.5 px-6"
              [matTooltip]="'TRIAL_EXECUTION.PLANNING_MODIFICATION.CLASSIFICATION.ACCEPT_TOOLTIP' | translate"
            >
              {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.ACCEPT' | translate }}
            </th>
            <td mat-cell *matCellDef="let row" class="text-center py-4 px-6">
              <div class="flex items-center justify-center">
                <mat-slide-toggle
                  uiStopClick
                  [preventDefault]="false"
                  [checked]="isAcceptChecked(row)"
                  [disabled]="isClassificationDisabled(row)"
                  [attr.aria-label]="
                    ('TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.ACCEPT' | translate) + ' - ' + getParameter(row)
                  "
                  class="planning-slide-toggle"
                  (change)="onToggleClassification(row, 'acepta')"
                />
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="request">
            <th
              mat-header-cell
              *matHeaderCellDef
              class="font-normal text-gray-500 text-sm text-center py-3.5 px-6"
              [matTooltip]="'TRIAL_EXECUTION.PLANNING_MODIFICATION.CLASSIFICATION.REQUEST_TOOLTIP' | translate"
            >
              {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.REQUEST' | translate }}
            </th>
            <td mat-cell *matCellDef="let row" class="text-center py-4 px-6">
              <div class="flex items-center justify-center">
                <mat-slide-toggle
                  uiStopClick
                  [preventDefault]="false"
                  [checked]="isRequestChecked(row)"
                  [disabled]="isClassificationDisabled(row)"
                  [attr.aria-label]="
                    ('TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.REQUEST' | translate) + ' - ' + getParameter(row)
                  "
                  class="planning-slide-toggle"
                  (change)="onToggleClassification(row, 'solicita')"
                />
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns" class="bg-gray-50/60 border-b border-gray-100"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns" class="border-b border-gray-100 hover:bg-gray-50/40 transition-colors"></tr>
        </table>
      </div>
    }
  `,
})
export class ModificationsTable {
  readonly modifications = input<ReadonlyArray<PlanningModificationRow>>([]);
  readonly disabled = input<boolean>(false);

  readonly classificationChange = output<ModificationClassificationChangeEvent>();

  protected readonly displayedColumns = DISPLAYED_COLUMNS;

  protected getParameter(row: PlanningModificationRow): string {
    if ('parameter' in row && row.parameter) {
      return row.parameter;
    }
    if ('field' in row && row.field) {
      return FIELD_LABEL_MAP[row.field] ?? row.field;
    }
    return '-';
  }

  protected isClassificationDisabled(row: PlanningModificationRow): boolean {
    if (this.disabled()) {
      return true;
    }
    const status = 'status' in row ? row.status : undefined;
    return status !== 'BORRADOR' && status !== 'DRAFT';
  }

  protected isAcceptChecked(row: PlanningModificationRow): boolean {
    if ('requiresApproval' in row && typeof row.requiresApproval === 'boolean') {
      return row.requiresApproval;
    }
    return 'classification' in row && row.classification === 'acepta';
  }

  protected isRequestChecked(row: PlanningModificationRow): boolean {
    if ('requestClient' in row && typeof row.requestClient === 'boolean') {
      return row.requestClient;
    }
    return 'classification' in row && row.classification === 'solicita';
  }

  protected onToggleClassification(
    row: PlanningModificationRow,
    target: Exclude<ModificationClassification, 'none'>,
  ): void {
    if (this.isClassificationDisabled(row)) {
      return;
    }

    const currentChecked = target === 'acepta' ? this.isAcceptChecked(row) : this.isRequestChecked(row);
    const nextClassification: ModificationClassification = currentChecked ? 'none' : target;
    this.classificationChange.emit({
      modId: row.id,
      classification: nextClassification,
    });
  }

  protected getPreviousValue(row: PlanningModificationRow): string {
    const val = 'previousValue' in row ? row.previousValue : ('oldValue' in row ? row.oldValue : null);
    if (val === null || val === undefined || val === '') {
      return '-';
    }
    return String(val);
  }

  protected getNewValue(row: PlanningModificationRow): string {
    const val = 'newValue' in row ? row.newValue : null;
    if (val === null || val === undefined || val === '') {
      return '-';
    }
    return String(val);
  }

  protected getAffectedShots(row: PlanningModificationRow): string {
    if ('affectedShots' in row && row.affectedShots) {
      if (Array.isArray(row.affectedShots)) {
        if (row.affectedShots.length === 0) return '-';
        return row.affectedShots.join(', ');
      }
      return String(row.affectedShots);
    }
    if ('shotId' in row && row.shotId) {
      return '1';
    }
    return '-';
  }

  protected getActionLabel(row: PlanningModificationRow): string {
    if ('action' in row && row.action) {
      switch (row.action) {
        case 'Alta':
          return 'Añadido';
        case 'Baja':
          return 'Eliminado';
        case 'Modificación':
          return 'Modificado';
      }
    }
    if ('operation' in row && row.operation) {
      if (row.oldValue === null) {
        return 'Añadido';
      }
      if (row.newValue === null) {
        return 'Eliminado';
      }
      return 'Modificado';
    }
    return 'Modificado';
  }

  protected getActionBadgeClass(row: PlanningModificationRow): string {
    const label = this.getActionLabel(row);
    switch (label) {
      case 'Añadido':
        return 'bg-[#eff6ff] text-[#2563eb]';
      case 'Eliminado':
        return 'bg-red-50 text-red-600';
      case 'Modificado':
      default:
        return 'bg-[#fff7ed] text-[#ea580c]';
    }
  }

  protected getStatusLabel(row: PlanningModificationRow): string {
    const raw = 'status' in row ? row.status : '';
    switch (raw) {
      case 'ACEPTADO':
      case 'ACCEPTED':
        return 'Aceptado';
      case 'PENDIENTE':
      case 'PENDING':
        return 'Pendiente';
      case 'BORRADOR':
      case 'DRAFT':
        return 'Borrador';
      case 'RECHAZADO':
      case 'REJECTED':
        return 'Rechazado';
      default:
        return String(raw);
    }
  }

  protected getStatusBadgeClass(row: PlanningModificationRow): string {
    const label = this.getStatusLabel(row);
    switch (label) {
      case 'Aceptado':
        return 'bg-[#ecfdf5] text-[#059669]';
      case 'Pendiente':
        return 'bg-[#fff1f2] text-[#e11d48]';
      case 'Borrador':
        return 'bg-gray-100 text-gray-600';
      case 'Rechazado':
      default:
        return 'bg-red-50 text-red-700';
    }
  }
}

