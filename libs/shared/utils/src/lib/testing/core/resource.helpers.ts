import type { ResourceStatus, Signal } from '@angular/core';
import { computed, signal } from '@angular/core';
import { vi } from 'vitest';

/**
 * 📊 Interface completa de un Resource mock
 */
export interface MockResource<T = unknown> {
  // Signals de solo lectura
  readonly value: Signal<T | undefined>;
  readonly isLoading: Signal<boolean>;
  readonly error: Signal<Error | undefined>;
  readonly status: Signal<ResourceStatus>;
  readonly hasValue: Signal<boolean>;
  readonly hasError: Signal<boolean>;
  readonly statusCode: Signal<number>;

  // Método de recarga
  reload: ReturnType<typeof vi.fn>;

  // Helpers para testing (prefijados con _)
  _setValue: (value: T | undefined) => void;
  _setLoading: (loading: boolean) => void;
  _setError: (error: Error | undefined) => void;
  _setStatus: (status: ResourceStatus) => void;
  _reset: () => void;
}

/**
 * 🏭 Factory para crear un Resource mock con todas las funcionalidades
 *
 * @example
 * ```typescript
 * const userResource = createMockResource<User>({ id: '1', name: 'John' });
 * userResource._setStatus('loading');
 * expect(userResource.isLoading()).toBe(true);
 * ```
 */
export function createMockResource<T = unknown>(initialValue?: T): MockResource<T> {
  // 📦 Signals internos (writeable)
  const valueSignal = signal<T | undefined>(initialValue);
  const isLoadingSignal = signal<boolean>(false);
  const errorSignal = signal<Error | undefined>(undefined);
  const statusSignal = signal<ResourceStatus>('idle');
  const statusCodeSignal = signal<number>(200);

  // 🧮 Computed signals
  const hasValueSignal = computed(() => valueSignal() !== undefined);
  const hasErrorSignal = computed(() => errorSignal() !== undefined);

  return {
    // ✅ Signals de solo lectura (API pública)
    value: valueSignal.asReadonly(),
    isLoading: isLoadingSignal.asReadonly(),
    error: errorSignal.asReadonly(),
    status: statusSignal.asReadonly(),
    hasValue: hasValueSignal,
    hasError: hasErrorSignal,
    statusCode: statusCodeSignal,

    // 🔄 Método de recarga
    reload: vi.fn(),

    // 🧪 Helpers para testing (internos)
    _setValue: (value: T | undefined) => {
      valueSignal.set(value);
      if (value !== undefined) {
        statusSignal.set('resolved');
      }
    },

    _setLoading: (loading: boolean) => {
      isLoadingSignal.set(loading);
      if (loading) {
        statusSignal.set('loading');
      }
    },

    _setError: (error: Error | undefined) => {
      errorSignal.set(error);
      if (error) {
        statusSignal.set('error');
      }
    },

    _setStatus: (status: ResourceStatus) => {
      statusSignal.set(status);
      // Sincronizar con otros signals
      switch (status) {
        case 'loading':
          isLoadingSignal.set(true);
          break;
        case 'resolved':
          isLoadingSignal.set(false);
          errorSignal.set(undefined);
          break;
        case 'error':
          isLoadingSignal.set(false);
          break;
        case 'idle':
          isLoadingSignal.set(false);
          errorSignal.set(undefined);
          break;
      }
    },

    _reset: () => {
      valueSignal.set(initialValue);
      isLoadingSignal.set(false);
      errorSignal.set(undefined);
      statusSignal.set('idle');
    },
  };
}

/**
 * 🎭 Helper para simular el ciclo de vida completo de un resource
 *
 * @example
 * ```typescript
 * const resource = createMockResource<User>();
 * await simulateResourceLifecycle(resource, { id: '1', name: 'John' });
 * expect(resource.status()).toBe('resolved');
 * ```
 */
export async function simulateResourceLifecycle<T>(
  resource: MockResource<T>,
  finalValue: T,
  options: {
    loadingDelay?: number;
    shouldError?: boolean;
    errorMessage?: string;
  } = {},
): Promise<void> {
  const { loadingDelay = 100, shouldError = false, errorMessage = 'Error' } = options;

  // Estado loading
  resource._setStatus('loading');

  // Simular delay
  await new Promise((resolve) => setTimeout(resolve, loadingDelay));

  if (shouldError) {
    // Estado error
    resource._setError(new Error(errorMessage));
    resource._setStatus('error');
  } else {
    // Estado resolved
    resource._setValue(finalValue);
    resource._setStatus('resolved');
  }
}
