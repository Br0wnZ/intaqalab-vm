import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TrialDocsService } from '../../../services/trial-docs-service';
import { TrialTypeService } from '../../../services/trial-type.service';
import { ModifyDocDialog } from './modify-doc-dialog';

// vi.mock hoisted by Vitest
describe('ModifyDocDialog', () => {
  const MOCK_DOCUMENT = {
    id: 'doc-1',
    name: 'test-document',
    category: 'GENERAL',
    type: { id: 'type-1', name: 'Test Type' },
  };

  const MOCK_TYPES = [
    { id: 'type-1', name: 'Test Type' },
    { id: 'type-2', name: 'Another Type' },
  ];

  const setup = async () => {
    vi.clearAllMocks();

    const closeMock = vi.fn();

    const docsServiceMock = {
      documentTypesResource: {
        value: signal(null),
      },
      updateDocumentInfoResource: {
        status: signal('idle'),
        value: signal(undefined),
      },
      updateDocumentInfo: vi.fn(),
      resetUpdateDocumentInfo: vi.fn(),
    };

    const trialTypeMock = {
      fireTrialTypesResource: {
        value: signal({ items: MOCK_TYPES, page: 1, pageSize: 10, totalElements: MOCK_TYPES.length }),
      },
    };

    const view = await render(ModifyDocDialog, {
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: { close: closeMock } },
        { provide: MAT_DIALOG_DATA, useValue: { document: MOCK_DOCUMENT } },
        { provide: TrialDocsService, useValue: docsServiceMock },
        { provide: TrialTypeService, useValue: trialTypeMock },
        provideTranslateService(),
      ],
    });

    const fixture = view.fixture;
    const component = fixture.componentInstance;
    return { fixture, component, closeMock, docsServiceMock };
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render the component', async () => {
      const { component } = await setup();
      expect(component).toBeTruthy();
    });

    it('should render dialog title', async () => {
      await setup();
      expect(screen.getByText(/MODIFY_DOC_DIALOG.TITLE/i)).toBeInTheDocument();
    });

    it('should render save and cancel buttons', async () => {
      await setup();
      expect(screen.getByRole('button', { name: /MODIFY_DOC_DIALOG.SAVE/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /MODIFY_DOC_DIALOG.CANCEL/i })).toBeInTheDocument();
    });
  });

  describe('Form Initialization', () => {
    it('should initialize form with document data', async () => {
      const { component } = await setup();
      expect(component.formModel().typeId).toBe('type-1');
      expect(component.formModel().name).toBe('test-document');
    });
  });

  describe('Button Actions', () => {
    it('should close dialog with false when cancel button is clicked', async () => {
      const { closeMock } = await setup();
      const user = userEvent.setup();
      const cancelButton = screen.getByRole('button', { name: /MODIFY_DOC_DIALOG.CANCEL/i });

      await user.click(cancelButton);

      expect(closeMock).toHaveBeenCalledWith(false);
    });
  });

  describe('Service Interaction', () => {
    it('should call updateDocumentInfo with correct parameters when save is clicked', async () => {
      const { fixture, component, docsServiceMock } = await setup();
      const user = userEvent.setup();

      component.formModel.set({ typeId: 'type-2', name: 'Updated Name' });
      fixture.detectChanges();

      const saveButton = screen.getByRole('button', { name: /MODIFY_DOC_DIALOG.SAVE/i });
      await user.click(saveButton);

      expect(docsServiceMock.updateDocumentInfo).toHaveBeenCalledWith('doc-1', 'Updated Name', 'GENERAL', 'type-2');
    });
  });

  describe('Form Validation', () => {
    it('should have valid form when required fields are filled', async () => {
      const { component } = await setup();
      expect(component.form().valid()).toBe(true);
    });

    it('should have invalid form when name is empty', async () => {
      const { fixture, component } = await setup();
      component.formModel.set({ typeId: 'type-1', name: '' });
      fixture.detectChanges();

      expect(component.form().invalid()).toBe(true);
    });

    it('should have invalid form when typeId is null', async () => {
      const { fixture, component } = await setup();
      component.formModel.set({ typeId: null, name: 'Test Name' });
      fixture.detectChanges();

      expect(component.form().invalid()).toBe(true);
    });
  });
});
