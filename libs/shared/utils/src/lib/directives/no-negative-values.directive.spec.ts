/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NoNegativeValuesDirective } from './no-negative-values.directive';

@Component({
  standalone: true,
  imports: [NoNegativeValuesDirective],
  template: `
    <input type="text" libNoNegativeValues />
  `,
})
class TestComponent {}

@Component({
  standalone: true,
  imports: [NoNegativeValuesDirective],
  template: `
    <input id="num-default" type="number" libNoNegativeValues />
    <input id="num-min-5" type="number" libNoNegativeValues min="5" />
    <input id="num-min-neg" type="number" libNoNegativeValues min="-3" />
  `,
})
class TestNumberComponent {}

describe('NoNegativeValuesDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let inputEl: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent, TestNumberComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();
    inputEl = fixture.nativeElement.querySelector('input');
  });

  it('should set min="0" on number input by default or if current min is negative', () => {
    const numFixture = TestBed.createComponent(TestNumberComponent);
    numFixture.detectChanges();
    const compiled = numFixture.nativeElement;

    const defaultInput = compiled.querySelector('#num-default') as HTMLInputElement;
    expect(defaultInput.getAttribute('min')).toBe('0');

    const min5Input = compiled.querySelector('#num-min-5') as HTMLInputElement;
    expect(min5Input.getAttribute('min')).toBe('5');

    const minNegInput = compiled.querySelector('#num-min-neg') as HTMLInputElement;
    expect(minNegInput.getAttribute('min')).toBe('0');
  });

  it('should block "-" and "+" keydown events', () => {
    const eventMinus = new KeyboardEvent('keydown', { key: '-' });
    const preventMinusSpy = vi.spyOn(eventMinus, 'preventDefault');
    inputEl.dispatchEvent(eventMinus);
    expect(preventMinusSpy).toHaveBeenCalled();

    const eventPlus = new KeyboardEvent('keydown', { key: '+' });
    const preventPlusSpy = vi.spyOn(eventPlus, 'preventDefault');
    inputEl.dispatchEvent(eventPlus);
    expect(preventPlusSpy).toHaveBeenCalled();
  });

  it('should not block other keydown events', () => {
    const event = new KeyboardEvent('keydown', { key: '5' });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    inputEl.dispatchEvent(event);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it('should strip negative and positive signs from input value', () => {
    inputEl.value = '-123';
    inputEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(inputEl.value).toBe('123');

    inputEl.value = '+456';
    inputEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(inputEl.value).toBe('456');
  });

  it('should sanitize pasted negative and positive values', () => {
    const clipboardData1 = {
      getData: (format: string) => (format === 'text' ? '-456' : ''),
    } as unknown as DataTransfer;

    const pasteEvent1 = new Event('paste', {
      bubbles: true,
      cancelable: true,
    }) as any;
    pasteEvent1.clipboardData = clipboardData1;

    inputEl.dispatchEvent(pasteEvent1);
    fixture.detectChanges();
    expect(inputEl.value).toBe('456');

    const clipboardData2 = {
      getData: (format: string) => (format === 'text' ? '+789' : ''),
    } as unknown as DataTransfer;

    const pasteEvent2 = new Event('paste', {
      bubbles: true,
      cancelable: true,
    }) as any;
    pasteEvent2.clipboardData = clipboardData2;

    inputEl.dispatchEvent(pasteEvent2);
    fixture.detectChanges();
    expect(inputEl.value).toBe('789');
  });
});
