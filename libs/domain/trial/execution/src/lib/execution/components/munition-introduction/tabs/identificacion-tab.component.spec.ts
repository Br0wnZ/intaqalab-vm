import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { ExecutionStore } from '../../../../+state/execution.store';
import { MunitionIdentificacionTabComponent } from './identificacion-tab.component';

describe('MunitionIdentificacionTabComponent', () => {
  const runSetup = async () => {
    const view = await render(MunitionIdentificacionTabComponent, {
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
    // Labels are translated so we search by their translation keys
    expect(screen.getByText('TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.COMPONENTE_LABEL')).toBeInTheDocument();
    expect(screen.getByText('TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.DENOMINACION_LABEL')).toBeInTheDocument();
    expect(screen.getByText('TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.LOTE_LABEL')).toBeInTheDocument();
    expect(screen.getByText('TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.OBSERVACIONES_LABEL')).toBeInTheDocument();
    expect(screen.getByText('TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.NUMERO_CLIENTE_LABEL')).toBeInTheDocument();
  });

  it('starts not dirty', async () => {
    const { view } = await runSetup();
    expect(view.fixture.componentInstance.isDirty()).toBe(false);
  });

  it('save updates the store', async () => {
    const { view, store } = await runSetup();
    const storeSpy = vi.spyOn(store, 'updateMunitionIntroductionIdentification');
    
    view.fixture.componentInstance.save();
    
    expect(storeSpy).toHaveBeenCalled();
  });

  it('reset restores form model from store', async () => {
    const { view } = await runSetup();
    // Set a different value
    view.fixture.componentInstance.identFormModel.set({
      componente: 'test-comp',
      denominacion: null,
      lote: null,
      modoFuncionamiento: null,
    });
    
    view.fixture.componentInstance.reset();
    
    // Should be restored to initial null/undefined state from store
    expect(view.fixture.componentInstance.identFormModel().componente).toBeNull();
  });
});
