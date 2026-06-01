import { Component, InjectionToken, Injector, inject } from '@angular/core';

import { TrialDocDetails } from '../trial-docs/trial-doc-details/trial-doc-details';

type ParamsComponent = { id: string };
export const injectionTokenTrialViewDocument = new InjectionToken<ParamsComponent>('params');

@Component({
  imports: [TrialDocDetails],
  template: `
    <inta-trial-doc-details [documentId]="rawParams.id" />
  `,
  styles: ``,
})
export class TrialDocsShellComponent {
  readonly #injector = inject(Injector);
  readonly rawParams = this.#injector.get(injectionTokenTrialViewDocument);
}
