import { ChangeDetectionStrategy, Component, ViewEncapsulation, effect, inject, input, signal } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslateModule } from '@ngx-translate/core';

import { TrialDocsService } from '../../../services/trial-docs-service';
import { TrialDocInfo } from './components/trial-doc-info/trial-doc-info';
import { TrialDocVersionsTab } from './components/trial-doc-versions-tab/trial-doc-versions-tab';

@Component({
  selector: 'inta-trial-doc-details',
  imports: [TranslateModule, MatTabsModule, TrialDocInfo, TrialDocVersionsTab],
  template: `
    <div class="w-full">
      <h2 class="text-base font-semibold text-gray-900 mb-6">{{ 'TRIAL_DOCS.DOC_DETAILS.TITLE' | translate }}</h2>

      <mat-tab-group
        class="inta-tabs-2 mb-6"
        [(selectedIndex)]="selectedTabIndex"
        (selectedIndexChange)="onTabChange($event)"
      >
        <mat-tab label="{{ 'TRIAL_DOCS.DOC_DETAILS.DOCUMENT_MAT_LABEL' | translate }}">
          <inta-trial-doc-info [documentId]="documentId()" />
        </mat-tab>

        <mat-tab label="{{ 'TRIAL_DOCS.DOC_DETAILS.VERSIONS_MAT_LABEL' | translate }}">
          <inta-trial-doc-versions-tab [documentId]="documentId()" />
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrialDocDetails {
  readonly #docsService = inject(TrialDocsService);

  readonly documentId = input<string | undefined>(undefined);

  selectedTabIndex = signal(0);

  constructor() {
    effect(() => {
      const id = this.documentId();
      if (id) {
        this.#docsService.getDocumentDetail(id);
        this.#docsService.getDocumentVersions(id);
        this.#docsService.getDocumentAssociatedTrials(id);
      } else {
        this.#docsService.resetDocumentDetail();
        this.#docsService.resetDocumentVersions();
        this.#docsService.resetDocumentAssociatedTrials();
      }
    });
  }

  onTabChange(index: number): void {
    this.selectedTabIndex.set(index);
  }
}
