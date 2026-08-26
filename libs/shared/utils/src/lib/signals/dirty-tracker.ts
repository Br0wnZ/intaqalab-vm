import { computed, signal } from '@angular/core';

/**
 * Realiza una comparación estructural profunda entre dos valores.
 * Soporta primitivos, arrays y objetos planos. No soporta Map/Set/DOM.
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  // Guarda NaN: NaN !== NaN en JS pero son "iguales" estructuralmente
  if (typeof a === 'number' && typeof b === 'number' && Number.isNaN(a) && Number.isNaN(b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) =>
    deepEqual(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key],
    ),
  );
}

/**
 * Rastrea cambios de campos editables frente al último snapshot guardado.
 *
 * Los selectores de consulta (serie, disparo, etc.) NO deben incluirse en
 * `editableFields`: su cambio no debe marcar el formulario como dirty.
 *
 * @example
 * ```ts
 * readonly #dirtyTracker = createDirtyTracker(() => ({
 *   arma: this.formModel().arma,
 *   tubo: this.formModel().tubo,
 * }));
 * protected readonly isDirty = this.#dirtyTracker.isDirty;
 * // Tras guardar con éxito:
 * this.#dirtyTracker.syncSnapshot();
 * ```
 */
export function createDirtyTracker<T extends object>(editableFields: () => T) {
  const savedSnapshot = signal<T>(structuredClone(editableFields()));

  const isDirty = computed(() => !deepEqual(editableFields(), savedSnapshot()));

  const syncSnapshot = (): void => {
    savedSnapshot.set(structuredClone(editableFields()));
  };

  return { isDirty, syncSnapshot };
}
