import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { TrialDocsService } from '../../../../../services/trial-docs-service';
import { TrialDocVersions } from '../../../trial-doc-versions/trial-doc-versions';

@Component({
  selector: 'inta-trial-doc-versions-tab',
  imports: [TranslateModule, TrialDocVersions],
  template: `
    <div class="w-full">
      @if (documentVersionsResource.hasValue() && documentVersionsResource.value().length > 0) {
        @defer (on idle) {
          <inta-trial-doc-versions [documentId]="documentId()!" [documentVersions]="documentVersionsResource.value()" />
        } @placeholder {
          <div class="h-20 bg-gray-100 rounded animate-pulse mt-6"></div>
        }
      }
    </div>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrialDocVersionsTab {
  readonly #docsService = inject(TrialDocsService);

  readonly documentId = input<string | undefined>(undefined);

  protected readonly documentVersionsResource = this.#docsService.documentVersionsResource;
}
