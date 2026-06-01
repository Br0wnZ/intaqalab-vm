import { TestBed } from '@angular/core/testing';
import { TrialStatus } from '@intaqalab/models';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TrialStatusLabelPipe } from './inta-trial-status-label.pipe';

type TrialStatusTranslations = Record<keyof typeof TrialStatus, string>;

const mockTranslations: TrialStatusTranslations = {
  UNDER_REVIEW: 'En revisión',
  PLANNED: 'Planificado',
  PREPARED: 'Preparado',
  IN_PROGRESS: 'En progreso',
  INTERRUPTED: 'Interrumpido',
  STARTED: 'Iniciado',
  EXECUTED: 'Ejecutado',
  ANALYZING: 'Analizando',
  FINALIZING: 'Finalizando',
  CLOSED: 'Cerrado',
  CANCELLED: 'Cancelado',
  VOIDED: 'Anulado',
};

const setup = (subject: Subject<TrialStatusTranslations>) => {
  TestBed.configureTestingModule({
    providers: [
      TrialStatusLabelPipe,
      {
        provide: TranslateService,
        useValue: {
          getStreamOnTranslationChange: vi.fn(() => subject.asObservable()),
        },
      },
    ],
  });
  return { pipe: TestBed.inject(TrialStatusLabelPipe) };
};

describe('TrialStatusLabelPipe', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  describe('cuando las traducciones están disponibles', () => {
    it('debe retornar el label traducido para cada TrialStatus', () => {
      const { pipe } = setup(new BehaviorSubject<TrialStatusTranslations>(mockTranslations));

      (Object.entries(TrialStatus) as [keyof typeof TrialStatus, TrialStatus][]).forEach(([key, value]) => {
        expect(pipe.transform(value)).toBe(mockTranslations[key]);
      });
    });

    it('debe retornar el valor original si el status es desconocido', () => {
      const { pipe } = setup(new BehaviorSubject<TrialStatusTranslations>(mockTranslations));

      expect(pipe.transform('UNKNOWN_STATUS' as TrialStatus)).toBe('UNKNOWN_STATUS');
    });
  });

  describe('cuando las traducciones aún no han cargado', () => {
    it('debe retornar el status original si el signal es undefined', () => {
      const { pipe } = setup(new Subject<TrialStatusTranslations>());

      expect(pipe.transform(TrialStatus.PLANNED)).toBe(TrialStatus.PLANNED);
    });
  });
});
