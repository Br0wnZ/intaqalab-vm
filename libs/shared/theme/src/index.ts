// Para usar el tema SCSS, importa directamente en styles.scss:
//   @use "@intaqalab/theme" as theme;
// El path alias está configurado en tsconfig.base.json

// Exportar componentes TypeScript
export * from './lib/theme-provider.component';
export * from './lib/font-demo.component';

// Re-exportar módulos de Angular Material para conveniencia
export { MatButtonModule } from '@angular/material/button';
export { MatIconModule } from '@angular/material/icon';
export { MatCardModule } from '@angular/material/card';
export { MatFormFieldModule } from '@angular/material/form-field';
export { MatInputModule } from '@angular/material/input';
