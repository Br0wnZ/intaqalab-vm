/* eslint-disable @typescript-eslint/no-empty-function */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
import { WidgetStateService } from '../../services/widget-state.service';
import { TrayectografiaIntroductionWidget } from './trayectografia-introduction';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

describe('TrayectografiaIntroductionWidget', () => {
  const renderWidget = (widgetId = 'test-trayectografia') =>
    render(TrayectografiaIntroductionWidget, {
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
    expect(fixture.componentInstance.formState().widgetId).toBe('test-trayectografia');
  });

  it('activeTab defaults to trayectorias', async () => {
    const { fixture } = await renderWidget();
    const comp = fixture.componentInstance as unknown as { activeTab: { (): string } };
    expect(comp.activeTab()).toBe('trayectorias');
  });

  it('saveForm persists selector to the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    await fixture.componentInstance.saveForm();
    expect(store.trayectografiaIntroduction()).toBeDefined();
  });

  it('resetForm restores values from the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    const storedEquipo = store.trayectografiaIntroduction().equipo;
    fixture.componentInstance.resetForm();
    const comp = fixture.componentInstance as unknown as { equipoField: { (): string | null } };
    expect(comp.equipoField()).toBe(storedEquipo);
  });

  it('onEquipoChange updates equipoField', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance.onEquipoChange('radar-doppler-01');
    const comp = fixture.componentInstance as unknown as { equipoField: { (): string | null } };
    expect(comp.equipoField()).toBe('radar-doppler-01');
  });

  it('formState reflects dirty after equipo change', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance.onEquipoChange('radar-doppler-02');
    fixture.detectChanges();
    expect(fixture.componentInstance.formState().dirty).toBe(true);
  });

  it('tab trayectorias is visible by default', async () => {
    await renderWidget();
    const trayTab = document.querySelector('inta-trayectografia-trayectorias-tab');
    expect(trayTab).toBeTruthy();
    expect(trayTab?.classList.contains('hidden')).toBe(false);
  });

  it('calls fetchShotTrajectography on selection when trialId, serie and shot are present', async () => {
    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    const store = TestBed.inject(ExecutionStore);
    const fetchSpy = vi.spyOn(execService, 'fetchShotTrajectography').mockResolvedValue({
      trajectographyData: {
        trajectographyRadarId: 'radar-1',
        trajectoryData: {
          range: 5000,
        },
      },
    });

    store.setFireTrialId('trial-123');
    fixture.componentInstance.onSerieSelected('s-1');
    fixture.componentInstance.onDisparoSelected('d-1');

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('trial-123', 's-1', 'd-1');
    });
  });
});
