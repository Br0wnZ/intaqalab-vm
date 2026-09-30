import type { OnDestroy, OnInit, Signal } from '@angular/core';
import { Directive, effect, inject } from '@angular/core';

import { ExecutionStore } from '../../+state/execution.store';
import type { FormWidget, WidgetFormState } from '../models/execution-grid.models';
import type { WidgetId } from '../models/widget-id.enum';
import { WidgetStateService } from '../services/widget-state.service';

/**
 * 🎯 Clase base para widgets con formulario
 *
 * Proporciona funcionalidad común para tracking de estado y registro de widgets autónomos
 */
@Directive()
export abstract class BaseFormWidgetComponent implements FormWidget, OnInit, OnDestroy {
  protected readonly widgetStateService = inject(WidgetStateService);
  readonly #executionStore = inject(ExecutionStore, { optional: true });

  /**
   * 🛑 Si se establece en la clase hija, registra el widget como autónomo en `ExecutionStore`
   * para excluirlo del refresco automático por cambio de `updatedAt` en `GET /state`.
   */
  protected readonly autonomousWidgetType: WidgetId | null = null;

  // 🆔 ID del widget (debe ser establecido por la clase hija)
  abstract widgetId: Signal<string>;

  // 📝 Estado del formulario (implementado por clase hija)
  abstract formState: Signal<WidgetFormState>;

  constructor() {
    // 🔄 Effect para sincronizar estado con el servicio
    effect(() => {
      const state = this.formState();
      const id = this.widgetId();
      this.widgetStateService.updateWidgetFormState(id, state);
    });
  }

  ngOnInit(): void {
    const id = this.widgetId();
    this.widgetStateService?.registerWidgetInstance?.(id, this);
    this.widgetStateService?.updateWidgetFormState?.(id, this.formState());
    if (this.autonomousWidgetType) {
      this.#executionStore?.registerAutonomousWidget?.(this.autonomousWidgetType);
    }
  }

  ngOnDestroy(): void {
    const id = this.widgetId();
    this.widgetStateService?.unregisterWidgetInstance?.(id);
    if (this.autonomousWidgetType) {
      this.#executionStore?.unregisterAutonomousWidget?.(this.autonomousWidgetType);
    }
  }

  /**
   * 🔄 Resetear formulario (debe ser implementado por clase hija)
   */
  abstract resetForm(): void;

  /**
   * 💾 Guardar formulario (debe ser implementado por clase hija)
   */
  abstract saveForm(): Promise<void>;
}
