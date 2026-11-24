import { NgClass } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ErrorState, Skeleton } from '@intaqalab/ui';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

import type {
  ModificationAction,
  ModificationClassification,
  ModificationStatus,
  PlanningModification,
} from '../../../data-access';
import { PlanningModificationsStore } from '../../../data-access';
import type {
  ClientModificationFilter,
  ClientModificationsDialogData,
  ClientModificationsDialogResult,
} from './client-modifications-dialog.models';

interface FilterTabOption {
  readonly id: ClientModificationFilter;
  readonly labelKey: string;
  readonly count: number;
}

@Component({
  selector: 'inta-client-modifications-dialog',
  imports: [
    NgClass,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TranslatePipe,
    Skeleton,
    ErrorState,
  ],
  providers: [PlanningModificationsStore],
  template: `
    <div class="flex flex-col max-h-[85vh]">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4 pb-4 border-b border-gray-200">
        <div class="flex flex-col gap-1">
          <h2 mat-dialog-title class="!m-0 !p-0 flex items-center gap-2 text-lg font-bold text-gray-900">
            <mat-icon class="text-[var(--inta-color-primary)]">fact_check</mat-icon>
            <span>{{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.CLIENT_REVIEW.TITLE' | translate }}</span>
          </h2>
          <p class="m-0 text-sm text-gray-600">
            {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.CLIENT_REVIEW.SUBTITLE' | translate }}
          </p>
        </div>

        <button
          mat-icon-button
          type="button"
          [attr.aria-label]="'TRIAL_EXECUTION.PLANNING_MODIFICATION.DIALOG.CLOSE_BTN' | translate"
          (click)="close()"
        >
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Filter Chips -->
      <div role="tablist" class="flex flex-wrap items-center gap-2 py-4">
        @for (tab of filterTabs(); track tab.id) {
          <button
            type="button"
            role="tab"
            class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer"
            [attr.aria-selected]="activeFilter() === tab.id"
            [ngClass]="
              activeFilter() === tab.id
                ? 'bg-[var(--inta-color-primary)] text-white border-[var(--inta-color-primary)]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            "
            (click)="selectFilter(tab.id)"
          >
            <span>{{ tab.labelKey | translate }}</span>
            <span
              class="px-1.5 py-0.5 rounded-full text-[11px] font-bold"
              [ngClass]="activeFilter() === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'"
            >
              {{ tab.count }}
            </span>
          </button>
        }
      </div>

      <!-- Content -->
      <mat-dialog-content class="!px-0 !py-0 flex-1 overflow-auto">
        @if (isLoading()) {
          <div class="flex flex-col gap-3 py-4">
            <ui-skeleton variant="rectangle" animation="wave" width="100%" height="2.5rem" />
            <ui-skeleton variant="rectangle" animation="wave" width="100%" height="2.5rem" />
            <ui-skeleton variant="rectangle" animation="wave" width="100%" height="2.5rem" />
          </div>
        } @else if (hasError()) {
          <div class="py-6">
            <ui-error-state
              [title]="'TRIAL_EXECUTION.PLANNING_MODIFICATION.MESSAGES.LOAD_ERROR' | translate"
              [message]="errorMessage()"
            />
          </div>
        } @else if (filteredModifications().length === 0) {
          <div
            class="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center rounded-lg border border-dashed border-gray-300 bg-gray-50"
          >
            <mat-icon class="!size-10 !text-[40px] text-gray-400">inbox</mat-icon>
            <p class="m-0 text-sm text-gray-600">
              {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.CLIENT_REVIEW.EMPTY_STATE' | translate }}
            </p>
          </div>
        } @else {
          <div class="overflow-x-auto rounded-lg border border-gray-200">
            <table class="w-full border-collapse text-left text-sm">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.PARAMETER' | translate }}
                  </th>
                  <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.ACTION' | translate }}
                  </th>
                  <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.PREVIOUS_VALUE' | translate }}
                  </th>
                  <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.NEW_VALUE' | translate }}
                  </th>
                  <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.AFFECTED_SHOTS' | translate }}
                  </th>
                  <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.STATUS' | translate }}
                  </th>
                  <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.ACCEPT' | translate }} /
                    {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.REQUEST' | translate }}
                  </th>
                  <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 text-right">
                    {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.ACTIONS' | translate }}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 bg-white">
                @for (mod of filteredModifications(); track mod.id) {
                  <tr class="hover:bg-gray-50/70 transition-colors">
                    <td class="px-4 py-3 font-medium text-gray-900">{{ mod.parameter }}</td>
                    <td class="px-4 py-3">
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        [ngClass]="getActionClass(mod.action)"
                      >
                        {{ getActionLabelKey(mod.action) | translate }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-gray-600">{{ formatValue(mod.previousValue) }}</td>
                    <td class="px-4 py-3 font-medium text-gray-900">{{ formatValue(mod.newValue) }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ formatAffectedShots(mod.affectedShots) }}</td>
                    <td class="px-4 py-3">
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        [ngClass]="getStatusClass(mod.status)"
                      >
                        {{ getStatusLabelKey(mod.status) | translate }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                        [matTooltip]="getClassificationTooltipKey(mod.classification) | translate"
                      >
                        {{ getClassificationLabelKey(mod.classification) | translate }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right whitespace-nowrap">
                      @if (canReviewRow(mod)) {
                        <div class="inline-flex items-center justify-end gap-2">
                          <button
                            mat-flat-button
                            type="button"
                            color="primary"
                            class="!h-8 !px-3 !text-xs"
                            [disabled]="isSaving()"
                            (click)="approve(mod)"
                          >
                            {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.CLIENT_REVIEW.ACCEPT_BTN' | translate }}
                          </button>
                          <button
                            mat-stroked-button
                            type="button"
                            color="warn"
                            class="!h-8 !px-3 !text-xs"
                            [disabled]="isSaving()"
                            (click)="reject(mod)"
                          >
                            {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.CLIENT_REVIEW.REJECT_BTN' | translate }}
                          </button>
                        </div>
                      } @else {
                        <span class="text-xs text-gray-400">—</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </mat-dialog-content>

      <!-- Footer -->
      <mat-dialog-actions class="!px-0 !pt-4 mt-4 border-t border-gray-200 flex justify-end">
        <button mat-stroked-button type="button" (click)="close()">
          {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.DIALOG.CLOSE_BTN' | translate }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
})
export class ClientModificationsDialog {
  readonly #dialogRef = inject<MatDialogRef<ClientModificationsDialog, ClientModificationsDialogResult>>(MatDialogRef);
  readonly #data = inject<ClientModificationsDialogData>(MAT_DIALOG_DATA);
  readonly #store = inject(PlanningModificationsStore);
  readonly #translate = inject(TranslateService);
  readonly #toastr = inject(ToastrService, { optional: true });

  readonly #activeFilter = signal<ClientModificationFilter>('ALL');
  readonly #hasAcceptedChanges = signal(false);
  readonly #hasDecisions = signal(false);

  protected readonly activeFilter = this.#activeFilter.asReadonly();
  protected readonly allowReview = computed(() => this.#data.allowReview !== false);
  protected readonly isLoading = this.#store.isLoading;
  protected readonly isSaving = this.#store.isSaving;
  protected readonly hasError = computed(
    () => Boolean(this.#store.error()) && this.#store.modifications().length === 0,
  );
  protected readonly errorMessage = computed(() => this.#store.error() ?? '');

  protected readonly filteredModifications = computed<PlanningModification[]>(() => {
    const filter = this.#activeFilter();
    const items = this.#store.modifications();
    if (filter === 'ALL') {
      return items;
    }
    return items.filter((item) => item.status === filter);
  });

  protected readonly filterTabs = computed<ReadonlyArray<FilterTabOption>>(() => [
    {
      id: 'ALL',
      labelKey: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.CLIENT_REVIEW.FILTER_ALL',
      count: this.#store.modifications().length,
    },
    {
      id: 'PENDIENTE',
      labelKey: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.CLIENT_REVIEW.FILTER_PENDING',
      count: this.#store.pendingModifications().length,
    },
    {
      id: 'ACEPTADO',
      labelKey: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.CLIENT_REVIEW.FILTER_ACCEPTED',
      count: this.#store.acceptedModifications().length,
    },
    {
      id: 'RECHAZADO',
      labelKey: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.CLIENT_REVIEW.FILTER_REJECTED',
      count: this.#store.rejectedModifications().length,
    },
  ]);

  constructor() {
    void this.#store.loadModifications(this.#data.fireTrialId, this.#data.centerId);
  }

  protected selectFilter(filter: ClientModificationFilter): void {
    this.#activeFilter.set(filter);
  }

  protected canReviewRow(mod: PlanningModification): boolean {
    return this.allowReview() && mod.status === 'PENDIENTE';
  }

  protected async approve(mod: PlanningModification): Promise<void> {
    const updated = await this.#store.approveModification(
      mod.id,
      undefined,
      this.#data.fireTrialId,
      this.#data.centerId,
    );
    if (!updated) {
      this.#toastr?.error(this.#translate.instant('TRIAL_EXECUTION.PLANNING_MODIFICATION.MESSAGES.APPROVE_ERROR'));
      return;
    }

    this.#hasAcceptedChanges.set(true);
    this.#hasDecisions.set(true);
    this.#toastr?.success(this.#translate.instant('TRIAL_EXECUTION.PLANNING_MODIFICATION.MESSAGES.APPROVE_SUCCESS'));
  }

  protected async reject(mod: PlanningModification): Promise<void> {
    const updated = await this.#store.rejectModification(
      mod.id,
      undefined,
      this.#data.fireTrialId,
      this.#data.centerId,
    );
    if (!updated) {
      this.#toastr?.error(this.#translate.instant('TRIAL_EXECUTION.PLANNING_MODIFICATION.MESSAGES.REJECT_ERROR'));
      return;
    }

    this.#hasDecisions.set(true);
    this.#toastr?.success(this.#translate.instant('TRIAL_EXECUTION.PLANNING_MODIFICATION.MESSAGES.REJECT_SUCCESS'));
  }

  protected close(): void {
    this.#dialogRef.close({
      hasAcceptedChanges: this.#hasAcceptedChanges(),
      hasDecisions: this.#hasDecisions(),
    });
  }

  protected formatValue(value: string | number | null): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    return String(value);
  }

  protected formatAffectedShots(shots: string[] | null): string {
    if (!shots || shots.length === 0) {
      return '—';
    }
    return shots.join(', ');
  }

  protected getActionLabelKey(action: ModificationAction): string {
    switch (action) {
      case 'Alta':
        return 'TRIAL_EXECUTION.PLANNING_MODIFICATION.ACTION_TYPES.ALTA';
      case 'Baja':
        return 'TRIAL_EXECUTION.PLANNING_MODIFICATION.ACTION_TYPES.BAJA';
      case 'Modificación':
      default:
        return 'TRIAL_EXECUTION.PLANNING_MODIFICATION.ACTION_TYPES.MODIFICACION';
    }
  }

  protected getActionClass(action: ModificationAction): string {
    switch (action) {
      case 'Alta':
        return 'bg-emerald-100 text-emerald-800';
      case 'Baja':
        return 'bg-rose-100 text-rose-800';
      case 'Modificación':
      default:
        return 'bg-blue-100 text-blue-800';
    }
  }

  protected getStatusLabelKey(status: ModificationStatus): string {
    switch (status) {
      case 'BORRADOR':
        return 'TRIAL_EXECUTION.PLANNING_MODIFICATION.STATUS.BORRADOR';
      case 'PENDIENTE':
        return 'TRIAL_EXECUTION.PLANNING_MODIFICATION.STATUS.PENDIENTE';
      case 'ACEPTADO':
        return 'TRIAL_EXECUTION.PLANNING_MODIFICATION.STATUS.ACEPTADO';
      case 'RECHAZADO':
        return 'TRIAL_EXECUTION.PLANNING_MODIFICATION.STATUS.RECHAZADO';
    }
  }

  protected getStatusClass(status: ModificationStatus): string {
    switch (status) {
      case 'BORRADOR':
        return 'bg-slate-100 text-slate-700';
      case 'PENDIENTE':
        return 'bg-amber-100 text-amber-800';
      case 'ACEPTADO':
        return 'bg-green-100 text-green-800';
      case 'RECHAZADO':
        return 'bg-red-100 text-red-800';
    }
  }

  protected getClassificationLabelKey(classification: ModificationClassification): string {
    switch (classification) {
      case 'acepta':
        return 'TRIAL_EXECUTION.PLANNING_MODIFICATION.CLASSIFICATION.ACCEPT';
      case 'solicita':
        return 'TRIAL_EXECUTION.PLANNING_MODIFICATION.CLASSIFICATION.REQUEST';
      case 'none':
      default:
        return 'TRIAL_EXECUTION.PLANNING_MODIFICATION.CLASSIFICATION.NONE';
    }
  }

  protected getClassificationTooltipKey(classification: ModificationClassification): string {
    switch (classification) {
      case 'acepta':
        return 'TRIAL_EXECUTION.PLANNING_MODIFICATION.CLASSIFICATION.ACCEPT_TOOLTIP';
      case 'solicita':
        return 'TRIAL_EXECUTION.PLANNING_MODIFICATION.CLASSIFICATION.REQUEST_TOOLTIP';
      case 'none':
      default:
        return 'TRIAL_EXECUTION.PLANNING_MODIFICATION.CLASSIFICATION.NONE_TOOLTIP';
    }
  }
}
