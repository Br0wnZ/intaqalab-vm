import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { WidgetStateService } from '../../services/widget-state.service';
import { VideoCameraOrientation } from './video-camera-orientation';

const mockWidgetStateService = {
  updateWidgetFormState: vi.fn(),
  addWidget: vi.fn(),
  placedWidgets: () => [],
};

describe('VideoCameraOrientation', () => {
  const renderWidget = (widgetId = 'test-video-camera-widget') =>
    render(VideoCameraOrientation, {
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

  it('should create', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('formState reports the correct widgetId', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.formState().widgetId).toBe('test-video-camera-widget');
  });
});
