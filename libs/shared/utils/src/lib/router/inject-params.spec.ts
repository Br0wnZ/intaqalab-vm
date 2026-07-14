import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { injectParams } from './inject-params';

@Component({ template: '' })
class TrialHost {
  readonly trialId = injectParams('trialId');
  readonly allParams = injectParams();
  readonly missing = injectParams('nope');
}

describe('injectParams', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'trials/:trialId', component: TrialHost }])],
    });
  });

  it('exposes a route param as signal', async () => {
    const harness = await RouterTestingHarness.create();
    const host = await harness.navigateByUrl('/trials/42', TrialHost);

    expect(host.trialId()).toBe('42');
  });

  it('updates on param-only navigation (same component instance)', async () => {
    const harness = await RouterTestingHarness.create();
    const host = await harness.navigateByUrl('/trials/42', TrialHost);

    await harness.navigateByUrl('/trials/99', TrialHost);

    expect(host.trialId()).toBe('99');
  });

  it('returns all params when called without key', async () => {
    const harness = await RouterTestingHarness.create();
    const host = await harness.navigateByUrl('/trials/7', TrialHost);

    expect(host.allParams()).toEqual({ trialId: '7' });
  });

  it('returns null for a missing param', async () => {
    const harness = await RouterTestingHarness.create();
    const host = await harness.navigateByUrl('/trials/1', TrialHost);

    expect(host.missing()).toBeNull();
  });

  it('throws when called outside an injection context without injector', () => {
    expect(() => injectParams('id')).toThrowError(/injection context/i);
  });
});
