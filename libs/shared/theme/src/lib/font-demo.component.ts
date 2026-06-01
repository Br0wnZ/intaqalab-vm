import { Component } from '@angular/core';

@Component({
  selector: 'app-font-demo',
  standalone: true,
  template: `
    <div class="p-8 space-y-8">
      <h1 class="text-3xl font-bold text-center mb-8">Fuentes custom</h1>

      <!-- Fuente Primaria (Inter) -->
      <section class="space-y-4">
        <h2 class="text-xl font-semibold text-gray-800">Inter (Fuente Primaria)</h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="p-4 border rounded-lg">
            <p class="font-client-primary text-sm">Light 300: The quick brown fox jumps over the lazy dog</p>
            <p class="font-client-primary font-medium text-base">
              Regular 400: The quick brown fox jumps over the lazy dog
            </p>
            <p class="font-client-primary font-semibold text-lg">
              Medium 500: The quick brown fox jumps over the lazy dog
            </p>
            <p class="font-client-primary font-bold text-xl">Bold 700: The quick brown fox jumps over the lazy dog</p>
          </div>
          <div class="p-4 border rounded-lg">
            <p class="font-client-primary italic text-sm">Light Italic: The quick brown fox jumps over the lazy dog</p>
            <p class="font-client-primary italic text-base">
              Regular Italic: The quick brown fox jumps over the lazy dog
            </p>
            <p class="font-client-primary italic font-semibold text-lg">
              Medium Italic: The quick brown fox jumps over the lazy dog
            </p>
            <p class="font-client-primary italic font-bold text-xl">
              Bold Italic: The quick brown fox jumps over the lazy dog
            </p>
          </div>
        </div>
      </section>

      <section class="space-y-4">
        <h2 class="text-xl font-semibold text-gray-800">Open Sans (Fuente Secundaria)</h2>
        <div class="p-4 border rounded-lg">
          <p class="font-client-secondary text-base">Regular: The quick brown fox jumps over the lazy dog</p>
          <p class="font-client-secondary font-semibold text-lg">
            Semibold: The quick brown fox jumps over the lazy dog
          </p>
          <p class="font-client-secondary font-bold text-xl">Bold: The quick brown fox jumps over the lazy dog</p>
        </div>
      </section>

      <section class="space-y-4">
        <h2 class="text-xl font-semibold text-gray-800">Uso Directo con Variables CSS</h2>
        <div class="p-4 border rounded-lg">
          <p style="font-family: var(--inta-font-primary)">Variable --inta-font-primary: Inter font family</p>
          <p style="font-family: var(--inta-font-secondary)">Variable --inta-font-secondary: Open Sans font family</p>
          <p style="font-family: var(--inta-font-mono)">Variable --inta-font-mono: Fira Code monospace</p>
        </div>
      </section>
    </div>
  `,
  styles: [],
})
export class FontDemoComponent {}
