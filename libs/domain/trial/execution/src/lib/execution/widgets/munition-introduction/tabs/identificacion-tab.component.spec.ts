import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ɵSIGNAL as SIGNAL } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import type { PlanningConditionsShot } from '@intaqalab/data-access-planning';
import { InputSelect } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../../../+state/execution.store';
import type { PlannedComponentData, ShotMunitionComponentOption } from '../../../../data-access';
import { MunitionIdentificacionTabComponent } from './identificacion-tab.component';

// In Vitest JIT mode, register InputSelect input metadata as signal-based (flags=1) so template bindings connect to signal inputs
const inputSelectCmp = (InputSelect as unknown as { ɵcmp?: { inputs?: Record<string, [string, number, null]> } }).ɵcmp;
if (inputSelectCmp) {
  inputSelectCmp.inputs = {
    ...inputSelectCmp.inputs,
    label: ['label', 1, null],
    opciones: ['opciones', 1, null],
    placeholder: ['placeholder', 1, null],
    value: ['value', 1, null],
    readOnly: ['readOnly', 1, null],
    variant: ['variant', 1, null],
  };
}

interface InputSignalNode<T = unknown> {
  applyValueToInputSignal(node: InputSignalNode<T>, value: T): void;
}

function setSignalInput<T>(inputFn: unknown, value: T): void {
  const node = (inputFn as Record<symbol, InputSignalNode<T>>)[SIGNAL];
  if (node && typeof node.applyValueToInputSignal === 'function') {
    node.applyValueToInputSignal(node, value);
  }
}

const createPlannedComponent = (overrides?: Partial<PlannedComponentData>): PlannedComponentData => ({
  denominationId: null,
  denominationName: null,
  batch: null,
  clientNumber: null,
  fuseWorkingModeId: null,
  fuseMeasurement: null,
  loadingZoneValue: null,
  loadingZones: [],
  quantity: null,
  ...overrides,
});

describe('MunitionIdentificacionTabComponent', () => {
  const runSetup = async (inputs?: {
    componenteOptions?: ShotMunitionComponentOption[];
    modoFuncionamientoOptions?: Array<{ value: string; label: string }>;
    shotConditions?: PlanningConditionsShot | null;
  }) => {
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

    const component = view.fixture.componentInstance;
    if (inputs?.componenteOptions) {
      setSignalInput(component.componenteOptions, inputs.componenteOptions);
    }
    if (inputs?.modoFuncionamientoOptions) {
      setSignalInput(component.modoFuncionamientoOptions, inputs.modoFuncionamientoOptions);
    }
    if (inputs?.shotConditions !== undefined) {
      setSignalInput(component.shotConditions, inputs.shotConditions);
    }
    view.fixture.detectChanges();

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
      loadingZone: null,
      cantidad: null,
    });

    view.fixture.componentInstance.reset();

    // Should be restored to initial null/undefined state from store
    expect(view.fixture.componentInstance.identFormModel().componente).toBeNull();
  });

  it('hides modo funcionamiento and graduacion de espoleta when component is proyectil', async () => {
    const { view } = await runSetup({
      componenteOptions: [
        {
          value: 'type-proj',
          label: 'Proyectil 155mm ERFB',
          category: 'granada',
          rawCategory: 'MUNITION',
          source: 'CONFIGURATION',
          configurationId: 'cfg-1',
          isFuse: false,
          planned: createPlannedComponent(),
        },
      ],
    });
    const component = view.fixture.componentInstance;

    component.identFormModel.update((m) => ({ ...m, componente: 'type-proj' }));
    view.fixture.detectChanges();

    expect(component.isProyectil()).toBe(true);
    expect(component.isEspoleta()).toBe(false);

    expect(
      screen.queryByText('TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.MODO_FUNCIONAMIENTO_LABEL'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.GRADUACION_ESPOLETA_LABEL'),
    ).not.toBeInTheDocument();

    const updates = component.getFormUpdates();
    expect(updates.modoFuncionamiento).toBeNull();
    expect(updates.graduacionEspoleta).toBeNull();
  });

  it('shows modo funcionamiento and graduacion de espoleta when component is espoleta', async () => {
    const { view } = await runSetup({
      componenteOptions: [
        {
          value: 'type-fuse',
          label: 'Espoleta M578',
          category: 'espoleta',
          rawCategory: 'MUNITION_COMPONENT',
          source: 'COMPONENT',
          configurationId: 'cfg-1',
          isFuse: true,
          planned: createPlannedComponent(),
        },
      ],
    });
    const component = view.fixture.componentInstance;

    component.identFormModel.update((m) => ({ ...m, componente: 'type-fuse' }));
    view.fixture.detectChanges();

    expect(component.isProyectil()).toBe(false);
    expect(component.isEspoleta()).toBe(true);

    expect(
      screen.getByText('TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.MODO_FUNCIONAMIENTO_LABEL'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.GRADUACION_ESPOLETA_LABEL'),
    ).toBeInTheDocument();
  });

  it('disables modo funcionamiento and graduacion de espoleta when provided by shotConditions', async () => {
    const { view } = await runSetup({
      componenteOptions: [
        {
          value: 'type-fuse',
          label: 'Espoleta M578',
          category: 'espoleta',
          rawCategory: 'MUNITION_COMPONENT',
          source: 'COMPONENT',
          configurationId: 'cfg-1',
          isFuse: true,
          planned: createPlannedComponent(),
        },
      ],
      shotConditions: {
        shotId: 'shot-1',
        fuseWorkingModeId: 'impacto',
        fuseGraduation: 12.5,
      },
    });
    const component = view.fixture.componentInstance;

    component.identFormModel.update((m) => ({ ...m, componente: 'type-fuse' }));
    view.fixture.detectChanges();

    expect(component.isEspoleta()).toBe(true);
    expect(component.plannedModoFuncionamiento()).toBe('impacto');
    expect(component.plannedGraduacionEspoleta()).toBe(12.5);
    expect(component.isModoFuncionamientoDisabled()).toBe(true);
    expect(component.isGraduacionEspoletaDisabled()).toBe(true);

    expect(component.identFormModel().modoFuncionamiento).toBe('impacto');
    expect(component.graduacionEspoletaField()).toEqual({ value: '12.5', unit: 's' });
  });

  it('enables modo funcionamiento and graduacion de espoleta when planning does not specify them', async () => {
    const { view } = await runSetup({
      componenteOptions: [
        {
          value: 'type-fuse',
          label: 'Espoleta M578',
          category: 'espoleta',
          rawCategory: 'MUNITION_COMPONENT',
          source: 'COMPONENT',
          configurationId: 'cfg-1',
          isFuse: true,
          planned: createPlannedComponent(),
        },
      ],
      shotConditions: {
        shotId: 'shot-1',
        fuseWorkingModeId: null,
        fuseGraduation: null,
      },
    });
    const component = view.fixture.componentInstance;

    component.identFormModel.update((m) => ({ ...m, componente: 'type-fuse' }));
    view.fixture.detectChanges();

    expect(component.isEspoleta()).toBe(true);
    expect(component.plannedModoFuncionamiento()).toBeNull();
    expect(component.plannedGraduacionEspoleta()).toBeNull();
    expect(component.isModoFuncionamientoDisabled()).toBe(false);
    expect(component.isGraduacionEspoletaDisabled()).toBe(false);
  });

  it('uses catalog fuse working mode options when planning does not provide a mode', async () => {
    const catalogOptions = [
      { value: 'mode-impact', label: 'Impacto' },
      { value: 'mode-time', label: 'Tiempo' },
    ];
    const { view } = await runSetup({
      modoFuncionamientoOptions: catalogOptions,
    });
    const component = view.fixture.componentInstance;

    expect(component.modoFuncionamientoOptions()).toEqual(catalogOptions);
    expect(component.isModoFuncionamientoDisabled()).toBe(false);
  });

  it('shows zona/modulos select when component is carga de proyeccion', async () => {
    const { view } = await runSetup({
      componenteOptions: [
        {
          value: 'type-charge',
          label: 'Carga de proyección M4',
          category: 'carga',
          rawCategory: 'MUNITION_COMPONENT',
          source: 'COMPONENT',
          configurationId: 'cfg-1',
          isFuse: false,
          planned: createPlannedComponent({
            denominationId: 'den-charge',
            denominationName: 'Carga M4',
            batch: 'LOT-C1',
          }),
        },
      ],
    });
    const component = view.fixture.componentInstance;

    component.identFormModel.update((m) => ({ ...m, componente: 'type-charge' }));
    view.fixture.detectChanges();

    expect(component.isCargaDeProyeccion()).toBe(true);
    expect(screen.getByText('TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.ZONA_MODULOS_LABEL')).toBeInTheDocument();
  });

  it('loads zones from GET munitions when present in planned.loadingZones', async () => {
    const { view } = await runSetup({
      componenteOptions: [
        {
          value: 'type-charge',
          label: 'Carga de proyección',
          category: 'carga',
          rawCategory: 'MUNITION_COMPONENT',
          source: 'COMPONENT',
          configurationId: 'cfg-1',
          isFuse: false,
          planned: createPlannedComponent({
            denominationId: 'den-charge',
            denominationName: 'Carga M4',
            batch: 'LOT-C1',
            loadingZoneValue: 'Z1',
            loadingZones: ['Z1', 'Z2'],
          }),
        },
      ],
    });
    const component = view.fixture.componentInstance;

    component.identFormModel.update((m) => ({ ...m, componente: 'type-charge', denominacion: 'den-charge' }));
    view.fixture.detectChanges();

    expect(component.zonaModulosOptions()).toEqual(['Z1', 'Z2']);
  });

  it('loads zones from /loading-zone?pageSize=100 matching denomination when planned zones are absent', async () => {
    const { view } = await runSetup({
      componenteOptions: [
        {
          value: 'type-charge',
          label: 'Carga de proyección',
          category: 'carga',
          rawCategory: 'MUNITION_COMPONENT',
          source: 'COMPONENT',
          configurationId: 'cfg-1',
          isFuse: false,
          planned: createPlannedComponent({
            denominationId: 'den-charge-1',
            denominationName: 'Carga M4',
          }),
        },
      ],
    });
    const component = view.fixture.componentInstance;
    const httpMock = TestBed.inject(HttpTestingController);

    component.identFormModel.update((m) => ({ ...m, componente: 'type-charge', denominacion: 'den-charge-1' }));
    view.fixture.detectChanges();

    const loadingReq = httpMock.expectOne((req) => req.url.includes('/loading-zone'));
    expect(loadingReq.request.params.get('pageSize')).toBe('100');
    loadingReq.flush([
      {
        id: 'lz-1',
        denominationId: 'den-charge-1',
        zone: ['Z1', 'Z2'],
      },
      {
        id: 'lz-2',
        denominationId: 'den-charge-other',
        zone: ['Z9'],
      },
    ]);
    TestBed.tick();
    await new Promise<void>((resolve) => {
      queueMicrotask(() => resolve());
    });
    view.fixture.detectChanges();

    expect(component.zonaModulosOptions()).toEqual(['Z1', 'Z2']);
  });

  it('resets loadingZone when denomination changes', async () => {
    const { view } = await runSetup();
    const component = view.fixture.componentInstance;

    component.identFormModel.update((m) => ({ ...m, componente: 'type-charge', loadingZone: 'Z1' }));
    view.fixture.detectChanges();

    component.onDenominacionChange('new-denom');
    expect(component.identFormModel().loadingZone).toBeNull();
  });

  it('clears loadingZone when switching from carga de proyeccion to non-charge component', async () => {
    const { view } = await runSetup({
      componenteOptions: [
        {
          value: 'type-charge',
          label: 'Carga de proyección',
          category: 'carga',
          rawCategory: 'MUNITION_COMPONENT',
          source: 'COMPONENT',
          configurationId: 'cfg-1',
          isFuse: false,
          planned: createPlannedComponent({
            denominationId: 'den-charge-1',
            denominationName: 'Carga M4',
            loadingZones: ['Z1'],
          }),
        },
        {
          value: 'type-proj',
          label: 'Granada 155mm',
          category: 'granada',
          rawCategory: 'MUNITION',
          source: 'CONFIGURATION',
          configurationId: 'cfg-2',
          isFuse: false,
          planned: createPlannedComponent({
            denominationId: 'den-proj',
            denominationName: 'Granada',
          }),
        },
      ],
    });
    const component = view.fixture.componentInstance;

    component.identFormModel.update((m) => ({ ...m, componente: 'type-charge', loadingZone: 'Z1' }));
    view.fixture.detectChanges();
    expect(component.identFormModel().loadingZone).toBe('Z1');

    component.identFormModel.update((m) => ({ ...m, componente: 'type-proj' }));
    view.fixture.detectChanges();

    expect(component.isCargaDeProyeccion()).toBe(false);
    expect(component.identFormModel().loadingZone).toBeNull();
  });

  it('does not render modo funcionamiento or graduacion espoleta when component is carga de proyeccion', async () => {
    const { view } = await runSetup({
      componenteOptions: [
        {
          value: 'type-charge',
          label: 'Carga de proyección',
          category: 'carga',
          rawCategory: 'MUNITION_COMPONENT',
          source: 'COMPONENT',
          configurationId: 'cfg-1',
          isFuse: false,
          planned: createPlannedComponent({
            denominationId: 'den-charge-1',
            denominationName: 'Carga M4',
            loadingZones: ['Z1', 'Z2'],
          }),
        },
        {
          value: 'type-fuse',
          label: 'Espoleta M578',
          category: 'espoleta',
          rawCategory: 'MUNITION_COMPONENT',
          source: 'COMPONENT',
          configurationId: 'cfg-2',
          isFuse: true,
          planned: createPlannedComponent({
            denominationId: 'den-fuse-1',
            denominationName: 'M578',
          }),
        },
      ],
    });
    const component = view.fixture.componentInstance;

    component.identFormModel.update((m) => ({ ...m, componente: 'type-charge' }));
    view.fixture.detectChanges();

    expect(component.isCargaDeProyeccion()).toBe(true);
    expect(component.isEspoleta()).toBe(false);
    expect(
      screen.queryByText('TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.MODO_FUNCIONAMIENTO_LABEL'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.ZONA_MODULOS_LABEL')).toBeInTheDocument();

    component.identFormModel.update((m) => ({ ...m, componente: 'type-fuse' }));
    view.fixture.detectChanges();

    expect(component.isCargaDeProyeccion()).toBe(false);
    expect(component.isEspoleta()).toBe(true);
    expect(
      screen.getByText('TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.MODO_FUNCIONAMIENTO_LABEL'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.ZONA_MODULOS_LABEL'),
    ).not.toBeInTheDocument();
  });

  it('renders disabled cantidad input when component is suplemento with planned quantity', async () => {
    const { view } = await runSetup({
      componenteOptions: [
        {
          value: 'type-suplemento',
          label: 'Suplemento de carga',
          category: 'suplemento',
          rawCategory: 'MUNITION_COMPONENT',
          source: 'COMPONENT',
          configurationId: 'cfg-1',
          isFuse: false,
          planned: createPlannedComponent({
            denominationId: 'den-suppl-1',
            denominationName: 'Suplemento A',
            quantity: 4,
          }),
        },
      ],
    });
    const component = view.fixture.componentInstance;

    component.identFormModel.update((m) => ({ ...m, componente: 'type-suplemento' }));
    view.fixture.detectChanges();

    expect(component.isSuplemento()).toBe(true);
    const cantidadInput = screen.getByRole<HTMLInputElement>('spinbutton');
    expect(cantidadInput).toBeInTheDocument();
    expect(cantidadInput.value).toBe('4');
    expect(cantidadInput).toBeDisabled();
  });

  it('renders enabled numeric cantidad input when component is suplemento without planned quantity', async () => {
    const { view } = await runSetup({
      componenteOptions: [
        {
          value: 'type-suplemento',
          label: 'Suplemento manual',
          category: 'suplemento',
          rawCategory: 'MUNITION_COMPONENT',
          source: 'COMPONENT',
          configurationId: 'cfg-1',
          isFuse: false,
          planned: createPlannedComponent({
            denominationId: 'den-suppl-2',
            denominationName: 'Suplemento B',
          }),
        },
      ],
    });
    const component = view.fixture.componentInstance;

    component.identFormModel.update((m) => ({ ...m, componente: 'type-suplemento' }));
    view.fixture.detectChanges();

    expect(component.isSuplemento()).toBe(true);
    const cantidadInput = screen.getByRole<HTMLInputElement>('spinbutton');
    expect(cantidadInput).toBeInTheDocument();
    expect(cantidadInput).toBeEnabled();
    expect(cantidadInput.type).toBe('number');

    component.identFormModel.update((m) => ({ ...m, cantidad: 7 }));
    view.fixture.detectChanges();
    expect(component.identFormModel().cantidad).toBe(7);
  });

  it('resets cantidad and hides input when component is not suplemento', async () => {
    const { view } = await runSetup({
      componenteOptions: [
        {
          value: 'type-suplemento',
          label: 'Suplemento',
          category: 'suplemento',
          rawCategory: 'MUNITION_COMPONENT',
          source: 'COMPONENT',
          configurationId: 'cfg-1',
          isFuse: false,
          planned: createPlannedComponent({
            denominationId: 'den-1',
            denominationName: 'Suppl',
            quantity: 5,
          }),
        },
        {
          value: 'type-proj',
          label: 'Granada 155mm',
          category: 'granada',
          rawCategory: 'MUNITION',
          source: 'CONFIGURATION',
          configurationId: 'cfg-2',
          isFuse: false,
          planned: createPlannedComponent({
            denominationId: 'den-2',
            denominationName: 'Granada',
          }),
        },
      ],
    });
    const component = view.fixture.componentInstance;

    component.identFormModel.update((m) => ({ ...m, componente: 'type-suplemento' }));
    view.fixture.detectChanges();
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    expect(component.identFormModel().cantidad).toBe(5);

    component.identFormModel.update((m) => ({ ...m, componente: 'type-proj' }));
    view.fixture.detectChanges();
    expect(component.isSuplemento()).toBe(false);
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    expect(component.identFormModel().cantidad).toBeNull();
  });

  it('validates cantidad with min 0', async () => {
    const { view } = await runSetup({
      componenteOptions: [
        {
          value: 'type-suplemento',
          label: 'Suplemento manual',
          category: 'suplemento',
          rawCategory: 'MUNITION_COMPONENT',
          source: 'COMPONENT',
          configurationId: 'cfg-1',
          isFuse: false,
          planned: createPlannedComponent({
            denominationId: 'den-suppl-2',
            denominationName: 'Suplemento B',
          }),
        },
      ],
    });
    const component = view.fixture.componentInstance;

    component.identFormModel.update((m) => ({ ...m, componente: 'type-suplemento', cantidad: -1 }));
    view.fixture.detectChanges();
    expect(component.isValid()).toBe(false);

    component.identFormModel.update((m) => ({ ...m, cantidad: 0 }));
    view.fixture.detectChanges();
    expect(component.isValid()).toBe(true);
  });
});
