import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { WidgetStateService } from '../../services/widget-state.service';
import type { ShotFormLock, ShotSelectionGetter } from './shot-form-lock';
import { injectShotFormLock } from './shot-form-lock';

@Component({
  template: '',
})
class TestHostComponent {
  readonly selection = signal<ShotSelectionGetter>({ serie: null, disparo: null });
  readonly lock: ShotFormLock = injectShotFormLock(() => this.selection());
}

describe('injectShotFormLock', () => {
  function setup(options?: {
    activeSerieId?: string | null;
    activeShotId?: string | null;
    isTrialReadOnly?: boolean;
    progress?: {
      series: Array<{
        seriesId: string;
        shots: Array<{ shotId: string; status?: string | null }>;
      }>;
    } | null;
  }) {
    const activeSerieId = signal<string | null>(options?.activeSerieId ?? 's-1');
    const activeShotId = signal<string | null>(options?.activeShotId ?? 'sh-1');
    const isTrialReadOnly = signal<boolean>(options?.isTrialReadOnly ?? false);
    const executionProgress = signal(
      options?.progress ?? {
        series: [
          {
            seriesId: 's-1',
            shots: [
              { shotId: 'sh-1', status: 'ACTIVE' },
              { shotId: 'sh-2', status: 'FIRED' },
              { shotId: 'sh-3', status: 'PENDING' },
            ],
          },
        ],
      },
    );

    const mockStore = {
      activeSerieId: activeSerieId.asReadonly(),
      activeShotId: activeShotId.asReadonly(),
      isTrialReadOnly: isTrialReadOnly.asReadonly(),
      executionProgress: executionProgress.asReadonly(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: ExecutionStore, useValue: mockStore }, WidgetStateService],
    });

    const fixture = TestBed.createComponent(TestHostComponent);
    const host = fixture.componentInstance;
    const widgetState = TestBed.inject(WidgetStateService);

    return { fixture, host, widgetState, mockStore };
  }

  it('keeps form active by default for current in-progress shot', () => {
    const { fixture, host } = setup();

    host.selection.set({ serie: 's-1', disparo: 'sh-1' });
    fixture.detectChanges();

    expect(host.lock.isCurrentShot()).toBe(true);
    expect(host.lock.readOnly()).toBe(false);
    expect(host.lock.canEnableHistoricalEdit()).toBe(false);
    expect(host.lock.shotStatus()).toBe('EN_CURSO');
  });

  it('locks executed shot by default and allows enabling edit', () => {
    const { fixture, host } = setup();

    host.selection.set({ serie: 's-1', disparo: 'sh-2' });
    fixture.detectChanges();

    expect(host.lock.isCurrentShot()).toBe(false);
    expect(host.lock.isHistoricalFiredShot()).toBe(true);
    expect(host.lock.readOnly()).toBe(true);
    expect(host.lock.canEnableHistoricalEdit()).toBe(true);
    expect(host.lock.shotStatus()).toBe('EJECUTADA');

    host.lock.enableHistoricalEdit();
    fixture.detectChanges();

    expect(host.lock.readOnly()).toBe(false);
    expect(host.lock.canEnableHistoricalEdit()).toBe(false);
  });

  it('keeps pending shot disabled without edit permission', () => {
    const { fixture, host } = setup();

    host.selection.set({ serie: 's-1', disparo: 'sh-3' });
    fixture.detectChanges();

    expect(host.lock.isCurrentShot()).toBe(false);
    expect(host.lock.isUnexecutedShot()).toBe(true);
    expect(host.lock.readOnly()).toBe(true);
    expect(host.lock.canEnableHistoricalEdit()).toBe(false);
    expect(host.lock.shotStatus()).toBe('PENDIENTE');
  });

  it('locks all shots when trial is in read-only mode', () => {
    const { fixture, host } = setup({ isTrialReadOnly: true });

    host.selection.set({ serie: 's-1', disparo: 'sh-2' });
    fixture.detectChanges();

    expect(host.lock.readOnly()).toBe(true);
    expect(host.lock.canEnableHistoricalEdit()).toBe(false);
  });

  it('automatically locks back when selection changes', () => {
    const { fixture, host } = setup();

    host.selection.set({ serie: 's-1', disparo: 'sh-2' });
    fixture.detectChanges();

    host.lock.enableHistoricalEdit();
    fixture.detectChanges();
    expect(host.lock.readOnly()).toBe(false);

    host.selection.set({ serie: 's-1', disparo: 'sh-1' });
    fixture.detectChanges();
    expect(host.lock.readOnly()).toBe(false); // Current shot is active

    host.selection.set({ serie: 's-1', disparo: 'sh-2' });
    fixture.detectChanges();
    expect(host.lock.readOnly()).toBe(true); // Re-locked
  });

  it('automatically locks back when widget state save completes', async () => {
    const { fixture, host, widgetState } = setup();

    host.selection.set({ serie: 's-1', disparo: 'sh-2' });
    fixture.detectChanges();

    host.lock.enableHistoricalEdit();
    fixture.detectChanges();
    expect(host.lock.readOnly()).toBe(false);

    await widgetState.saveAllDirtyForms();
    fixture.detectChanges();

    expect(host.lock.readOnly()).toBe(true);
    expect(host.lock.canEnableHistoricalEdit()).toBe(true);
  });
});
