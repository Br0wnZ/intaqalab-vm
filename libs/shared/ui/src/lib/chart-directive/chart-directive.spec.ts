/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, signal } from '@angular/core';
import { render } from '@testing-library/angular';
import type { ChartConfiguration } from 'chart.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChartDirective } from './chart-directive';

const mockDestroy = vi.fn();
const mockUpdate = vi.fn();
const mockConstructor = vi.fn();

vi.mock('chart.js', async (importOriginal) => {
  const original = await importOriginal<any>();
  class MockChart {
    static register = vi.fn();
    destroy = mockDestroy;
    update = mockUpdate;
    data: any;
    options: any;
    constructor(el: any, config: any) {
      this.data = config.data;
      this.options = config.options;
      mockConstructor(el, config);
    }
  }
  return {
    ...original,
    Chart: MockChart,
  };
});

@Component({
  imports: [ChartDirective],
  template: `
    @if (show()) {
      <canvas uiChart [config]="config()"></canvas>
    }
  `,
})
class TestHostComponent {
  show = signal(true);
  config = signal<ChartConfiguration>({
    type: 'bar',
    data: {
      labels: ['January'],
      datasets: [{ data: [65] }],
    },
    options: {
      responsive: true,
    },
  });
}

describe('ChartDirective', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create Chart instance with element and configuration', async () => {
    const { fixture } = await render(TestHostComponent);
    fixture.detectChanges();

    expect(mockConstructor).toHaveBeenCalledExactlyOnceWith(
      expect.any(HTMLCanvasElement),
      expect.objectContaining({
        type: 'bar',
        data: {
          labels: ['January'],
          datasets: [{ data: [65] }],
        },
      }),
    );
  });

  it('should update the chart data and options when config input changes', async () => {
    const { fixture } = await render(TestHostComponent);
    const componentInstance = fixture.componentInstance;
    fixture.detectChanges();

    expect(mockConstructor).toHaveBeenCalledOnce();

    const newConfig: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: ['February'],
        datasets: [{ data: [80] }],
      },
      options: {
        responsive: false,
      },
    };

    componentInstance.config.set(newConfig);
    fixture.detectChanges();

    // Verify it didn't recreate but called update()
    expect(mockConstructor).toHaveBeenCalledOnce();
    expect(mockUpdate).toHaveBeenCalledOnce();
  });

  it('should destroy the chart instance when directive is destroyed', async () => {
    const { fixture } = await render(TestHostComponent);
    const componentInstance = fixture.componentInstance;
    fixture.detectChanges();

    expect(mockConstructor).toHaveBeenCalledOnce();

    componentInstance.show.set(false);
    fixture.detectChanges();

    expect(mockDestroy).toHaveBeenCalledOnce();
  });
});
