import { vi } from 'vitest';

vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));
