import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TrialPersmissionsService } from '@intaqalab/trial-management';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EventsActionsService } from '../../services/events-actions.service';
import { DayActionsComponent } from './day-actions.component';

// Mock ng2-pdf-viewer to prevent PDF.js from crashing in JSDOM.
class FakeTranslateLoader {
  getTranslation() {
    return of({ HELLO: 'Hola' });
  }
}

function mockEventsActionsService() {
  return {
    addObservationsToDay: vi.fn().mockResolvedValue(true),
    editObservationsToDay: vi.fn().mockResolvedValue(true),
    deleteObs: vi.fn().mockResolvedValue(true),
    schedule: vi.fn().mockResolvedValue(true),
  };
}

function mockTrialPersmissionsService(canSchedule = true) {
  return { canSchedule: () => canSchedule };
}

interface SetupInputs {
  observations?: { id: string } | null;
  isDisabled?: boolean;
  linesOfShotData?: unknown;
  canSchedule?: boolean;
  value?: Date;
}

async function setup(inputs: SetupInputs = {}) {
  const { canSchedule = true, ...componentInputs } = inputs;
  const mock = mockEventsActionsService();
  const permsMock = mockTrialPersmissionsService(canSchedule);

  const view = await render(DayActionsComponent, {
    inputs: {
      value: componentInputs.value ?? new Date(),
      observations: null,
      ...componentInputs,
    },
    imports: [
      TranslateModule.forRoot({
        loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
      }),
    ],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTestingEnvironment(),
      { provide: EventsActionsService, useValue: mock },
      { provide: TrialPersmissionsService, useValue: permsMock },
    ],
  });

  const rootLoader = TestbedHarnessEnvironment.documentRootLoader(view.fixture);
  const loader = TestbedHarnessEnvironment.loader(view.fixture);
  const fixture = view.fixture;
  fixture.detectChanges();
  const componentInstance = fixture.componentInstance;
  return { fixture, componentInstance, rootLoader, loader, mockService: mock };
}

describe('DayActionsComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Menu items

  describe('Menu items', () => {
    it('should show 2 items when canSchedule=true and no observations', async () => {
      const { loader } = await setup({ observations: null });
      const menu = await loader.getHarness(MatMenuHarness);
      await menu.open();
      const items = await menu.getItems();
      expect(items.length).toBe(2);
    });

    it('should show 3 items when canSchedule=true and observations provided', async () => {
      const { loader } = await setup({ observations: { id: 'id' } });
      const menu = await loader.getHarness(MatMenuHarness);
      await menu.open();
      const items = await menu.getItems();
      expect(items.length).toBe(3);
    });

    it('should show 1 item when canSchedule=false and no observations', async () => {
      const { loader } = await setup({ observations: null, canSchedule: false });
      const menu = await loader.getHarness(MatMenuHarness);
      await menu.open();
      const items = await menu.getItems();
      expect(items.length).toBe(1);
    });

    it('should show 2 items when canSchedule=false and observations provided', async () => {
      const { loader } = await setup({ observations: { id: 'id' }, canSchedule: false });
      const menu = await loader.getHarness(MatMenuHarness);
      await menu.open();
      const items = await menu.getItems();
      expect(items.length).toBe(2);
    });
  });

  // Service delegation

  describe('Service delegation', () => {
    it('addObs should delegate to EventsActionsService.addObservationsToDay', async () => {
      const { componentInstance, mockService } = await setup({ observations: null });
      await componentInstance.addObs();
      expect(mockService.addObservationsToDay).toHaveBeenCalled();
    });

    it('deleteObs should delegate to EventsActionsService.deleteObs', async () => {
      const { componentInstance, mockService } = await setup({ observations: { id: 'id' } });
      await componentInstance.deleteObs();
      expect(mockService.deleteObs).toHaveBeenCalled();
    });

    it('editObs should delegate to EventsActionsService.editObservationsToDay', async () => {
      const { componentInstance, mockService } = await setup({ observations: { id: 'id' } });
      await componentInstance.editObs();
      expect(mockService.editObservationsToDay).toHaveBeenCalled();
    });

    it('schedule should delegate to EventsActionsService.schedule with linesOfShotData and date', async () => {
      const linesOfShotData = { lineId: 'line-1' };
      const testDate = new Date('2026-01-15');
      const { componentInstance, mockService } = await setup({ linesOfShotData, value: testDate });
      await componentInstance.schedule();
      expect(mockService.schedule).toHaveBeenCalledWith(linesOfShotData, testDate);
    });

    it('addObs should NOT call service when value input is not set', async () => {
      const { componentInstance, mockService, fixture } = await setup();
      // override value to undefined
      fixture.componentRef.setInput('value', undefined);
      await componentInstance.addObs();
      expect(mockService.addObservationsToDay).not.toHaveBeenCalled();
    });

    it('editObs should NOT call service when observations is null', async () => {
      const { componentInstance, mockService } = await setup({ observations: null });
      await componentInstance.editObs();
      expect(mockService.editObservationsToDay).not.toHaveBeenCalled();
    });

    it('deleteObs should NOT call service when observations is null', async () => {
      const { componentInstance, mockService } = await setup({ observations: null });
      await componentInstance.deleteObs();
      expect(mockService.deleteObs).not.toHaveBeenCalled();
    });
  });

  // refreshView output

  describe('refreshView output', () => {
    it('should emit refreshView after successful addObs', async () => {
      const { componentInstance, fixture } = await setup({ observations: null });
      const emitted: boolean[] = [];
      componentInstance.refreshView.subscribe((v) => emitted.push(v));

      await componentInstance.addObs();
      fixture.detectChanges();

      expect(emitted).toEqual([true]);
    });

    it('should emit refreshView after successful editObs', async () => {
      const { componentInstance, fixture } = await setup({ observations: { id: 'id' } });
      const emitted: boolean[] = [];
      componentInstance.refreshView.subscribe((v) => emitted.push(v));

      await componentInstance.editObs();
      fixture.detectChanges();

      expect(emitted).toEqual([true]);
    });

    it('should emit refreshView after successful deleteObs', async () => {
      const { componentInstance, fixture } = await setup({ observations: { id: 'id' } });
      const emitted: boolean[] = [];
      componentInstance.refreshView.subscribe((v) => emitted.push(v));

      await componentInstance.deleteObs();
      fixture.detectChanges();

      expect(emitted).toEqual([true]);
    });

    it('should NOT emit refreshView when service returns false', async () => {
      const { componentInstance, mockService, fixture } = await setup({ observations: null });
      mockService.addObservationsToDay.mockResolvedValue(false);
      const emitted: boolean[] = [];
      componentInstance.refreshView.subscribe((v) => emitted.push(v));

      await componentInstance.addObs();
      fixture.detectChanges();

      expect(emitted).toHaveLength(0);
    });

    it('should emit refreshView after successful schedule', async () => {
      const linesOfShotData = { lineId: 'line-1' };
      const { componentInstance, fixture } = await setup({ linesOfShotData });
      const emitted: boolean[] = [];
      componentInstance.refreshView.subscribe((v) => emitted.push(v));

      await componentInstance.schedule();
      fixture.detectChanges();

      expect(emitted).toEqual([true]);
    });

    it('should NOT emit refreshView when schedule returns false', async () => {
      const linesOfShotData = { lineId: 'line-1' };
      const { componentInstance, mockService, fixture } = await setup({ linesOfShotData });
      mockService.schedule.mockResolvedValue(false);
      const emitted: boolean[] = [];
      componentInstance.refreshView.subscribe((v) => emitted.push(v));

      await componentInstance.schedule();
      fixture.detectChanges();

      expect(emitted).toHaveLength(0);
    });
  });

  // isDisabled input

  describe('isDisabled input', () => {
    it('should disable the trigger button when isDisabled=true', async () => {
      const { fixture } = await setup({ isDisabled: true });
      const trigger = fixture.nativeElement.querySelector('.day-actions__trigger') as HTMLButtonElement;
      expect(trigger.disabled).toBe(true);
    });

    it('should not disable the trigger button when isDisabled=false', async () => {
      const { fixture } = await setup({ isDisabled: false });
      const trigger = fixture.nativeElement.querySelector('.day-actions__trigger') as HTMLButtonElement;
      expect(trigger.disabled).toBe(false);
    });

    it('should render the trigger button with aria-label "Actions"', async () => {
      const { fixture } = await setup();
      const trigger = fixture.nativeElement.querySelector('.day-actions__trigger') as HTMLButtonElement;
      expect(trigger.getAttribute('aria-label')).toBe('Actions');
    });
  });
});
