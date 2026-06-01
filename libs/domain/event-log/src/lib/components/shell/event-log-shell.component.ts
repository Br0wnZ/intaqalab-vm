import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslateModule } from '@ngx-translate/core';

import { EventLogDocumentsComponent } from '../documents/documents.component';
import { EventLogGeneralDataComponent } from '../general-data/general-data.component';
import { EventLogMeasuresComponent } from '../measures/measures.component';
import { EventLogSeriesAndShootsComponent } from '../series-and-shoots/series-and-shoots.component';

@Component({
  imports: [
    TranslateModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    EventLogDocumentsComponent,
    EventLogGeneralDataComponent,
    EventLogSeriesAndShootsComponent,
    EventLogMeasuresComponent,
  ],
  template: `
    <mat-tab-group>
      <mat-tab id="documents" label="{{ 'EVENT_LOG.TABS.DOCUMENTS' | translate }}">
        <inta-event-log-documents class="mt-4" />
      </mat-tab>
      <mat-tab id="general-data" label="{{ 'EVENT_LOG.TABS.GENERAL_DATA' | translate }}">
        <ng-template matTabContent>
          <inta-event-log-general-data class="mt-4" />
        </ng-template>
      </mat-tab>
      <mat-tab id="series-and-shoots" label="{{ 'EVENT_LOG.TABS.SERIES_AND_SHOOTS' | translate }}">
        <ng-template matTabContent>
          <inta-event-log-series-and-shoots class="mt-4" />
        </ng-template>
      </mat-tab>
      <mat-tab id="measures" label="{{ 'EVENT_LOG.TABS.MEASURES' | translate }}">
        <ng-template matTabContent>
          <inta-event-log-measures class="mt-4" />
        </ng-template>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventLogShellComponent {}
