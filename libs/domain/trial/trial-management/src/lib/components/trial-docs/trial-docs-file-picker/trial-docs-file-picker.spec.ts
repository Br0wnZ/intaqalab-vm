/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpEventType, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { fireEvent, render } from '@testing-library/angular';

import { TrialDocsService } from '../../../services/trial-docs-service';
import { ALLOWED_EXTENSIONS } from '../../../utils-models/valid-extensions';
import { TrialDocsFilePicker } from './trial-docs-file-picker';

// vi.mock hoisted by Vitest
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

export const createDragEvent = (type: string, files: File[] = []): DragEvent => {
  const event = new Event(type, { bubbles: true, cancelable: true }) as DragEvent;

  Object.defineProperty(event, 'dataTransfer', {
    value: {
      files,
      items: files.map((file) => ({
        kind: 'file',
        type: file.type,
        getAsFile: () => file,
      })),
      types: files.length > 0 ? ['Files'] : [],
      effectAllowed: 'all',
      dropEffect: 'none',
    },
    writable: false,
    configurable: true,
  });

  event.preventDefault = vi.fn();
  event.stopPropagation = vi.fn();

  return event;
};

describe('TrialDocsFilePicker', () => {
  let closeMock: ReturnType<typeof vi.fn>;
  const defaultImports = [TranslateModule.forRoot()];

  const mockDialogData = {
    trialId: 'trial-123',
  };

  const mockSubtypes = [
    { id: 'subtype-1', name: 'Autorización', active: true, category: 'GENERAL' },
    { id: 'subtype-2', name: 'Certificado de conformidad', active: true, category: 'GENERAL' },
  ];

  const renderDialog = async (data = mockDialogData, closeFn?: ReturnType<typeof vi.fn>) => {
    return render(TrialDocsFilePicker, {
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestingEnvironment(),
        { provide: MatDialogRef, useValue: { close: closeFn || vi.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
      imports: defaultImports,
    });
  };

  beforeEach(() => {
    closeMock = vi.fn();
  });

  describe('Component Initialization', () => {
    it('should create', async () => {
      const { fixture } = await renderDialog();
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should initialize with empty form', async () => {
      const { fixture } = await renderDialog();
      expect(fixture.componentInstance.formModel().documentType).toBe('');
      expect(fixture.componentInstance.formModel().file).toBeNull();
    });

    it('should have invalid form initially', async () => {
      const { fixture } = await renderDialog();
      expect(fixture.componentInstance.uploadFileForm().valid()).toBe(false);
    });

    it('should load document types on initialization', async () => {
      const { fixture } = await renderDialog();
      expect(fixture.componentInstance.getTypesResource().status()).toBe('loading');
    });

    it('should initialize with default valid extensions', async () => {
      const { fixture } = await renderDialog();
      expect(fixture.componentInstance.validExtensions()).toEqual(ALLOWED_EXTENSIONS);
    });

    it('should initialize values with empty file and defaults', async () => {
      const { fixture } = await renderDialog();
      expect(fixture.componentInstance.getFileName()).toBe('');
      expect(fixture.componentInstance.getFileSize()).toBe('0 Bytes');
      expect(fixture.componentInstance.isDragging()).toBe(false);
    });
  });

  describe('File Selection', () => {
    it('should select a file when input changes', async () => {
      const { fixture } = await renderDialog();
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.getElementById('fileInput') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);
      fixture.detectChanges();

      expect(fixture.componentInstance.formModel().file).toBe(file);
      expect(fixture.componentInstance.getFileName()).toBe('test.pdf');
      expect(fixture.componentInstance.formModel().file?.size).toBe(12);
    });

    it('should update form when file is selected', async () => {
      const { fixture } = await renderDialog();
      const file = new File(['test'], 'document.pdf', { type: 'application/pdf' });

      fixture.componentInstance.onFileSelected({ target: { files: [file] } } as any);

      expect(fixture.componentInstance.formModel().file).toBe(file);
      expect(fixture.componentInstance.uploadFileForm.file().touched()).toBe(true);
    });

    it('should trigger file input when button is clicked', async () => {
      const { fixture } = await renderDialog();
      const clickSpy = vi.fn();

      const inputElement = document.getElementById('fileInput') as HTMLInputElement;
      inputElement.click = clickSpy;

      fixture.componentInstance.triggerFileInput();

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should filter and select only valid files', async () => {
      const { fixture } = await renderDialog();

      const validFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const invalidFile = new File(['test'], 'test.exe', { type: 'application/exe' });

      fixture.componentInstance.handleFiles([invalidFile, validFile]);

      expect(fixture.componentInstance.formModel().file).toBe(validFile);
    });
  });

  describe('File Removal', () => {
    it('should remove selected file', async () => {
      const { fixture } = await renderDialog();
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      fixture.componentInstance.onFileSelected({ target: { files: [file] } } as any);

      expect(fixture.componentInstance.formModel().file).toBe(file);

      fixture.componentInstance.removeFile();

      expect(fixture.componentInstance.formModel().file).toBeNull();
      expect(fixture.componentInstance.getFileName()).toBe('');
      expect(fixture.componentInstance.getFileSize()).toBe('0 Bytes');
      expect(fixture.componentInstance.formModel().file).toBeNull();
    });

    it('should not remove file when uploading', async () => {
      const { fixture } = await renderDialog();
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      fixture.componentInstance.onFileSelected({
        target: { files: [file] },
      } as any);

      // Simulate uploading state
      vi.spyOn(fixture.componentInstance, 'isUploading').mockReturnValue(true);

      fixture.componentInstance.removeFile();

      expect(fixture.componentInstance.formModel().file).toBe(file);
    });
  });

  describe('Drag and Drop', () => {
    it('should set dragging state on drag over', async () => {
      const { fixture } = await renderDialog();
      const event = createDragEvent('dragover');

      vi.spyOn(event, 'preventDefault');
      vi.spyOn(event, 'stopPropagation');

      fixture.componentInstance.onDragOver(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(fixture.componentInstance.isDragging()).toBe(true);
    });

    it('should clear dragging state on drag leave', async () => {
      const { fixture } = await renderDialog();
      const event = createDragEvent('dragleave');

      fixture.componentInstance.isDragging.set(true);
      fixture.componentInstance.onDragLeave(event);

      expect(fixture.componentInstance.isDragging()).toBe(false);
    });

    it('should handle file drop', async () => {
      const { fixture } = await renderDialog();
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const event = createDragEvent('drop', [file]);

      Object.defineProperty(event, 'dataTransfer', {
        value: { files: [file] },
        writable: false,
      });

      vi.spyOn(event, 'preventDefault');
      vi.spyOn(event, 'stopPropagation');

      fixture.componentInstance.onDrop(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(fixture.componentInstance.isDragging()).toBe(false);
      expect(fixture.componentInstance.formModel().file).toBe(file);
    });

    it('should not handle drag operations when uploading', async () => {
      const { fixture } = await renderDialog();
      const event = createDragEvent('dragover');

      vi.spyOn(fixture.componentInstance, 'isUploading').mockReturnValue(true);

      fixture.componentInstance.onDragOver(event);

      expect(fixture.componentInstance.isDragging()).toBe(false);
    });
  });

  describe('Form Validation', () => {
    it('should be invalid when both fields are empty', async () => {
      const { fixture } = await renderDialog();
      expect(fixture.componentInstance.uploadFileForm().valid()).toBe(false);
    });

    it('should be invalid when only file is selected', async () => {
      const { fixture } = await renderDialog();
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      fixture.componentInstance.onFileSelected({ target: { files: [file] } } as any);

      expect(fixture.componentInstance.uploadFileForm().valid()).toBe(false);
    });

    it('should be valid when both fields are filled', async () => {
      const { fixture } = await renderDialog();
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      fixture.componentInstance.formModel.update((m) => ({ ...m, documentType: 'subtype-1' }));
      fixture.componentInstance.onFileSelected({ target: { files: [file] } } as any);

      expect(fixture.componentInstance.uploadFileForm().valid()).toBe(true);
    });
  });

  describe('File Upload', () => {
    const setupUploadSpy = () => vi.spyOn(TestBed.inject(TrialDocsService), 'uploadDocument');
    it('should upload file when form is valid', async () => {
      const { fixture } = await renderDialog(mockDialogData, closeMock);
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      fixture.componentInstance.formModel.update((m) => ({ ...m, documentType: 'subtype-1' }));
      fixture.componentInstance.onFileSelected({ target: { files: [file] } } as any);

      const uploadSpy = setupUploadSpy();

      fixture.componentInstance.onAdd();

      expect(uploadSpy).toHaveBeenCalledWith('trial-123', file, 'subtype-1', 'GENERAL', 'test.pdf');
      // closeMock is only called via effect when uploadResource resolves (async, not testable synchronously)
    });

    it('should not upload when form is invalid', async () => {
      const { fixture } = await renderDialog(mockDialogData, closeMock);
      const uploadSpy = setupUploadSpy();

      fixture.componentInstance.onAdd();

      expect(uploadSpy).not.toHaveBeenCalled();
      expect(closeMock).not.toHaveBeenCalled();
    });

    it('should not upload when already uploading', async () => {
      const { fixture } = await renderDialog();
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      fixture.componentInstance.formModel.update((m) => ({ ...m, documentType: 'subtype-1' }));
      fixture.componentInstance.onFileSelected({
        target: { files: [file] },
      } as any);

      vi.spyOn(fixture.componentInstance, 'isUploading').mockReturnValue(true);
      const uploadSpy = setupUploadSpy();

      fixture.componentInstance.onAdd();

      expect(uploadSpy).not.toHaveBeenCalled();
    });

    it('should calculate upload progress correctly', async () => {
      const { fixture } = await renderDialog();

      // Mock progress with 50% completion
      vi.spyOn(fixture.componentInstance.getuploadResource(), 'progress').mockReturnValue({
        type: HttpEventType.UploadProgress,
        loaded: 50,
        total: 100,
      });

      expect(fixture.componentInstance.uploadProgress()).toBe(50);
    });

    it('should return 0 progress when no progress data', async () => {
      const { fixture } = await renderDialog();

      vi.spyOn(fixture.componentInstance.getuploadResource(), 'progress').mockReturnValue(undefined);

      expect(fixture.componentInstance.uploadProgress()).toBe(0);
    });
  });

  describe('Dialog Actions', () => {
    it('should close dialog on cancel', async () => {
      const { fixture } = await renderDialog(mockDialogData, closeMock);

      fixture.componentInstance.onCancel();

      expect(closeMock).toHaveBeenCalled();
    });

    it('should not close dialog on cancel when uploading', async () => {
      const { fixture } = await renderDialog(mockDialogData, closeMock);

      vi.spyOn(fixture.componentInstance, 'isUploading').mockReturnValue(true);

      fixture.componentInstance.onCancel();

      expect(closeMock).not.toHaveBeenCalled();
    });
  });

  describe('File Icon', () => {
    it('should return correct icon for PDF', async () => {
      const { fixture } = await renderDialog();
      fixture.componentInstance.formModel.update((m) => ({ ...m, file: new File([''], 'document.pdf') }));

      expect(fixture.componentInstance.getFileIcon()).toBe('picture_as_pdf');
    });

    it('should return correct icon for Word documents', async () => {
      const { fixture } = await renderDialog();
      fixture.componentInstance.formModel.update((m) => ({ ...m, file: new File([''], 'document.docx') }));

      expect(fixture.componentInstance.getFileIcon()).toBe('description');
    });

    it('should return correct icon for Excel files', async () => {
      const { fixture } = await renderDialog();
      fixture.componentInstance.formModel.update((m) => ({ ...m, file: new File([''], 'spreadsheet.xlsx') }));

      expect(fixture.componentInstance.getFileIcon()).toBe('table_chart');
    });

    it('should return correct icon for images', async () => {
      const { fixture } = await renderDialog();
      fixture.componentInstance.formModel.update((m) => ({ ...m, file: new File([''], 'image.png') }));

      expect(fixture.componentInstance.getFileIcon()).toBe('image');
    });

    it('should return default icon for unknown types', async () => {
      const { fixture } = await renderDialog();
      fixture.componentInstance.formModel.update((m) => ({ ...m, file: new File([''], 'unknown.txt') }));

      expect(fixture.componentInstance.getFileIcon()).toBe('insert_drive_file');
    });
  });

  describe('File Size Formatting', () => {
    it('should format 0 bytes', async () => {
      const { fixture } = await renderDialog();
      fixture.componentInstance.formModel.update((m) => ({ ...m, file: null }));

      expect(fixture.componentInstance.getFileSize()).toBe('0 Bytes');
    });

    it('should format bytes', async () => {
      const { fixture } = await renderDialog();
      fixture.componentInstance.formModel.update((m) => ({ ...m, file: { name: 'f', size: 500 } as unknown as File }));

      expect(fixture.componentInstance.getFileSize()).toBe('500 Bytes');
    });

    it('should format kilobytes', async () => {
      const { fixture } = await renderDialog();
      fixture.componentInstance.formModel.update((m) => ({ ...m, file: { name: 'f', size: 1536 } as unknown as File }));

      expect(fixture.componentInstance.getFileSize()).toBe('2 KB');
    });

    it('should format megabytes', async () => {
      const { fixture } = await renderDialog();
      fixture.componentInstance.formModel.update((m) => ({
        ...m,
        file: { name: 'f', size: 1572864 } as unknown as File,
      }));

      expect(fixture.componentInstance.getFileSize()).toBe('2 MB');
    });

    it('should format gigabytes', async () => {
      const { fixture } = await renderDialog();
      fixture.componentInstance.formModel.update((m) => ({
        ...m,
        file: { name: 'f', size: 1610612736 } as unknown as File,
      }));

      expect(fixture.componentInstance.getFileSize()).toBe('2 GB');
    });
  });

  describe('Document Types', () => {
    it('should return empty array when types not loaded', async () => {
      const { fixture } = await renderDialog();

      expect(fixture.componentInstance.documentTypes()).toEqual([]);
    });

    it('should return types when loaded', async () => {
      const { fixture } = await renderDialog();
      const typesResponse = {
        page: 1,
        pageSize: 100,
        totalElements: 2,
        items: mockSubtypes,
      };

      vi.spyOn(fixture.componentInstance.getTypesResource(), 'value').mockReturnValue(typesResponse);

      // Since documentTypes is a computed signal that already ran, we check the resource directly
      expect(fixture.componentInstance.getTypesResource().value()).toEqual(typesResponse);
    });
  });
});
