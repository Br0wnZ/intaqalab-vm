import type { OnDestroy } from '@angular/core';
import { Directive, ElementRef, effect, inject, input } from '@angular/core';
// ⚡ Tip de Arquitecto: Para tree-shaking real en producción, no importes 'registerables'.
// Importa solo los elementos que necesites (ej: BarController, CategoryScale, LinearScale).
import type { ChartConfiguration } from 'chart.js';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Directive({
  // Se aplica específicamente a elementos canvas
  selector: 'canvas[uiChart]',
})
export class ChartDirective implements OnDestroy {
  readonly #el = inject(ElementRef<HTMLCanvasElement>);
  // 📡 1. Recibimos la configuración y los datos de forma reactiva
  config = input.required<ChartConfiguration>();

  // 🛡️ 2. Hard Privacy: El componente padre jamás debe tocar la instancia
  #chartInstance: Chart | null = null;

  constructor() {
    // 3. El effect() maneja inteligentemente la creación y la actualización en Zoneless
    effect(() => {
      const currentConfig = this.config();

      if (!this.#chartInstance) {
        // Inicialización la primera vez que hay datos
        this.#chartInstance = new Chart(this.#el.nativeElement, currentConfig);
      } else {
        // Actualización fluida sin destruir el gráfico (mantiene animaciones)
        this.#chartInstance.data = currentConfig.data;
        if (currentConfig.options) {
          this.#chartInstance.options = currentConfig.options;
        }
        this.#chartInstance.update();
      }
    });
  }

  ngOnDestroy() {
    // 🧹 Prevención de memory leaks: Crítico en SPAs
    this.#chartInstance?.destroy();
  }
}
