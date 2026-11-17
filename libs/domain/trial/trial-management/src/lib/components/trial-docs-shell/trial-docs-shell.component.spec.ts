import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, input } from '@angular/core';
import { provideTestingEnvironment } from '@intaqalab/config';
import { provideTranslateService } from '@ngx-translate/core';
import { render } from '@testing-library/angular';

import { TrialDocsShellComponent, injectionTokenTrialViewDocument } from './trial-docs-shell.component';

// vi.mock hoisted by Vitest
@Component({
  selector: 'inta-trial-doc-details',
  template: `
    <div data-testid="child-doc-id">{{ documentId }}</div>
  `,
})
class TrialDocDetailsStub {
  documentId = input<string>();
}

describe('TrialDocsShellComponent', () => {
  it('should create', async () => {
    const view = await render(TrialDocsShellComponent, {
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestingEnvironment(),
        { provide: injectionTokenTrialViewDocument, useValue: { id: 'doc-1' } },
        provideTranslateService(),
      ],
      declarations: [TrialDocDetailsStub],
    });

    expect(view.fixture.componentInstance).toBeTruthy();
  });

  it('should pass the injected id to the child component', async () => {
    const view = await render(TrialDocsShellComponent, {
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestingEnvironment(),
        { provide: injectionTokenTrialViewDocument, useValue: { id: 'doc-123' } },
        provideTranslateService(),
      ],
      declarations: [TrialDocDetailsStub],
    });

    expect(view.fixture.componentInstance.rawParams.id).toBe('doc-123');
  });
});
