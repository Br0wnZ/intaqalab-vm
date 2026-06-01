import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';

import { WharehouseFilterComponent } from './wharehouse-filter.component';

// vi.mock hoisted by Vitest — must use synchronous factory (Issue #14: ng2-pdf-viewer crash)
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

async function setup() {
  const renderResult = await render(WharehouseFilterComponent, {
    declarations: [],
    imports: [TranslateModule.forRoot()],
    providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
    componentInputs: {
      placeholdeTranslation: 'Search...',
    },
  });

  const fixture = renderResult.fixture;
  fixture.detectChanges();
  return fixture;
}

describe('WharehouseFilterComponent', () => {
  it('shoud create', async () => {
    const fixture = await setup();
    expect(fixture).toBeTruthy();
  });
});
