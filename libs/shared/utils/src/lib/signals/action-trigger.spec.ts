import { Injector, effect, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { actionTrigger } from './action-trigger';

describe('actionTrigger', () => {
  it('should initialize with null', () => {
    const trigger = actionTrigger<string>();
    expect(trigger.value()).toBeNull();
  });

  it('should update value on fire', () => {
    const trigger = actionTrigger<string>();
    trigger.fire('test');
    expect(trigger.value()).toBe('test');
  });

  it('should set value to null on reset', () => {
    const trigger = actionTrigger<string>();
    trigger.fire('test');
    trigger.reset();
    expect(trigger.value()).toBeNull();
  });

  it('should always trigger reactivity even with identical payloads', () => {
    const injector = TestBed.inject(Injector);
    const trigger = actionTrigger<string>();
    let effectRuns = 0;

    runInInjectionContext(injector, () => {
      effect(() => {
        trigger.value(); // read dependency
        effectRuns++;
      });
    });

    TestBed.flushEffects();
    expect(effectRuns).toBe(1); // Initial run

    trigger.fire('test');
    TestBed.flushEffects();
    expect(effectRuns).toBe(2); // Runs for new payload

    trigger.fire('test'); // Identical payload
    TestBed.flushEffects();
    expect(effectRuns).toBe(3); // Should run again due to equal: () => false
  });
});
