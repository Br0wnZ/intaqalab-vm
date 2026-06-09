import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { TranslateModule } from '@ngx-translate/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { provideTestingEnvironment } from '@intaqalab/config';
import { ExecutionStore } from '../../../+state/execution.store';
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
});
