import { RangePipe } from './range.pipe';
import { render, screen } from '@testing-library/angular';
import { Component } from '@angular/core';

@Component({
  template: `
    @for (i of length | range: start; track i) {
      <div data-testid="range-item">{{ i }}</div>
    }
  `,
  imports: [RangePipe],
})
class TestHostComponent {
  length = 3;
  start?: number;
}

describe('RangePipe', () => {
  let pipe: RangePipe;

  beforeEach(() => {
    pipe = new RangePipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return array of given length starting from 1 by default', () => {
    expect(pipe.transform(3)).toEqual([1, 2, 3]);
  });

  it('should return array of given length starting from custom start value', () => {
    expect(pipe.transform(3, 0)).toEqual([0, 1, 2]);
    expect(pipe.transform(3, 5)).toEqual([5, 6, 7]);
  });

  it('should return empty array for negative or zero length', () => {
    expect(pipe.transform(0)).toEqual([]);
    expect(pipe.transform(-5)).toEqual([]);
  });

  it('should return empty array for null or undefined length', () => {
    expect(pipe.transform(null)).toEqual([]);
    expect(pipe.transform(undefined)).toEqual([]);
  });

  it('should render items correctly in template', async () => {
    await render(TestHostComponent);
    
    const items = screen.getAllByTestId('range-item');
    expect(items).toHaveLength(3);
    expect(items[0].textContent).toBe('1');
    expect(items[1].textContent).toBe('2');
    expect(items[2].textContent).toBe('3');
  });

  it('should render items correctly with custom start in template', async () => {
    await render(TestHostComponent, {
      componentProperties: {
        length: 3,
        start: 0,
      }
    });
    
    const items = screen.getAllByTestId('range-item');
    expect(items).toHaveLength(3);
    expect(items[0].textContent).toBe('0');
    expect(items[1].textContent).toBe('1');
    expect(items[2].textContent).toBe('2');
  });
});
