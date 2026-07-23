import type { WritableSignal } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import type { Configuration, Serie } from '../../../utils-models/munitions.model';
import { createEmptyConfiguration } from '../../../utils-models/munitions.model';
import type { Shot } from '../../../utils-models/series-and-shots.model';
import { ConfigurationFormComponent } from '../configuration-form/configuration-form.component';

@Component({
  selector: 'inta-serie-panel',
  imports: [
    MatExpansionModule,
    MatButtonModule,
    MatIconModule,
    ConfigurationFormComponent,
    TranslateModule,
    IntaIconComponent,
  ],
  template: `
    <mat-expansion-panel
      class="!rounded-lg !shadow-none border border-gray-200 !m-0"
      [expanded]="isExpanded()"
      (opened)="isExpanded.set(true)"
      (closed)="isExpanded.set(false)"
    >
      <!-- Serie Header -->
      <mat-expansion-panel-header class="!bg-gray-200">
        <div class="flex items-center justify-between w-full pr-4">
          <span class="text-sm font-semibold text-gray-900">
            {{
              'TRIAL_PLANNING.MUNITIONS.SERIE_PANEL.TITLE' | translate: { index: serieIndex() + 1, name: serieName() }
            }}
          </span>
          <button
            mat-flat-button
            class="!h-7 !min-h-0 !px-2 !text-xs flex items-center gap-1"
            [disabled]="readonly() || allShotsAssigned()"
            (click)="onAddMunition(); $event.stopPropagation()"
          >
            <ui-inta-icon name="plus" size="xs" />
            {{ 'TRIAL_PLANNING.MUNITIONS.SERIE_PANEL.add_munition' | translate }}
          </button>
        </div>
      </mat-expansion-panel-header>

      <!-- Serie Content -->
      <div class="bg-gray-200 px-2">
        @for (config of configurations(); track config.id; let configIdx = $index) {
          <mat-expansion-panel class="!rounded-none !shadow-none !-mt-1">
            <!-- Configuration Header -->
            <mat-expansion-panel-header
              class="!h-14 !bg-gray-200 [&>.mat-content]:border-b [&>.mat-content]:border-gray-700 [&>.mat-content]:-mr-3 [&>.mat-content]:pb-2"
            >
              <div class="flex items-center w-full justify-between py-1">
                <span class="text-sm font-semibold text-gray-900">
                  {{ 'TRIAL_PLANNING.MUNITIONS.SERIE_PANEL.CONFIG_TITLE' | translate: { index: configIdx + 1 } }}
                </span>
                <!-- <button
                  mat-icon-button
                  class="!h-7 !w-7 !min-h-0 text-red-500 hover:text-red-700 mr-8"
                  [attr.aria-label]="'TRIAL_PLANNING.MUNITIONS.SERIE_PANEL.DELETE_CONFIG' | translate"
                  (click)="onDeleteConfiguration(configIdx); $event.stopPropagation()"
                >
                  <mat-icon class="!text-base !text-red-500">delete</mat-icon>
                </button> -->
                <div class="flex items-center mr-4 mt-2">
                  <button
                    mat-icon-button
                    type="button"
                    class="!text-gray-500 hover:!text-red-500"
                    [disabled]="readonly()"
                    [attr.aria-label]="'TRIAL_PLANNING.MUNITIONS.SERIE_PANEL.DELETE_CONFIG' | translate"
                    (click)="onDeleteConfiguration(configIdx); $event.stopPropagation()"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
            </mat-expansion-panel-header>

            <!-- Configuration Form -->
            <inta-configuration-form
              [config]="config"
              [configIndex]="configIdx"
              [shots]="shots()"
              [excludeShotIds]="getExcludeShotIds(configIdx)"
              [readonly]="readonly()"
              (configChange)="onConfigChange(configIdx, $event)"
            />
          </mat-expansion-panel>
        }
        @if (configurations().length === 0) {
          <div class="text-center py-12 text-gray-400">
            <mat-icon class="!text-5xl !w-12 !h-12 mx-auto mb-2">inbox</mat-icon>
            <p>{{ 'TRIAL_PLANNING.MUNITIONS.SERIE_PANEL.EMPTY_CONFIGS' | translate }}</p>
          </div>
        }
      </div>
    </mat-expansion-panel>
  `,
  styles: `
    :host {
      display: block;
    }

    .mat-expansion-panel-body,
    .mat-mdc-expansion-panel-body {
      padding-top: 0 !important;
      margin-top: 0 !important;
    }

    .mat-expansion-panel-body {
      padding: 0 !important;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeriePanelComponent {
  readonly serie = input.required<Serie>();

  readonly serieIndex = input.required<number>();

  readonly seriesSignal = input.required<WritableSignal<Serie[]>>();

  readonly shots = input<Shot[]>([]);

  readonly expanded = input(false);

  readonly readonly = input<boolean>(false);

  readonly serieName = computed(() => this.serie().seriesName);

  readonly configurations = computed(() => this.serie().configurations);

  readonly deleteConfiguration = output<number>();

  readonly isExpanded = linkedSignal(() => this.expanded());

  readonly allShotsAssigned = computed(() => {
    const shots = this.shots();
    if (shots.length === 0) return false;
    const assigned = new Set(this.configurations().flatMap((c) => c.assignedShotIds ?? []));
    return shots.every((s) => assigned.has(s.id));
  });

  getExcludeShotIds(configIdx: number): string[] {
    return this.configurations()
      .filter((_, idx) => idx !== configIdx)
      .flatMap((c) => c.assignedShotIds ?? []);
  }

  onAddMunition(): void {
    if (this.readonly()) {
      return;
    }
    const serieIdx = this.serieIndex();
    const seriesId = this.serie().seriesId;
    this.seriesSignal().update((series) =>
      series.map((s, idx) =>
        idx === serieIdx ? { ...s, configurations: [...s.configurations, createEmptyConfiguration(seriesId)] } : s,
      ),
    );
    this.isExpanded.set(true);
  }

  onConfigChange(configIndex: number, config: Configuration): void {
    if (this.readonly()) {
      return;
    }
    const serieIdx = this.serieIndex();
    this.seriesSignal().update((series) =>
      series.map((s, idx) => {
        if (idx !== serieIdx) return s;
        const updatedConfigs = [...s.configurations];
        updatedConfigs[configIndex] = config;
        return { ...s, configurations: updatedConfigs };
      }),
    );
  }

  onDeleteConfiguration(configIndex: number): void {
    if (this.readonly()) {
      return;
    }
    this.deleteConfiguration.emit(configIndex);
  }
}
