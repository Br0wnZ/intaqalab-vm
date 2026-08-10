import { signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createMockResource } from '@intaqalab/utils/testing/core';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';

import { MasterDataStore } from '../../../+state/master-data.store';
import { MasterDataService } from '../../../services/master-data.service';
import { MasterDataSwitchStatusDialogComponent } from './switch-status-dialog.component';

function createMockMasterDataService() {
  return {
    searchItems: signal<unknown>(undefined),
    paginatedResponse: createMockResource(),
    saveResource: createMockResource(),
    updateResource: createMockResource(),
    deleteById: createMockResource(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    resetUpsert: vi.fn(),
    resetSwitchStatus: vi.fn(),
    resetDelete: vi.fn(),
  };
}

describe('MasterDataSwitchStatusDialogComponent', () => {
  const defaultImports = [TranslateModule.forRoot()];
  const renderDialog = async (data?: Record<string, unknown>, closeFn?: ReturnType<typeof vi.fn>) => {
    return render(MasterDataSwitchStatusDialogComponent, {
      providers: [
        { provide: MasterDataService, useValue: createMockMasterDataService() },
        MasterDataStore,
        { provide: MatDialogRef, useValue: { close: closeFn || vi.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
      imports: defaultImports,
    });
  };

  it('should render the title', async () => {
    await renderDialog({ text: { title: 'title', description: 'description', buttons: {} } });
    const title = screen.getByRole('heading', { level: 2 });
    expect(title).toBeInTheDocument();
  });
});
