import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { ExecutionStore } from '../../../../+state/execution.store';
import { MunitionPesosTabComponent } from './pesos-tab.component';

describe('MunitionPesosTabComponent', () => {
  const runSetup = async () => {
    const view = await render(MunitionPesosTabComponent, {
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
    expect(screen.getByText('TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.EQUIPO_LABEL')).toBeInTheDocument();
    expect(screen.getByText('TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.PESO_LABEL')).toBeInTheDocument();
    expect(screen.getByText('TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.OBSERVACIONES_LABEL')).toBeInTheDocument();
    expect(screen.getByText('TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.FECHA_HORA_LABEL')).toBeInTheDocument();
    expect(screen.getByText('TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.RANGO_PESADA_LABEL')).toBeInTheDocument();
  });

  it('starts not dirty', async () => {
    const { view } = await runSetup();
    expect(view.fixture.componentInstance.isDirty()).toBe(false);
  });

  it('save updates the store', async () => {
    const { view, store } = await runSetup();
    const storeSpy = vi.spyOn(store, 'updateMunitionIntroductionPesos');
    
    view.fixture.componentInstance.save();
    
    expect(storeSpy).toHaveBeenCalled();
  });

  it('reset restores form model from store', async () => {
    const { view } = await runSetup();
    view.fixture.componentInstance.pesosFormModel.set({
      componente: 'test-comp',
      balanza: 'test-balanza',
    });
    
    view.fixture.componentInstance.reset();
    
    expect(view.fixture.componentInstance.pesosFormModel().componente).toBeNull();
  });
});
