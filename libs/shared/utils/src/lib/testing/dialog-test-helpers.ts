import type { MatDialogRef } from '@angular/material/dialog';
import { vi } from 'vitest';

export function createMockMatDialogRef<T>() {
  return {
    close: vi.fn(),
    afterClosed: vi.fn().mockReturnValue({
      subscribe: vi.fn(),
    }),
    backdropClick: vi.fn().mockReturnValue({
      subscribe: vi.fn(),
    }),
    keydownEvents: vi.fn().mockReturnValue({
      subscribe: vi.fn(),
    }),
  } as unknown as MatDialogRef<T>;
}
