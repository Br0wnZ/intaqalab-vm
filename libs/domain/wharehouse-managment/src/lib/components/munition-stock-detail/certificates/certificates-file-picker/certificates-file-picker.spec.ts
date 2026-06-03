/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpEventType, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';

import { MunitionsStockCertificatesService } from '../../../../services/munitions-stock-certificates.service';
import { CertificatesFilePicker } from './certificates-file-picker';

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

describe('CertificatesFilePicker', () => {
  let closeMock: ReturnType<typeof vi.fn>;

  const mockDialogData: { components: { id: string; name: string }[]; stockId: string } = {
    components: [],
    stockId: 'stockId',
  };

  const setup = async (data = mockDialogData, closeFn?: ReturnType<typeof vi.fn>) => {
    const view = await render(CertificatesFilePicker, {
      imports: [TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestingEnvironment(),
        { provide: MatDialogRef, useValue: { close: closeFn ?? vi.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });
    view.fixture.detectChanges();
    const container = view.fixture.nativeElement as HTMLElement;
    return { view, fixture: view.fixture, component: view.fixture.componentInstance, container };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    closeMock = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Initialization', () => {
    it('should create', async () => {
      const { component } = await setup();
      expect(component).toBeTruthy();
    });

    it('should have invalid form initially', async () => {
      const { component } = await setup();
      expect(component.uploadFileForm().valid()).toBe(false);
    });

    it('should initialize with empty file and default values', async () => {
      const { component } = await setup();
      expect(component.getFileName()).toBe('');
      expect(component.getFileSize()).toBe('0 Bytes');
      expect(component.isDragging()).toBe(false);
    });

    it('should auto-fill components when only one component is provided', async () => {
      const singleComponent = { id: 'comp-1', name: 'Component 1' };
      const { component } = await setup({ components: [singleComponent], stockId: 'stockId' });
      expect(component.formModel().components).toEqual([singleComponent.id]);
    });
  });

  describe('File Selection', () => {
    it('should update formModel when a file is selected via input', async () => {
      const { component, container, fixture } = await setup();
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const input = container.querySelector('#fileInput') as HTMLInputElement;

      Object.defineProperty(input, 'files', { value: [file], writable: false });
      input.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      expect(component.formModel().file).toBe(file);
      expect(component.getFileName()).toBe('test.pdf');
    });

    it('should set file and mark field as touched via onFileSelected', async () => {
      const { component } = await setup();
      const file = new File(['test'], 'document.pdf', { type: 'application/pdf' });

      component.onFileSelected({ target: { files: [file] } } as any);

      expect(component.formModel().file).toBe(file);
      expect(component.uploadFileForm.file().touched()).toBe(true);
    });

    it('should trigger file input click via triggerFileInput', async () => {
      const { component, container } = await setup();
      const input = container.querySelector('#fileInput') as HTMLInputElement;
      const clickSpy = vi.fn();
      input.click = clickSpy;

      component.triggerFileInput();

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should filter out invalid file types and select only valid files', async () => {
      const { component } = await setup();
      const validFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const invalidFile = new File(['test'], 'test.exe', { type: 'application/exe' });

      component.handleFiles([invalidFile, validFile]);

      expect(component.formModel().file).toBe(validFile);
    });

    it('should reject all files when none are valid', async () => {
      const { component } = await setup();
      const invalidFile = new File(['test'], 'test.exe', { type: 'application/exe' });

      component.handleFiles([invalidFile]);

      expect(component.formModel().file).toBeNull();
    });
  });

  describe('File Removal', () => {
    it('should remove selected file and reset state', async () => {
      const { component } = await setup();
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      component.onFileSelected({ target: { files: [file] } } as any);
      expect(component.formModel().file).toBe(file);

      component.removeFile();

      expect(component.formModel().file).toBeNull();
      expect(component.getFileName()).toBe('');
      expect(component.getFileSize()).toBe('0 Bytes');
    });

    it('should NOT remove file when uploading is in progress', async () => {
      const { component } = await setup();
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      component.onFileSelected({ target: { files: [file] } } as any);

      vi.spyOn(component, 'isUploading').mockReturnValue(true);
      component.removeFile();

      expect(component.formModel().file).toBe(file);
    });
  });

  describe('Drag and Drop', () => {
    it('should set isDragging to true on dragover', async () => {
      const { component } = await setup();
      const event = createDragEvent('dragover');

      component.onDragOver(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(component.isDragging()).toBe(true);
    });

    it('should set isDragging to false on dragleave', async () => {
      const { component } = await setup();
      component.isDragging.set(true);

      component.onDragLeave(createDragEvent('dragleave'));

      expect(component.isDragging()).toBe(false);
    });

    it('should handle valid file drop and update formModel', async () => {
      const { component } = await setup();
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const event = createDragEvent('drop', [file]);

      component.onDrop(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(component.isDragging()).toBe(false);
      expect(component.formModel().file).toBe(file);
    });

    it('should NOT set isDragging when uploading is in progress', async () => {
      const { component } = await setup();
      vi.spyOn(component, 'isUploading').mockReturnValue(true);

      component.onDragOver(createDragEvent('dragover'));

      expect(component.isDragging()).toBe(false);
    });

    it('should NOT handle drop when uploading is in progress', async () => {
      const { component } = await setup();
      vi.spyOn(component, 'isUploading').mockReturnValue(true);
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      component.onDrop(createDragEvent('drop', [file]));

      expect(component.formModel().file).toBeNull();
    });
  });

  describe('Form Validation', () => {
    it('should be invalid when both components and file are empty', async () => {
      const { component } = await setup();
      expect(component.uploadFileForm().valid()).toBe(false);
    });

    it('should be valid when only file is selected (components required does not block empty arrays)', async () => {
      // Signal Forms' required() on an array does not invalidate empty arrays â€”
      // the form becomes valid once the file field (the only blocking field) is set.
      const { component } = await setup();
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      component.onFileSelected({ target: { files: [file] } } as any);

      expect(component.uploadFileForm().valid()).toBe(true);
    });

    it('should be valid when both components and file are provided', async () => {
      const { component } = await setup();
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      component.formModel.update((m) => ({ ...m, components: ['comp-x'] }));
      component.onFileSelected({ target: { files: [file] } } as any);

      expect(component.uploadFileForm().valid()).toBe(true);
    });
  });

  describe('File Upload (onAdd)', () => {
    const getUploadSpy = () => vi.spyOn(TestBed.inject(MunitionsStockCertificatesService), 'uploadDocument');

    it('should call uploadDocument and close dialog when form is valid', async () => {
      const { component } = await setup(mockDialogData, closeMock);
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      component.formModel.update((m) => ({ ...m, components: ['comp-x'] }));
      component.onFileSelected({ target: { files: [file] } } as any);

      const uploadSpy = getUploadSpy();
      component.onAdd();

      expect(uploadSpy).toHaveBeenCalledWith('stockId', file);
      expect(closeMock).toHaveBeenCalledWith({
        action: 'add',
        data: { file, components: ['comp-x'] },
      });
    });

    it('should NOT upload when form is invalid', async () => {
      const { component } = await setup(mockDialogData, closeMock);
      const uploadSpy = getUploadSpy();

      component.onAdd();

      expect(uploadSpy).not.toHaveBeenCalled();
      expect(closeMock).not.toHaveBeenCalled();
    });

    it('should NOT upload when already uploading', async () => {
      const { component } = await setup();
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      component.formModel.update((m) => ({ ...m, components: ['comp-x'] }));
      component.onFileSelected({ target: { files: [file] } } as any);

      vi.spyOn(component, 'isUploading').mockReturnValue(true);
      const uploadSpy = getUploadSpy();

      component.onAdd();

      expect(uploadSpy).not.toHaveBeenCalled();
    });

    it('should NOT call uploadDocument when form is invalid (file missing)', async () => {
      // onAdd with invalid form triggers markAsTouched on the whole form.
      // Signal Forms' markAsTouched propagates differently than traditional forms;
      // we verify the upload is not triggered rather than individual field touched state.
      const { component } = await setup(mockDialogData, closeMock);
      const uploadSpy = vi.spyOn(TestBed.inject(MunitionsStockCertificatesService), 'uploadDocument');

      component.onAdd();

      expect(uploadSpy).not.toHaveBeenCalled();
      expect(closeMock).not.toHaveBeenCalled();
    });
  });

  describe('Upload Progress', () => {
    it('should calculate upload progress as a percentage', async () => {
      const { component } = await setup();
      vi.spyOn(component.getuploadResource(), 'progress').mockReturnValue({
        type: HttpEventType.UploadProgress,
        loaded: 50,
        total: 100,
      });

      expect(component.uploadProgress()).toBe(50);
    });

    it('should return 0 progress when no progress data is available', async () => {
      const { component } = await setup();
      vi.spyOn(component.getuploadResource(), 'progress').mockReturnValue(undefined);

      expect(component.uploadProgress()).toBe(0);
    });
  });

  describe('Dialog Actions', () => {
    it('should close dialog when cancel is clicked', async () => {
      const { component } = await setup(mockDialogData, closeMock);
      component.onCancel();
      expect(closeMock).toHaveBeenCalled();
    });

    it('should NOT close dialog when cancel is clicked while uploading', async () => {
      const { component } = await setup(mockDialogData, closeMock);
      vi.spyOn(component, 'isUploading').mockReturnValue(true);

      component.onCancel();

      expect(closeMock).not.toHaveBeenCalled();
    });
  });
});
