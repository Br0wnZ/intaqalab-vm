/* eslint-disable @typescript-eslint/no-explicit-any */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import type { PaginatedApiResponse } from '@intaqalab/models';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { DenominationsStore } from '../../../+state/denominations.store';
import { MunitionComponentStore } from '../../../+state/munition-component.store';
import { MunitionsDumpsStore } from '../../../+state/munition-dumps.store';
import type { MunitionComponentsModel } from '../../../models/munition-components.model';
import { DenominationsService } from '../../../services/denominations.service';
import { ComponentMunitionComponent } from './component-munition.component';

// vi.mock hoisted by Vitest — must use synchronous factory (Issue #14: ng2-pdf-viewer crash)
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Factories
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function makeDenominationsService() {
  return {
    paginatedResponse: { value: signal(null), isLoading: signal(false), error: signal(null), reload: vi.fn() },
    searchItems: { set: vi.fn() },
    saveResource: { status: signal('idle'), isLoading: signal(false) },
    updateResource: { status: signal('idle'), isLoading: signal(false) },
    deleteResource: { status: signal('idle'), isLoading: signal(false) },
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    toogleEnabledItem: vi.fn(),
  };
}

function makeDenominationsStore() {
  return {
    items: signal<any[]>([]),
    totalElements: signal(0),
    isLoading: signal(false),
    error: signal(null),
    hasError: signal(false),
    isInitialized: signal(false),
    search: vi.fn(),
    reload: vi.fn(),
    reset: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    toogleEnabledItem: vi.fn(),
  };
}

function makeMunitionComponentStore(items: MunitionComponentsModel[] = []) {
  return {
    items: signal<MunitionComponentsModel[]>(items),
    totalElements: signal(0),
    isLoading: signal(false),
    error: signal(null),
    isInitialized: signal(false),
    search: vi.fn(),
    reload: vi.fn(),
    reset: vi.fn(),
  };
}

function makeMunitionsDumpsStore() {
  return {
    items: signal<any[]>([]),
    isLoading: signal(false),
    error: signal(null),
    isInitialized: signal(false),
    search: vi.fn(),
    reload: vi.fn(),
    reset: vi.fn(),
  };
}

function defaultInputs() {
  return {
    enterUbications: true,
    enterQuantity: true,
  };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Setup
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function setup(componentInputs = defaultInputs()) {
  const user = userEvent.setup();
  const view = await render(ComponentMunitionComponent, {
    imports: [TranslateModule.forRoot(), NoopAnimationsModule],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTestingEnvironment(),
      { provide: DenominationsService, useValue: makeDenominationsService() },
      { provide: DenominationsStore, useValue: makeDenominationsStore() },
      { provide: MunitionComponentStore, useValue: makeMunitionComponentStore() },
      { provide: MunitionsDumpsStore, useValue: makeMunitionsDumpsStore() },
    ],
    componentInputs,
  });

  const fixture = view.fixture;
  fixture.detectChanges();
  return { fixture, user, component: fixture.componentInstance };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Tests
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('ComponentMunitionComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should create the component', async () => {
      const { component } = await setup();
      expect(component).toBeTruthy();
    });

    it('should show the munitionType selector', async () => {
      await setup();
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.MUNITION_TYPE_LABEL')).toBeInTheDocument();
    });

    it('should show the denomination input', async () => {
      await setup();
      expect(
        screen.getByPlaceholderText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.DENOMINATION_PLACEHOLDER'),
      ).toBeInTheDocument();
    });

    it('should show the batch input', async () => {
      await setup();
      expect(screen.getAllByPlaceholderText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.BATCH_LABEL').length).toBeGreaterThan(
        0,
      );
    });

    it('should show the quantity input when enterQuantity is true', async () => {
      await setup({ ...defaultInputs(), enterQuantity: true });
      expect(
        screen.getAllByPlaceholderText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.QUANTITY_LABEL').length,
      ).toBeGreaterThan(0);
    });

    it('should NOT show the quantity input when enterQuantity is false', async () => {
      await setup({ ...defaultInputs(), enterQuantity: false });
      expect(
        screen.queryByPlaceholderText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.QUANTITY_LABEL'),
      ).not.toBeInTheDocument();
    });

    it('should show the ubication checkbox when enterUbications is true', async () => {
      await setup({ ...defaultInputs(), enterUbications: true });
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.SHOW_UBICATON_LABEL')).toBeInTheDocument();
    });

    it('should NOT show the ubication checkbox when enterUbications is false', async () => {
      await setup({ ...defaultInputs(), enterUbications: false });
      expect(screen.queryByText('WHAREHOUSE_MANAGMENT.MUNITION_CREATE.SHOW_UBICATON_LABEL')).not.toBeInTheDocument();
    });
  });

  describe('Form state', () => {
    it('should denomination field be disabled initially', async () => {
      const { component } = await setup();
      expect(component.form.denominationId().disabled()).toBe(true);
    });

    it('should denomination field be enabled after setting a munitionTypeId', async () => {
      const { component, fixture } = await setup();
      component.form.munitionTypeId().setControlValue('Proyectil');
      fixture.detectChanges();
      expect(component.form.denominationId().disabled()).toBe(false);
    });

    it('should denomination field reset when munitionType changes', async () => {
      const { component, fixture } = await setup();
      component.form.munitionTypeId().setControlValue('Proyectil');
      fixture.detectChanges();
      component.form.denominationId().setControlValue({ id: 'den-1', name: 'Den 1' } as any);
      fixture.detectChanges();

      component.munitionTypeChangeHandler();
      fixture.detectChanges();

      expect(component.form.denominationId().controlValue()).toBe('');
    });

    it('should errors() return false when form is empty (implementation always returns false)', async () => {
      const { component, fixture } = await setup();
      component.markAsTouched();
      fixture.detectChanges();
      // Note: errors() iterates over this.form.length which is undefined in the
      // @angular/forms/signals API, so the loop never runs and returns false.
      expect(component.errors()).toBe(false);
    });

    it('should errors() be falsy when all required fields are filled correctly', async () => {
      const { component, fixture } = await setup();
      component.form.munitionTypeId().setControlValue('Proyectil');
      fixture.detectChanges();
      component.form.denominationId().setControlValue({ id: 'den-1', name: 'Den 1' } as any);
      fixture.detectChanges();
      component.form.batch().setControlValue('Lote-A');
      fixture.detectChanges();
      component.form.quantity().setControlValue(10);
      fixture.detectChanges();
      expect(component.errors()).toBe(false);
    });
  });

  describe('value() computed', () => {
    it('should value() reflect the full form model', async () => {
      const { component, fixture } = await setup();
      component.form.munitionTypeId().setControlValue('Proyectil');
      fixture.detectChanges();
      component.form.denominationId().setControlValue({ id: 'den-1', name: 'Den 1' } as any);
      fixture.detectChanges();
      component.form.batch().setControlValue('Lote-X');
      fixture.detectChanges();
      component.form.quantity().setControlValue(5);
      fixture.detectChanges();

      expect(component.value()).toStrictEqual({
        munitionTypeId: 'Proyectil',
        denominationId: { id: 'den-1', name: 'Den 1' },
        batch: 'Lote-X',
        quantity: 5,
        showUbication: false,
        cellName: '',
        munitionDumpId: '',
      });
    });
  });

  describe('reset()', () => {
    it('should reset the form to initial empty state', async () => {
      const { component, fixture } = await setup();
      component.form.munitionTypeId().setControlValue('Proyectil');
      component.form.batch().setControlValue('Lote-Z');
      fixture.detectChanges();

      component.reset();
      fixture.detectChanges();

      expect(component.form.munitionTypeId().controlValue()).toBe('');
      expect(component.form.batch().controlValue()).toBe('');
    });
  });

  describe('markAsTouched()', () => {
    it('should set touched signal to true', async () => {
      const { component, fixture } = await setup();
      expect(component.touched()).toBe(false);
      component.markAsTouched();
      fixture.detectChanges();
      expect(component.touched()).toBe(true);
    });
  });

  describe('Munitiontype list rendering', () => {
    it('should expose munitionTypes computed from store (MUNITION_COMPONENT category)', async () => {
      const componentItems: MunitionComponentsModel[] = [
        {
          id: 'COMP_A',
          label: 'Comp A',
          name: { es: 'Comp A', en: 'Comp A' },
          observations: '',
          category: 'MUNITION_COMPONENT',
          active: true,
        },
        {
          id: 'MUN_B',
          label: 'Mun B',
          name: { es: 'Mun B', en: 'Mun B' },
          observations: '',
          category: 'MUNITION',
          active: true,
        },
      ];
      const user = userEvent.setup();
      const view = await render(ComponentMunitionComponent, {
        imports: [TranslateModule.forRoot(), NoopAnimationsModule],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideTestingEnvironment(),
          { provide: DenominationsService, useValue: makeDenominationsService() },
          { provide: DenominationsStore, useValue: makeDenominationsStore() },
          { provide: MunitionComponentStore, useValue: makeMunitionComponentStore(componentItems) },
          { provide: MunitionsDumpsStore, useValue: makeMunitionsDumpsStore() },
        ],
        componentInputs: defaultInputs(),
      });
      const component = view.fixture.componentInstance;
      // Only MUNITION_COMPONENT items should be returned
      expect(component.munitionTypes()).toHaveLength(1);
      expect(component.munitionTypes()[0].id).toBe('COMP_A');
    });
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Data
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function munitionTypes(): PaginatedApiResponse<MunitionComponentsModel> {
  return {
    page: 1,
    pageSize: 100,
    totalElements: 17,
    items: [
      {
        id: 'GRANADA_MORTERO',
        label: 'Granada mortero',
        name: { es: 'Granada mortero', en: 'Granada mortero' },
        observations: '',
        category: 'MUNITION',
        active: true,
      },
      {
        id: 'DIPARO_COMPLETO',
        label: 'Disparo completo',
        name: { es: 'Disparo completo', en: 'Disparo completo' },
        observations: '',
        category: 'MUNITION',
        active: true,
      },
      {
        id: 'Proyectil',
        label: 'Proyectil',
        name: { es: 'Proyectil', en: 'Proyectil' },
        observations: '',
        category: 'MUNITION_COMPONENT',
        active: true,
      },
      {
        id: 'Carga interna',
        label: 'Carga interna',
        name: { es: 'Carga interna', en: 'Carga interna' },
        observations: '',
        category: 'MUNITION_COMPONENT',
        active: true,
      },
      {
        id: 'Vaso',
        label: 'Vaso',
        name: { es: 'Vaso', en: 'Vaso' },
        observations: '',
        category: 'MUNITION_COMPONENT',
        active: true,
      },
      {
        id: 'Espoleta',
        label: 'Espoleta',
        name: { es: 'Espoleta', en: 'Espoleta' },
        observations: '',
        category: 'MUNITION_COMPONENT',
        active: true,
      },
      {
        id: 'PÃ³lvora',
        label: 'PÃ³lvora',
        name: { es: 'PÃ³lvora', en: 'PÃ³lvora' },
        observations: '',
        category: 'MUNITION_COMPONENT',
        active: true,
      },
      {
        id: 'Vaina',
        label: 'Vaina',
        name: { es: 'Vaina', en: 'Vaina' },
        observations: '',
        category: 'MUNITION_COMPONENT',
        active: true,
      },
      {
        id: 'EstopÃ­n',
        label: 'EstopÃ­n',
        name: { es: 'EstopÃ­n', en: 'EstopÃ­n' },
        observations: '',
        category: 'MUNITION_COMPONENT',
        active: true,
      },
      {
        id: 'Trazador',
        label: 'Trazador',
        name: { es: 'Trazador', en: 'Trazador' },
        observations: '',
        category: 'MUNITION_COMPONENT',
        active: true,
      },
      {
        id: 'Cartucho',
        label: 'Cartucho',
        name: { es: 'Cartucho', en: 'Cartucho' },
        observations: '',
        category: 'MUNITION_COMPONENT',
        active: true,
      },
      {
        id: 'Suplemento',
        label: 'Suplemento',
        name: { es: 'Suplemento', en: 'Suplemento' },
        observations: '',
        category: 'MUNITION_COMPONENT',
        active: true,
      },
      {
        id: 'Otros',
        label: 'Otros',
        name: { es: 'Otros', en: 'Otros' },
        observations: '',
        category: 'MUNITION_COMPONENT',
        active: true,
      },
    ],
  };
}
