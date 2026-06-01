import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'ui-legend-trial-scheduler',
  imports: [TranslateModule],
  template: `
    <div role="list" aria-label="Leyenda del gráfico" class="legend">
      <div role="listitem" class="legend-item">
        <span aria-hidden="true" class="swatch special-date"></span>
        <span class="label">
          {{ 'TRIAL_SCHEDULER.LEGEND.SPECIAL_DAY' | translate }}
        </span>
      </div>

      <div role="listitem" class="legend-item">
        <span aria-hidden="true" class="swatch no-notam-date"></span>
        <span class="label">{{ 'TRIAL_SCHEDULER.LEGEND.NO_NOTAM' | translate }}</span>
      </div>

      <div role="listitem" class="legend-item">
        <span aria-hidden="true" class="swatch busy-date"></span>
        <span class="label">{{ 'TRIAL_SCHEDULER.LEGEND.BUSY' | translate }}</span>
      </div>

      <div role="listitem" class="legend-item">
        <span aria-hidden="true" class="swatch selected-date"></span>
        <span class="label">{{ 'TRIAL_SCHEDULER.LEGEND.SELECTED' | translate }}</span>
      </div>
    </div>
  `,
  styles: `
    .legend {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
      font-family:
        system-ui,
        -apple-system,
        'Segoe UI',
        Roboto,
        'Helvetica Neue',
        Arial;
      font-size: 14px;
    }

    .legend-item {
      display: inline-flex;
      gap: 8px;
      align-items: center;
    }

    .swatch {
      width: 14px;
      height: 14px;
      border-radius: 3px;
      flex: 0 0 14px;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06) inset;
    }

    .label {
      color: #222;
      line-height: 1;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegendTrialSchedulerComponent {}
