import { TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';

import { WidgetStateService } from '../../services/widget-state.service';
import { ExecutionGridComponent } from './execution-grid';

const mockWidgetStateService = {
  updateWidgetFormState: vi.fn(),
  addWidget: vi.fn(),
  moveWidget: vi.fn(),
  removeWidget: vi.fn(),
  placedWidgets: () => [],
};

describe('ExecutionGridComponent', () => {
  const renderGrid = (editMode = false) =>
    render(ExecutionGridComponent, {
      inputs: { editMode },
      providers: [{ provide: WidgetStateService, useValue: mockWidgetStateService }],
      imports: [TranslateModule.forRoot()],
    });

  it('should create', async () => {
    const { fixture } = await renderGrid();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('computes free placeholder blocks when no widget is placed', async () => {
    const { fixture } = await renderGrid();
    const blocks = fixture.componentInstance.freePlaceholderBlocks();
    expect(blocks.length).toBeGreaterThan(0);
  });
});
