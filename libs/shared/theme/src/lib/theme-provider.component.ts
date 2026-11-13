// libs/shared/theme/src/lib/theme-provider.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-theme-provider',
  imports: [CommonModule],
  template: `
    <ng-content></ng-content>
  `, // Mejor práctica
})
export class ThemeProviderComponent {}
