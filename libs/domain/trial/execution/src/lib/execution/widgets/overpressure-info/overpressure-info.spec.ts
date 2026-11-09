/* eslint-disable @typescript-eslint/no-empty-function */
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { PressureUnitEnum } from '@intaqalab/models';
import type { AppLocale } from '@intaqalab/utils';
import { LOCALE_SIGNAL } from '@intaqalab/utils';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { withOverpressure } from '../../../+state/features/overpressure.feature';
import { ExecutionService } from '../../../services/execution.service';
import type { TrialOverpressureInfoResponse } from '../../models/trial-overpressure-info.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { OverpressureInfoWidget } from './overpressure-info';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

const OverpressureTestStore = signalStore(
  withState({ fireTrialId: null as string | null }),
  withOverpressure(),
  withMethods((store) => ({
    setFireTrialId(fireTrialId: string): void {
      patchState(store, { fireTrialId });
    },
  })),
);

describe('OverpressureInfoWidget', () => {
  const response: TrialOverpressureInfoResponse = {
    overpressureInfo: {
      maximumPressure: 273.751234567,
      minimumPressure: 262.05,
      referencePressure: 233.97,
      pressureUnit: PressureUnitEnum.MPA,
      safetyPressure: null,
      targetPressure: 267.9006172835,
    },
    warnings: [{ code: 'SAFETY_PRESSURE_UNAVAILABLE', message: 'Calibry unavailable' }],
  };
  const fetchInfo = vi.fn<(id: string) => Promise<TrialOverpressureInfoResponse>>();
  const updateInfo = vi.fn<ExecutionService['updateTrialOverpressureInfo']>();

  beforeEach(() => {
    fetchInfo.mockReset().mockResolvedValue(response);
    updateInfo.mockReset().mockImplementation(async (_id, body) => ({
      overpressureInfo: {
        ...body,
        safetyPressure: null,
        targetPressure: (body.maximumPressure + body.minimumPressure) / 2,
      },
      warnings: [],
    }));
  });

  const renderWidget = async (locale: AppLocale = 'es-ES') => {
    const view = await render(OverpressureInfoWidget, {
      inputs: { widgetId: 'test-widget' },
      providers: [
        provideNoopAnimations(),
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WidgetStateService, useValue: mockWidgetStateService },
        OverpressureTestStore,
        { provide: ExecutionStore, useExisting: OverpressureTestStore },
        {
          provide: ExecutionService,
          useValue: { fetchTrialOverpressureInfo: fetchInfo, updateTrialOverpressureInfo: updateInfo },
        },
        { provide: LOCALE_SIGNAL, useValue: signal(locale) },
      ],
      imports: [TranslateModule.forRoot()],
    });
    TestBed.inject(ExecutionStore).setFireTrialId('trial-1');
    view.fixture.detectChanges();
    await view.fixture.whenStable();
    view.fixture.detectChanges();
    return view;
  };

  it('renders without errors', async () => {
    await renderWidget();
    expect(screen.getByRole('heading')).toBeInTheDocument();
    expect(fetchInfo).toHaveBeenCalledWith('trial-1');
    expect(
      screen.getByText('TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_INFO.WARNING_SAFETY_PRESSURE_UNAVAILABLE'),
    ).toBeInTheDocument();
  });

  it('formState starts clean (not dirty)', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.formState().dirty).toBe(false);
    expect(fixture.componentInstance.formState().widgetId).toBe('test-widget');
  });

  it('formState becomes dirty when presionMaxima changes', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['formModel'].update((model) => ({ ...model, presionMaxima: 999 }));
    fixture.detectChanges();
    expect(fixture.componentInstance.formState().dirty).toBe(true);
  });

  it('saveForm persists changes to the store', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['formModel'].update((model) => ({ ...model, presionMaxima: 300, presionMinima: 250 }));
    await fixture.componentInstance.saveForm();
    const store = TestBed.inject(ExecutionStore);
    expect(store.overpressureInfo().presionMaxima).toBe(300);
    expect(store.overpressureInfo().presionMinima).toBe(250);
    expect(updateInfo).toHaveBeenCalledWith('trial-1', {
      maximumPressure: 300,
      minimumPressure: 250,
      referencePressure: 233.97,
      pressureUnit: PressureUnitEnum.MPA,
    });
    expect(fixture.componentInstance.formState().dirty).toBe(false);
  });

  it('saveForm updates overpressurePresionBuscada computed', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['formModel'].update((model) => ({ ...model, presionMaxima: 300, presionMinima: 200 }));
    expect(fixture.componentInstance['targetPressure']()).toBe(250);
    await fixture.componentInstance.saveForm();
    const store = TestBed.inject(ExecutionStore);
    expect(store.overpressurePresionBuscada()).toBe(250);
  });

  it.each<AppLocale>(['es-ES', 'en-US'])(
    'limits displayed target pressure to two decimals in %s without changing computed value',
    async (locale) => {
      const { fixture } = await renderWidget(locale);
      fixture.componentInstance['formModel'].update((model) => ({
        ...model,
        presionMaxima: 2.2,
        presionMinima: 1.1,
      }));
      fixture.detectChanges();

      expect(fixture.componentInstance['targetPressure']()).toBe(1.6500000000000001);
      expect(fixture.nativeElement).toHaveTextContent(new RegExp(locale === 'es-ES' ? '1,65' : '1.65'));
    },
  );

  it('resetForm restores values from the store', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['formModel'].update((model) => ({ ...model, presionMaxima: 999 }));
    fixture.componentInstance.resetForm();
    const stored = TestBed.inject(ExecutionStore).overpressureInfo();
    const formMax = fixture.componentInstance['formModel']().presionMaxima;
    expect(formMax).toBe(stored.presionMaxima);
  });

  it('formState is valid', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.formState().valid).toBe(true);
  });

  it('unit change syncs to formModel', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['formModel'].update((model) => ({ ...model, unidadPresion: PressureUnitEnum.BAR }));
    expect(fixture.componentInstance['formModel']().unidadPresion).toBe(PressureUnitEnum.BAR);
    expect(fixture.componentInstance['formModel']().presionMaxima).toBe(273.751234567);
  });

  it('keeps unsaved changes and baseline after a failed PUT', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['formModel'].update((model) => ({ ...model, presionMaxima: 400 }));
    updateInfo.mockRejectedValue(new Error('Network error'));
    await expect(fixture.componentInstance.saveForm()).rejects.toThrow('Network error');
    expect(fixture.componentInstance.formState().dirty).toBe(true);
    expect(TestBed.inject(ExecutionStore).overpressureInfo().presionMaxima).toBe(273.751234567);
  });

  it('starts empty after a 404 and creates configuration through PUT', async () => {
    fetchInfo.mockRejectedValue(new HttpErrorResponse({ status: 404 }));
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance['formModel']().presionMaxima).toBeNull();
    expect(fixture.componentInstance.formState().valid).toBe(false);
    fixture.componentInstance['formModel'].set({
      presionMaxima: 300,
      presionMinima: 200,
      presionRef: 0,
      unidadPresion: PressureUnitEnum.MPA,
    });
    await fixture.componentInstance.saveForm();
    expect(updateInfo).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.formState().dirty).toBe(false);
  });

  it.each([null, -1, Infinity, NaN, 400])('rejects invalid minimum pressure %s', async (value) => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['formModel'].update((model) => ({ ...model, presionMinima: value }));
    expect(fixture.componentInstance.formState().valid).toBe(false);
    await expect(fixture.componentInstance.saveForm()).rejects.toThrow();
    expect(updateInfo).not.toHaveBeenCalled();
  });

  it('exposes loading errors instead of stale data', async () => {
    fetchInfo.mockRejectedValue(new HttpErrorResponse({ status: 403 }));
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.formState().valid).toBe(false);
    expect(TestBed.inject(ExecutionStore).overpressureInfoError()).toBeTruthy();
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
  });

  it('discards an old trial response', async () => {
    const { fixture } = await renderWidget();
    let resolveOld: ((value: TrialOverpressureInfoResponse) => void) | undefined;
    fetchInfo.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
    );
    const store = TestBed.inject(ExecutionStore);
    const oldLoad = store.loadTrialOverpressureInfo('old-trial');
    await store.loadTrialOverpressureInfo('new-trial');
    resolveOld?.({ ...response, overpressureInfo: { ...response.overpressureInfo, maximumPressure: 999 } });
    await oldLoad;
    fixture.detectChanges();
    expect(store.overpressureInfo().presionMaxima).toBe(273.751234567);
  });

  it.each<AppLocale>(['es-ES', 'en-US'])(
    'preserves numeric precision through editing and repeated blur in %s',
    async (locale) => {
      const { fixture } = await renderWidget(locale);
      const user = userEvent.setup();
      const maximum = screen.getByRole('textbox', {
        name: 'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_INFO.PRESION_MAXIMA_LABEL',
      });
      for (const cycle of [1, 2]) {
        await user.click(maximum);
        await user.tab();
        expect(fixture.componentInstance.formState().dirty, `cycle ${cycle}`).toBe(false);
      }
      await fixture.componentInstance.saveForm();
      expect(updateInfo.mock.calls[0]?.[1].maximumPressure).toBe(273.751234567);
      await user.click(maximum);
      await user.clear(maximum);
      await user.type(maximum, locale === 'es-ES' ? '300,123456789' : '300.123456789');
      await user.tab();
      await fixture.componentInstance.saveForm();
      expect(updateInfo.mock.calls[1]?.[1].maximumPressure).toBe(300.123456789);
    },
  );
});
