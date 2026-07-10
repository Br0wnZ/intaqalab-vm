import type { Signal } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import type { PageEvent } from '@angular/material/paginator';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import type { Sort } from '@angular/material/sort';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { FireTrial, TrialSearchFilters, TrialStatus } from '@intaqalab/models';
import { injectTrialStatus } from '@intaqalab/models';
import { Badge, IntaIconComponent } from '@intaqalab/ui';
import { IntaDatePipe } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import { TrialStore } from '../../+state/trial-list.store';

const DEFAULT_COLUMNS = [
  'trialNumber',
  'status',
  'client',
  'description',
  'fireTrialType',
  'usuariosAsignados',
  'otrosDatos',
] as const;

const SCHEDULER_COLUMNS = [
  'trialNumber',
  'description',
  'fireTrialType',
  'client',
  'requestedDate',
  'actions',
] as const;

const EXECUTION_SELECTOR_COLUMNS = [
  'trialNumber',
  'description',
  'status',
  'fireTrialType',
  'client',
  'scheduledDates',
] as const;

@Component({
  selector: 'inta-trial-list',
  imports: [
    TranslateModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSelectModule,
    IntaDatePipe,
    Badge,
    IntaIconComponent,
  ],
  template: `
    <div class="inta-bg-white shadow-sm overflow-hidden -mx-6 -mb-6 mt-8">
      <div class="overflow-x-auto">
        <table mat-table matSort class="w-full" [dataSource]="store.items()" (matSortChange)="onSort($event)">
          <!-- Trial Number Column -->
          <ng-container matColumnDef="trialNumber">
            <th
              *matHeaderCellDef
              mat-header-cell
              mat-sort-header="createdAt"
              class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
            >
              {{ 'TRIALS_LIST.TABLE.TRIAL_NUMBER' | translate }}
            </th>
            <td *matCellDef="let trial" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              @if (scheduler()) {
                <span>{{ trial.trialNumber }}</span>
              } @else if (executionSelector()) {
                <button class="inta-link" (click)="scheduleTrial.emit(trial)">
                  {{ trial.trialNumber }}
                </button>
              } @else {
                <button class="inta-link" (click)="goTrialDetail.emit(trial)">
                  {{ trial.trialNumber }}
                </button>
              }
            </td>
          </ng-container>

          <!-- Status Column -->
          <ng-container matColumnDef="status">
            <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'TRIALS_LIST.TABLE.STATUS' | translate }}
            </th>
            <td *matCellDef="let trial" mat-cell class="px-6 py-4 text-sm !bg-white">
              <ui-badge [status]="trial.status">
                {{ getTrialStatusLabel(trial.status) }}
              </ui-badge>
            </td>
          </ng-container>

          <!-- Client Column -->
          <ng-container matColumnDef="client">
            <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'TRIALS_LIST.TABLE.CLIENT' | translate }}
            </th>
            <td *matCellDef="let trial" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              {{ trial.client.name }}
            </td>
          </ng-container>

          <!-- Description Column -->
          <ng-container matColumnDef="description">
            <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'TRIALS_LIST.TABLE.DESCRIPTION' | translate }}
            </th>
            <td *matCellDef="let trial" mat-cell class="px-6 py-4 text-sm text-gray-600 max-w-xs !bg-white">
              <div
                matTooltipPosition="above"
                matTooltipClass="tw-tooltip"
                class="truncate"
                [matTooltip]="trial.description"
              >
                {{ trial.description }}
              </div>
            </td>
          </ng-container>

          <!-- Fire Trial Type Column -->
          <ng-container matColumnDef="fireTrialType">
            <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'TRIALS_LIST.TABLE.TYPE' | translate }}
            </th>
            <td *matCellDef="let trial" mat-cell class="px-6 py-4 text-sm !bg-white">
              <div
                class="rounded-xl bg-purple-600/10 text-purple-600 py-0.5 px-2.5 my-4 w-fit border border-transparent text-md transition-all font-medium"
              >
                {{ trial.fireTrialType.name }}
              </div>
            </td>
          </ng-container>

          <!-- Assigned Users Column -->
          <ng-container matColumnDef="usuariosAsignados">
            <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'TRIALS_LIST.TABLE.ASSIGNED_USER' | translate }}
            </th>
            <td *matCellDef="let trial" mat-cell class="px-6 py-4 !bg-white">
              <div class="flex -space-x-2">
                @if (trial.planningUsers?.length && trial.planningUsers[0]) {
                  <div
                    matTooltipPosition="above"
                    class="min-w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-white flex items-center justify-center cursor-pointer hover:z-10 transition-transform hover:scale-110 px-2"
                    [matTooltip]="getUserTooltip(trial.planningUsers[0].fullName)"
                  >
                    <span class="text-white text-xs font-medium">
                      {{ setUserBubble(trial.planningUsers[0].fullName) }}
                    </span>
                  </div>
                }
              </div>
            </td>
          </ng-container>

          <!-- Other Data Column -->
          <ng-container matColumnDef="otrosDatos">
            <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'TRIALS_LIST.TABLE.OTHER_DATA' | translate }}
            </th>
            <td *matCellDef="let trial" mat-cell class="px-6 py-4 !bg-white">
              <div class="flex items-center gap-3">
                <button
                  mat-icon-button
                  matTooltipPosition="above"
                  class="!text-gray-600"
                  [matTooltip]="trial.observations"
                >
                  <ui-inta-icon name="info" size="xxl" />
                </button>
                <button
                  mat-icon-button
                  matTooltipPosition="above"
                  class="!text-gray-600"
                  [matTooltip]="'TRIALS_LIST.TABLE.SCHEDULED_DATE' | translate: { date: getSchudeledDate(trial) }"
                >
                  <ui-inta-icon name="calendar" size="xxl" />
                </button>
              </div>
            </td>
          </ng-container>

          <!-- Observations Column (Scheduler) -->
          <ng-container matColumnDef="observations">
            <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'TRIALS_LIST.TABLE.OBSERVATIONS' | translate }}
            </th>
            <td *matCellDef="let trial" mat-cell class="px-6 py-4 text-sm text-gray-600 max-w-xs !bg-white">
              <div
                matTooltipPosition="above"
                matTooltipClass="tw-tooltip"
                class="truncate"
                [matTooltip]="trial.observations"
              >
                {{ trial.observations }}
              </div>
            </td>
          </ng-container>

          <!-- Requested Date Column (Scheduler) -->
          <ng-container matColumnDef="requestedDate">
            <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'TRIALS_LIST.TABLE.REQUESTED_DATE' | translate }}
            </th>
            <td *matCellDef="let trial" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              {{ trial.requestedDate | intaDate }}
            </td>
          </ng-container>

          <!-- Actions Column (Scheduler) -->
          <ng-container matColumnDef="actions">
            <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'TRIALS_LIST.TABLE.ACTIONS' | translate }}
            </th>
            <td *matCellDef="let trial" mat-cell class="px-6 py-4 !bg-white">
              <button mat-icon-button class="!text-gray-600 scale-90" (click)="scheduleTrial.emit(trial)">
                <ui-inta-icon name="calendar" size="xxl" />
              </button>
            </td>
          </ng-container>

          <!-- Scheduled Dates Column (Execution Selector) -->
          <ng-container matColumnDef="scheduledDates">
            <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'TRIALS_LIST.TABLE.SCHEDULED_DATES' | translate }}
            </th>
            <td *matCellDef="let trial" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              {{ getSchudeledDate(trial) }}
            </td>
          </ng-container>

          <tr *matHeaderRowDef="displayedColumns()" mat-header-row></tr>
          <tr *matRowDef="let row; columns: displayedColumns()" mat-row class="hover:bg-gray-50 transition-colors"></tr>
        </table>
      </div>

      <mat-paginator
        class="!bg-white"
        [length]="store.totalElements()"
        [pageIndex]="pageIndex()"
        [pageSize]="pageSize()"
        [pageSizeOptions]="[5, 10, 25, 50]"
        (page)="onPage($event)"
      />

      @if (store.error()) {
        <div class="text-red-500 mt-2 p-4">{{ 'TRIALS_LIST.ERROR' | translate }}: {{ store.error() }}</div>
      }
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TrialStore, IntaDatePipe],
})
export class TrialListComponent {
  readonly #trialStatus = injectTrialStatus();

  readonly store = inject(TrialStore);

  readonly filters = input<Partial<TrialSearchFilters>>();
  readonly scheduler = input(false);
  readonly executionSelector = input(false);

  readonly goTrialDetail = output<{ id: FireTrial['id'] }>();
  readonly scheduleTrial = output<FireTrial>();

  readonly #filtersSignal = signal<Partial<TrialSearchFilters>>({});

  readonly displayedColumns = computed(() => {
    if (this.scheduler()) return [...SCHEDULER_COLUMNS];
    if (this.executionSelector()) return [...EXECUTION_SELECTOR_COLUMNS];
    return [...DEFAULT_COLUMNS];
  });

  readonly pageIndex = computed(() => (this.store.currentSearch().page ?? 1) - 1);
  readonly pageSize = computed(() => this.store.currentSearch().pageSize ?? 10);

  readonly intaDatePipe = inject(IntaDatePipe);

  constructor() {
    effect(() => {
      const newFilters = this.filters() ?? {};
      untracked(() => {
        this.#filtersSignal.set(newFilters);
        this.store.search(newFilters);
      });
    });
  }

  getTrialStatusLabel(status: TrialStatus): string {
    return this.#trialStatus().find((s) => s.value === status)?.label ?? status;
  }

  getUserTooltip(fullName: string): string {
    return `Planificación de la prueba\n${fullName}`;
  }

  setUserBubble(fullName: string) {
    const ext = fullName.split('(');
    let result = '';

    if (ext && ext.length > 1) {
      const name = ext[0];

      if (!name) return;

      const fullName = name.split(' ');

      fullName.forEach((item) => {
        result += item.charAt(0);
      });

      result += '(P.E)';
    } else {
      const fullNameArray = fullName.split(' ');

      fullNameArray.forEach((item) => {
        result += item.charAt(0);
      });
    }

    return result;
  }

  getSchudeledDate(trial: FireTrial): string {
    if (trial.schedule) {
      const dates = trial.schedule.map((item) => this.intaDatePipe.transform(item.date)).join(', ');
      return dates;
    }
    return this.intaDatePipe.transform(trial.requestedDate);
  }

  onTrialSelect(trial: FireTrial): void {
    this.goTrialDetail.emit({ id: trial.id });
  }

  onPage(event: PageEvent): void {
    this.store.setPagination(event.pageIndex, event.pageSize);
  }

  onSort(event: Sort): void {
    this.store.setSort(event.active, event.direction || 'asc');
  }

  public get filtersSignal(): Signal<Partial<TrialSearchFilters>> {
    return this.#filtersSignal.asReadonly();
  }
}
