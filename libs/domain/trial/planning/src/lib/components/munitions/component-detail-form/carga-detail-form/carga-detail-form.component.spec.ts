import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatOptionHarness } from '@angular/material/core/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTestingEnvironment } from '@intaqalab/config';
import { createMockResource } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { LoadingZone } from '../../../../services/shooting-conditions.service';
import { ShootingConditionsService } from '../../../../services/shooting-conditions.service';
import { createEmptyComponentDetail } from '../../../../utils-models/munitions.model';
import { CargaDetailFormComponent } from './carga-detail-form.component';

const loadingZones: LoadingZone[] = [
  {
    id: 'loading-zone-1',
    denomination: { id: 'denomination-1', name: 'Denomination 1' },
    zone: ['1', '2', '3'],
    caliber: '',
    active: true,
  },
  {
    id: 'loading-zone-2',
    denomination: { id: 'denomination-2', name: 'Denomination 2' },
    zone: ['9'],
    caliber: '',
    active: true,
  },
  {
    id: 'loading-zone-3',
    denomination: { id: 'denomination-1', name: 'Denomination 1' },
    zone: ['4'],
    caliber: '',
    active: true,
  },
];

const mockShootingConditionsService = {
  getLoadingZonesResource: createMockResource(loadingZones),
  getLoadingZones: vi.fn(),
};

describe('CargaDetailFormComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function renderForm() {
    const view = await render(CargaDetailFormComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        provideTestingEnvironment(),
        { provide: ShootingConditionsService, useValue: mockShootingConditionsService },
      ],
      componentInputs: {
        detail: createEmptyComponentDetail('carga de proyección'),
      },
    });

    return {
      ...view,
      component: view.fixture.componentInstance,
      loader: TestbedHarnessEnvironment.loader(view.fixture),
      documentLoader: TestbedHarnessEnvironment.documentRootLoader(view.fixture),
    };
  }

  it('should disable loading zones until a denomination is selected', async () => {
    const { loader } = await renderForm();
    const selects = await loader.getAllHarnesses(MatSelectHarness);

    expect(selects).toHaveLength(2);
    expect(await selects[1].isDisabled()).toBe(true);
  });

  it('should render one option for each zone filtered by selected denomination', async () => {
    const { component, fixture, loader, documentLoader } = await renderForm();
    component.formModel.update((current) => ({
      ...current,
      denomination: { id: 'denomination-1', name: 'Denomination 1' },
    }));
    fixture.detectChanges();

    const selects = await loader.getAllHarnesses(MatSelectHarness);
    expect(await selects[1].isDisabled()).toBe(false);

    await selects[1].open();
    const options = await documentLoader.getAllHarnesses(MatOptionHarness);

    expect(await Promise.all(options.map((option) => option.getText()))).toEqual(['1', '2', '3', '4']);
  });

  it('should keep the selected loading zone id when selecting a zone option', async () => {
    const { component, fixture, loader, documentLoader } = await renderForm();
    component.formModel.update((current) => ({
      ...current,
      denomination: { id: 'denomination-1', name: 'Denomination 1' },
    }));
    fixture.detectChanges();

    const selects = await loader.getAllHarnesses(MatSelectHarness);
    await selects[1].open();
    const options = await documentLoader.getAllHarnesses(MatOptionHarness);
    await options[2].click();

    expect(component.formModel().loadingZoneId).toBe('loading-zone-1');
  });
});
