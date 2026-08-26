import { TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';

import { WidgetStateService } from '../../services/widget-state.service';
import { ShotWidgetComponent } from './shot-widget';

const mockWidgetStateService = {
  updateWidgetFormState: vi.fn(),
  addWidget: vi.fn(),
  placedWidgets: () => [],
};

describe('ShotWidgetComponent', () => {
  const renderWidget = () =>
    render(ShotWidgetComponent, {
      inputs: { widgetId: 'test-shot-widget' },
      providers: [{ provide: WidgetStateService, useValue: mockWidgetStateService }],
      imports: [TranslateModule.forRoot()],
    });

  it('should create', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('formState reports the correct widgetId', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.formState().widgetId).toBe('test-shot-widget');
  });
});
