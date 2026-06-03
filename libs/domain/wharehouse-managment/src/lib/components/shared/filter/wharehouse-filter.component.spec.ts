import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';

import { WharehouseFilterComponent } from './wharehouse-filter.component';

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
