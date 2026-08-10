import { Directive, effect, inject, signal } from '@angular/core';
import type { OnDestroy, OnInit, Signal } from '@angular/core';

import type { FormWidget, WidgetFormState } from '../models/execution-grid.models';
import { WidgetStateService } from '../services/widget-state.service';

/**
 * 🎯 Clase base para widgets con formulario
 *
 * Proporciona funcionalidad común para tracking de estado
 */
@Directive()
export abstract class BaseFormWidgetComponent implements FormWidget, OnInit, OnDestroy {
  protected readonly widgetStateService = inject(WidgetStateService);

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
  }

  ngOnDestroy(): void {
    const id = this.widgetId();
    this.widgetStateService?.unregisterWidgetInstance?.(id);
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

