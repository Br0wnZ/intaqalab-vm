import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../../../+state/execution.store';
import { EquipmentTypeEnum } from '../../../models';
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

  it('renders the component and all fields correctly', async () => {
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

  it('loads balance equipment and filters it by the selected component balance IDs', async () => {
    const { view, store } = await runSetup();
    store.loadMunitionIntroductionWeightData({
      'bal-01': {
        componente: 'component-01',
        balance: 'bal-01',
        weight: null,
        weightAdded: null,
        weightRemoved: null,
        weighingDateTime: null,
        weighingRange: null,
        observations: null,
      },
    });
    view.fixture.componentInstance.weightFormModel.set({ componente: 'component-01', balance: null });
    TestBed.tick();
    const request = TestBed.inject(HttpTestingController).expectOne(
      (req) => req.url.includes('/equipment/items') && req.params.get('categoryId') === EquipmentTypeEnum.BALANCE,
    );
    request.flush({
      totalElements: 2,
      items: [
        { id: 21031, denominationName: 'Balance 500g', tag: 'BAL-01' },
        { id: 21032, denominationName: 'Balance 2kg', tag: 'BAL-02' },
      ],
    });
    await vi.waitFor(() => {
      TestBed.tick();
      expect(view.fixture.componentInstance.balanceOptions().map((option) => option.value)).toEqual(['bal-01']);
    });
  });

  it('shows all balance equipment when selected component has no matching balance IDs', async () => {
    const { view, store } = await runSetup();
    store.loadMunitionIntroductionWeightData({
      'bal-99': {
        componente: 'another-component',
        balance: 'bal-99',
        weight: 25,
        weightAdded: null,
        weightRemoved: null,
        weighingDateTime: null,
        weighingRange: null,
        observations: null,
      },
    });
    view.fixture.componentInstance.weightFormModel.set({ componente: 'component-01', balance: null });
    TestBed.tick();
    const request = TestBed.inject(HttpTestingController).expectOne(
      (req) => req.url.includes('/equipment/items') && req.params.get('categoryId') === EquipmentTypeEnum.BALANCE,
    );
    request.flush({
      totalElements: 2,
      items: [
        { id: 21031, denominationName: 'Balance 500g', tag: 'BAL-01' },
        { id: 21032, denominationName: 'Balance 2kg', tag: 'BAL-02' },
      ],
    });
    await vi.waitFor(() => {
      TestBed.tick();
      expect(view.fixture.componentInstance.balanceOptions().map((option) => option.value)).toEqual([
        'bal-01',
        'bal-02',
      ]);
    });
  });

  it('shows no default balances when the balance equipment endpoint returns no items', async () => {
    const { view, store } = await runSetup();
    view.fixture.componentInstance.weightFormModel.set({ componente: 'component-01', balance: null });
    TestBed.tick();

    const request = TestBed.inject(HttpTestingController).expectOne(
      (req) => req.url.includes('/equipment/items') && req.params.get('categoryId') === EquipmentTypeEnum.BALANCE,
    );
    request.flush({ totalElements: 0, items: [] });

    await vi.waitFor(() => {
      TestBed.tick();
      expect(store.munitionBalanceItems()).toEqual([]);
      expect(view.fixture.componentInstance.balanceOptions()).toEqual([]);
    });
  });

  it('uses a native date and time picker for the weighing timestamp', async () => {
    await runSetup();

    const dateTimeInput = screen.getByLabelText('TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.FECHA_HORA_LABEL');
    expect(dateTimeInput).toHaveAttribute('type', 'datetime-local');
    expect(dateTimeInput).toHaveAttribute('step', '60');
  });

  it('opens the native date and time picker when the input is clicked', async () => {
    await runSetup();

    const dateTimeInput = screen.getByLabelText('TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.FECHA_HORA_LABEL');
    const showPicker = vi.fn();
    Object.defineProperty(dateTimeInput, 'showPicker', { value: showPicker });

    await userEvent.click(dateTimeInput);

    expect(showPicker).toHaveBeenCalledOnce();
  });

  it('save calls updateMunitionIntroductionWeight on the store', async () => {
    const { view, store } = await runSetup();
    const storeSpy = vi.spyOn(store, 'updateMunitionIntroductionWeight');

    view.fixture.componentInstance.save();

    expect(storeSpy).toHaveBeenCalled();
  });

  it('reset restores the weight form model from the store', async () => {
    const { view } = await runSetup();
    // Mutate local form state
    view.fixture.componentInstance.weightFormModel.set({
      componente: 'test-comp',
      balance: 'bal-01',
    });

    view.fixture.componentInstance.reset();

    // After reset, form model should reflect store's initial weight state (nulls)
    expect(view.fixture.componentInstance.weightFormModel().componente).toBeNull();
    expect(view.fixture.componentInstance.weightFormModel().balance).toBeNull();
  });

  it('onBalanceChange persists current state and loads the new balance data', async () => {
    const { view, store } = await runSetup();
    const persistSpy = vi.spyOn(store, 'updateMunitionIntroductionWeightByBalance');
    const switchSpy = vi.spyOn(store, 'setActiveMunitionBalance');

    // Set a current balance first
    view.fixture.componentInstance.weightFormModel.set({
      componente: 'granada-01',
      balance: 'bal-01',
    });

    view.fixture.componentInstance.onBalanceChange('bal-02');

    expect(persistSpy).toHaveBeenCalledWith('bal-01', expect.objectContaining({ balance: 'bal-01' }));
    expect(switchSpy).toHaveBeenCalledWith('bal-02');
  });

  it('preserves the selected component when switching to a balance with different stored component data', async () => {
    const { view, store } = await runSetup();
    const componentInstance = view.fixture.componentInstance;

    store.loadMunitionIntroductionWeightData({
      'bal-02': {
        componente: 'granada-01',
        balance: 'bal-02',
        weight: 43.6,
        weightAdded: 0,
        weightRemoved: 0,
        weighingDateTime: null,
        weighingRange: '0 - 2000',
        observations: 'Stored on another component',
      },
    });
    componentInstance.weightFormModel.set({ componente: 'granada-02', balance: 'bal-01' });

    componentInstance.onBalanceChange('bal-02');

    expect(componentInstance.weightFormModel().componente).toBe('granada-02');
    expect(componentInstance.weightField()?.value).toBe('43.6');
  });

  it('updates form fields and range when switching between balances with remote data', async () => {
    const { view, store } = await runSetup();

    // 1. Preload store with 2 balances (as in GET response)
    store.loadMunitionIntroductionWeightData({
      'bal-01': {
        componente: 'granada-01',
        balance: 'bal-01',
        weight: 43.5,
        weightAdded: 0,
        weightRemoved: 0,
        weighingDateTime: '2026-08-21T10:34:12Z',
        weighingRange: '0 - 500',
        observations: 'Pesada bal-01',
      },
      'bal-02': {
        componente: 'granada-01',
        balance: 'bal-02',
        weight: 43.6,
        weightAdded: 0,
        weightRemoved: 0,
        weighingDateTime: '2026-08-21T10:40:00Z',
        weighingRange: '0 - 2000',
        observations: 'Pesada bal-02',
      },
    });

    // 2. Initial state is bal-01
    view.fixture.componentInstance.applyData({
      componente: 'granada-01',
      balance: 'bal-01',
      weight: 43.5,
      weighingRange: '0 - 500',
      observations: 'Pesada bal-01',
    });

    expect(view.fixture.componentInstance.weightField()?.value).toBe('43.5');
    expect(view.fixture.componentInstance.observationsField()).toBe('Pesada bal-01');
    expect(view.fixture.componentInstance.weighingRangeValue()).toBe('0 - 500');

    // 3. User switches to bal-02
    view.fixture.componentInstance.onBalanceChange('bal-02');

    // 4. Fields should reflect bal-02
    expect(view.fixture.componentInstance.weightField()?.value).toBe('43.6');
    expect(view.fixture.componentInstance.observationsField()).toBe('Pesada bal-02');
    expect(view.fixture.componentInstance.weighingRangeValue()).toBe('0 - 2000');

    // 5. User switches back to bal-01
    view.fixture.componentInstance.onBalanceChange('bal-01');

    // 6. Fields should reflect bal-01 again
    expect(view.fixture.componentInstance.weightField()?.value).toBe('43.5');
    expect(view.fixture.componentInstance.observationsField()).toBe('Pesada bal-01');
    expect(view.fixture.componentInstance.weighingRangeValue()).toBe('0 - 500');
  });

  it('emits componentChange when component changes and resets balance on applyData', async () => {
    const { view } = await runSetup();
    const componentInstance = view.fixture.componentInstance;

    let emittedComponent: string | null = null;
    componentInstance.componentChange.subscribe((c) => {
      emittedComponent = c;
    });

    componentInstance.onComponentChange('espoleta-01');
    expect(emittedComponent).toBe('espoleta-01');

    // Applying data for the new component resets the balance and fields
    componentInstance.applyData({
      componente: 'espoleta-01',
      balance: 'bal-01',
      weight: 520.0,
      observations: 'Pesada de espoleta',
    });

    expect(componentInstance.weightFormModel().componente).toBe('espoleta-01');
    expect(componentInstance.weightFormModel().balance).toBe('bal-01');
    expect(componentInstance.weightField()?.value).toBe('520');
    expect(componentInstance.observationsField()).toBe('Pesada de espoleta');
    expect(componentInstance.isDirty()).toBe(false);
  });
});
