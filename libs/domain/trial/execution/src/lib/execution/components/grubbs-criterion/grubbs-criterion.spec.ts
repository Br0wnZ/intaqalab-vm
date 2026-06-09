import { TestBed } from '@angular/core/testing';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { TranslateModule } from '@ngx-translate/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { provideTestingEnvironment } from '@intaqalab/config';
import { ExecutionStore } from '../../../+state/execution.store';
import { WidgetStateService } from '../../services/widget-state.service';
import { GrubbsCriterionWidget } from './grubbs-criterion';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

describe('GrubbsCriterionWidget', () => {
  const renderWidget = (widgetId = 'test-grubbs') =>
    render(GrubbsCriterionWidget, {
      inputs: { widgetId },
      providers: [
        provideNoopAnimations(),
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WidgetStateService, useValue: mockWidgetStateService },
        ExecutionStore,
      ],
      imports: [TranslateModule.forRoot()],
    });

  it('renders without errors', async () => {
    await renderWidget();
    expect(document.querySelector('h3')).toBeTruthy();
  });

  it('formState starts clean (not dirty)', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.formState().dirty).toBe(false);
    expect(fixture.componentInstance.formState().widgetId).toBe('test-grubbs');
  });

  it('hasSelection is false when no serie/variable selected', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance['hasSelection']()).toBe(false);
  });

  it('saveForm persists selection to the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    await fixture.componentInstance.saveForm();
    expect(store.grubbsCriterion()).toBeDefined();
  });

  it('resetForm restores values from the store', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance.resetForm();
    const stored = TestBed.inject(ExecutionStore).grubbsCriterion();
    expect(fixture.componentInstance['formModel']().serie).toBe(stored.serie);
    expect(fixture.componentInstance['formModel']().variable).toBe(stored.variable);
  });

  it('setOutlierExcluded updates outlier excluded state in store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    // Inject a mock outlier
    store.updateGrubbsCriterion({
      outliers: [{ shotId: 'shot-1', label: 'Test - Disparo 1', excluded: false }],
    });
    fixture.componentInstance.setOutlierExcluded('shot-1', true);
    const outlier = store.grubbsCriterion().outliers.find((o) => o.shotId === 'shot-1');
    expect(outlier?.excluded).toBe(true);
  });
});
