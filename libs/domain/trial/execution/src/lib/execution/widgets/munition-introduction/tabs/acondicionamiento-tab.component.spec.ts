import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../../../+state/execution.store';
import { MunitionAcondicionamientoTabComponent } from './acondicionamiento-tab.component';

describe('MunitionAcondicionamientoTabComponent', () => {
  const runSetup = async () => {
    const view = await render(MunitionAcondicionamientoTabComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideNoopAnimations(),
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        ExecutionStore,
      ],
    });

    const store = TestBed.inject(ExecutionStore);
    return { view, store };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the component and fields correctly', async () => {
    await runSetup();
    expect(screen.getByText('TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.COMPONENTE_LABEL')).toBeInTheDocument();
    expect(screen.getByText('TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.TIEMPO_CAMARA_LABEL')).toBeInTheDocument();
    expect(screen.getByText('TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.EQUIPO_LABEL')).toBeInTheDocument();
    expect(screen.getByText('TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.TEMPERATURA_LABEL')).toBeInTheDocument();
    expect(screen.getByText('TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.OBSERVACIONES_LABEL')).toBeInTheDocument();
    expect(
      screen.getByText('TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.TEMPERATURA_PROGRAMADA_LABEL'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.FECHA_HORA_ENTRADA_LABEL'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.FECHA_HORA_SALIDA_LABEL'),
    ).toBeInTheDocument();
  });

  it('starts not dirty', async () => {
    const { view } = await runSetup();
    expect(view.fixture.componentInstance.isDirty()).toBe(false);
  });

  it('save updates the store', async () => {
    const { view, store } = await runSetup();
    const storeSpy = vi.spyOn(store, 'updateMunitionIntroductionAcondicionamiento');

    view.fixture.componentInstance.save();

    expect(storeSpy).toHaveBeenCalled();
  });

  it('reset restores form model from store', async () => {
    const { view } = await runSetup();
    view.fixture.componentInstance.acondFormModel.set({
      componente: 'test-comp',
      camara: 'test-camara',
    });

    view.fixture.componentInstance.reset();

    expect(view.fixture.componentInstance.acondFormModel().componente).toBeNull();
  });
});
