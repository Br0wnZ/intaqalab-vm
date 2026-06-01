/* eslint-disable @typescript-eslint/no-explicit-any */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';
import { TrialStatus } from '@intaqalab/models';
import { TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { TrialStore } from '../../+state/trial-list.store';
import { DataTrialCreateModifyService } from '../../../../services/data-trial-create-modify-service';
import { TrialListComponent } from './trial-list.component';

// vi.mock hoisted by Vitest
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

const mockTrials: FireTrial[] = [
  {
    id: 'e2e1c7e2-1b2a-4c3d-8e1f-1a2b3c4d5e6f',
    centerId: 'center-001',
    trialNumber: 'INT-2024-001',
    status: 'CANCELLED' as TrialStatus,
    statusReason: 'Ensayo completado satisfactoriamente',
    linkedTrial: {
      id: 'trial-000',
      trialNumber: 'INT-2023-999',
      description: 'Ensayo previo de resistencia al fuego',
    },
    associatedTrial: {
      id: '',
      trialNumber: '',
      description: '',
    },
    fireTrialType: { id: '1', name: 'Ensayo de ignición' },
    client: {
      id: 'client-001',
      name: 'Fabricaciones Metálicas del Norte S.L.',
    },
    clientReference: 'REF-FMN-2024-001',
    requestedDate: '2024-02-01T00:00:00Z',
    description: 'Ensayo de resistencia al fuego de puertas metálicas RF-120',
    observations: 'Ensayo realizado según normativa EN 1634-1',
    createdBy: 'user-001',
    modifiedBy: 'user-001',
    createdAt: '2024-02-15T10:30:00Z',
    updatedAt: '2024-02-20T16:45:00Z',
  },
  {
    id: 'f3f2c8f3-2c3b-5d4e-9f2a-2b3c4d5e6f7a',
    centerId: 'center-001',
    trialNumber: 'INT-2024-002',
    status: 'UNDER_REVIEW' as TrialStatus,
    statusReason: 'En proceso de evaluación',
    linkedTrial: {
      id: 'trial-001',
      trialNumber: 'INT-2024-001',
      description: 'Ensayo de resistencia al fuego de puertas metálicas RF-120',
    },
    associatedTrial: {
      id: 'trial-001',
      trialNumber: 'INT-2024-001',
      description: 'Ensayo de resistencia al fuego de puertas metálicas RF-120',
    },
    fireTrialType: { id: '2', name: 'Ensayo de combustión lenta' },
    client: {
      id: 'client-002',
      name: 'Construcciones García y Asociados',
    },
    clientReference: 'REF-CGA-2024-002',
    requestedDate: '2024-03-01T00:00:00Z',
    description: 'Certificación RF-60 para muros cortafuegos de hormigón',
    observations: 'Requiere verificación adicional de juntas',
    createdBy: 'user-002',
    modifiedBy: 'user-002',
    createdAt: '2024-03-10T14:20:00Z',
    updatedAt: '2024-03-15T11:30:00Z',
  },
];

const mockTrialStatuses = [
  { value: 'CANCELLED', label: 'Cancelada' },
  { value: 'UNDER_REVIEW', label: 'En revisión' },
  { value: 'IN_PROGRESS', label: 'En curso' },
  { value: 'PLANNED', label: 'Planificada' },
];

describe('TrialListComponent', () => {
  const mockStore = {
    totalElements: signal(100),
    currentSearch: signal({ page: 1, pageSize: 10 }),
    items: signal(mockTrials),
    isLoading: signal(false),
    error: signal<string | null>(null),
    setPagination: vi.fn(),
    setSort: vi.fn(),
    setSearch: vi.fn(),
    search: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.error = signal<string | null>(null);
  });

  const setup = async (options?: { filters?: Partial<any> }) => {
    const user = userEvent.setup();
    const { fixture } = await render(TrialListComponent, {
      imports: [NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestingEnvironment(),
        { provide: TrialStore, useValue: mockStore },
        {
          provide: DataTrialCreateModifyService,
          useValue: { getTrialsList: vi.fn().mockReturnValue(() => undefined) },
        },
      ],
      componentInputs: {
        filters: options?.filters,
      },
    });
    return { fixture, user };
  };

  describe('Initial rendering', () => {
    it('should create the component', async () => {
      const { fixture } = await setup();
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should display the table columns', async () => {
      const { fixture } = await setup();

      const columns = fixture.componentInstance.displayedColumns;
      expect(columns()).toEqual([
        'trialNumber',
        'status',
        'client',
        'description',
        'fireTrialType',
        'usuariosAsignados',
        'otrosDatos',
      ]);
    });
  });

  describe('getUsuarioTooltip', () => {
    it('should format the user tooltip correctly', async () => {
      const { fixture } = await setup();
      const usuario = { nombre: 'Juan', apellido1: 'García', apellido2: 'López' };

      const tooltip = fixture.componentInstance.getUsuarioTooltip(usuario);

      expect(tooltip).toBe('Planificación de la prueba\nJuan García López');
    });

    it('should work with users from mockTrials', async () => {
      const { fixture } = await setup();
      const usuario = { nombre: 'María', apellido1: 'García', apellido2: 'López' };

      const tooltip = fixture.componentInstance.getUsuarioTooltip(usuario);

      expect(tooltip).toContain('María García López');
    });
  });

  describe('Assigned users', () => {
    it('should have 3 assigned users by default', async () => {
      const { fixture } = await setup();
      const usuarios = fixture.componentInstance.usuariosAsignados();

      expect(usuarios).toHaveLength(3);
    });

    it('should contain the correct users', async () => {
      const { fixture } = await setup();
      const usuarios = fixture.componentInstance.usuariosAsignados();

      expect(usuarios.map((u) => u.nombre)).toEqual(['María', 'Juan', 'Lucía']);
    });
  });

  describe('Filters', () => {
    it('should update filtersSignal when input filters change', async () => {
      const { fixture } = await setup({ filters: { status: 'CANCELLED' } });

      fixture.detectChanges();

      expect(fixture.componentInstance.filtersSignal()).toEqual({ status: 'CANCELLED' });
    });

    it('should set empty object when filters is undefined', async () => {
      const { fixture } = await setup({ filters: undefined });

      fixture.detectChanges();

      expect(fixture.componentInstance.filtersSignal()).toEqual({});
    });

    it('should accept filters with multiple properties', async () => {
      const filters = { status: 'UNDER_REVIEW', clientId: 'client-002' };
      const { fixture } = await setup({ filters });

      fixture.detectChanges();

      expect(fixture.componentInstance.filtersSignal()).toEqual(filters);
    });
  });

  describe('getTrialStatusLabel', () => {
    it('should return the label for CANCELLED status', async () => {
      const { fixture } = await setup();
      (fixture.componentInstance as any).trialStatus = signal(mockTrialStatuses);

      const label = fixture.componentInstance.getTrialStatusLabel('CANCELLED' as TrialStatus);

      expect(label).toBe(TrialStatus.CANCELLED);
    });

    it('should return the label for UNDER_REVIEW status', async () => {
      const { fixture } = await setup();
      (fixture.componentInstance as any).trialStatus = signal(mockTrialStatuses);

      const label = fixture.componentInstance.getTrialStatusLabel('UNDER_REVIEW' as TrialStatus);

      expect(label).toBe(TrialStatus.UNDER_REVIEW);
    });

    it('should return the original status if the label is not found', async () => {
      const { fixture } = await setup();
      (fixture.componentInstance as any).trialStatus = signal([]);

      const label = fixture.componentInstance.getTrialStatusLabel('UNKNOWN_STATUS' as TrialStatus);

      expect(label).toBe('UNKNOWN_STATUS');
    });
  });

  describe('getSchudeledDate', () => {
    it('should return formatted requestedDate when trial has no schedule', async () => {
      const { fixture } = await setup();

      const result = fixture.componentInstance.getSchudeledDate(mockTrials[0] as any);

      expect(result).toBe('01/02/2024');
    });

    it('should return joined schedule dates when trial has schedule items', async () => {
      const { fixture } = await setup();
      const trialWithSchedule = {
        ...mockTrials[0],
        schedule: [
          { date: '2024-03-01T00:00:00Z', lineOfShootId: 'line-1' },
          { date: '2024-03-15T00:00:00Z', lineOfShootId: 'line-2' },
        ],
      };

      const result = fixture.componentInstance.getSchudeledDate(trialWithSchedule as any);

      expect(result).toBe('01/03/2024, 15/03/2024');
    });

    it('should return a single date when schedule has one item', async () => {
      const { fixture } = await setup();
      const trialWithSchedule = {
        ...mockTrials[0],
        schedule: [{ date: '2024-04-10T00:00:00Z', lineOfShootId: 'line-1' }],
      };

      const result = fixture.componentInstance.getSchudeledDate(trialWithSchedule as any);

      expect(result).toBe('10/04/2024');
    });

    it('should return empty string when trial has no requestedDate and no schedule', async () => {
      const { fixture } = await setup();
      const trialWithoutDate = { ...mockTrials[0], requestedDate: undefined, schedule: undefined };

      const result = fixture.componentInstance.getSchudeledDate(trialWithoutDate as any);

      expect(result).toBe('');
    });
  });

  describe('onTrialSelect', () => {
    it('should emit goTrialDetail with only the trial id', async () => {
      const { fixture } = await setup();
      const emitSpy = vi.spyOn(fixture.componentInstance.goTrialDetail, 'emit');

      fixture.componentInstance.onTrialSelect(mockTrials[0] as any);

      expect(emitSpy).toHaveBeenCalledWith({ id: mockTrials[0].id });
    });

    it('should not emit the full trial object', async () => {
      const { fixture } = await setup();
      const emitSpy = vi.spyOn(fixture.componentInstance.goTrialDetail, 'emit');

      fixture.componentInstance.onTrialSelect(mockTrials[0] as any);

      expect(emitSpy).not.toHaveBeenCalledWith(expect.objectContaining({ trialNumber: 'INT-2024-001' }));
    });
  });

  describe('Output goTrialDetail', () => {
    it('should have the output goTrialDetail defined', async () => {
      const { fixture } = await setup();

      expect(fixture.componentInstance.goTrialDetail).toBeDefined();
    });

    it('should emit when emit is called with a trial', async () => {
      const { fixture } = await setup();
      const emitSpy = vi.spyOn(fixture.componentInstance.goTrialDetail, 'emit');

      fixture.componentInstance.goTrialDetail.emit(mockTrials[0] as any);

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          trialNumber: 'INT-2024-001',
          status: 'CANCELLED',
        }),
      );
    });
  });

  describe('Integration with mockTrials', () => {
    it('mockTrials should have the correct structure', () => {
      expect(mockTrials).toHaveLength(2);
      expect(mockTrials[0].trialNumber).toBe('INT-2024-001');
      expect(mockTrials[1].trialNumber).toBe('INT-2024-002');
    });

    it('mockTrials should have clients with id and name', () => {
      expect(mockTrials[0].client).toEqual({
        id: 'client-001',
        name: 'Fabricaciones Metálicas del Norte S.L.',
      });
      expect(mockTrials[1].client).toEqual({
        id: 'client-002',
        name: 'Construcciones García y Asociados',
      });
    });

    it('mockTrials should have fireTrialType with id and name', () => {
      expect(mockTrials[0].fireTrialType).toEqual({ id: '1', name: 'Ensayo de ignición' });
      expect(mockTrials[1].fireTrialType).toEqual({ id: '2', name: 'Ensayo de combustión lenta' });
    });

    it('mockTrials[1] should have associatedTrial', () => {
      expect(mockTrials[1].associatedTrial).toEqual({
        id: 'trial-001',
        trialNumber: 'INT-2024-001',
        description: 'Ensayo de resistencia al fuego de puertas metálicas RF-120',
      });
    });
  });
});
