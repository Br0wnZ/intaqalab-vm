# 🎨 Sistema de Temas - Intaqalab

Sistema de temas unificado para aplicaciones Angular que integra **Tailwind CSS v4+** con **Angular Material v21**, siguiendo las mejores prácticas de 2025.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Colores del Cliente](#-colores-del-cliente)
- [Tipografía del Cliente](#️-tipografía-del-cliente)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Uso en Componentes](#-uso-en-componentes)
- [Clases CSS Personalizadas](#-clases-css-personalizadas)
- [Configuración de Tailwind](#-configuración-de-tailwind)
- [Tema Oscuro](#-tema-oscuro)
- [Ejemplos](#-ejemplos)
- [Contribución](#-contribución)

## ✨ Características

- ✅ **Angular Material v21** con tema M3 y tokens personalizados
- ✅ **Tailwind CSS v4+** con extensiones del cliente
- ✅ **CSS Custom Properties** para temas dinámicos
- ✅ **Standalone Components** y Signals
- ✅ **Nx Monorepo** compatible
- ✅ **Tema Oscuro** opcional
- ✅ **TypeScript** con tipos seguros
- ✅ **PostCSS** configurado para librerías

## 🏗️ Arquitectura

```
libs/shared/theme/
├── src/lib/
│   ├── _variables.scss          # CSS Custom Properties del cliente
│   ├── _material-theme.scss     # Overrides de Angular Material
│   ├── _utilities.scss          # Clases CSS personalizadas
│   ├── index.scss               # Punto de entrada del tema
│   └── theme-provider.component.ts  # Proveedor de tema (futuro)
├── tailwind.config.js           # Configuración de Tailwind
├── postcss.config.js            # Configuración de PostCSS
└── README.md                    # Esta documentación
```

## 🎨 Colores del Cliente

### Paleta Primaria (Gris)

- **Primary**: `#A4A7AE` - Gris claro principal
- **Primary Light**: `#B8BBC2`
- **Primary Dark**: `#90949B`

### Paleta Secundaria (Verde Corporativo)

- **Secondary**: `#059669` - Verde principal
- **Secondary Light**: `#10b981`
- **Secondary Dark**: `#047857`

### Paleta Terciaria (Ámbar)

- **Tertiary**: `#f59e0b` - Ámbar para acentos
- **Tertiary Light**: `#fbbf24`
- **Tertiary Dark**: `#d97706`

### Colores de Estado

- **Success**: `#22c55e`
- **Warning**: `#eab308`
- **Error**: `#ef4444`
- **Info**: `#3b82f6`

### Colores de Botones

- **Button**: `#7F56D9` - Morado para botones principales
- **Button Hover**: `#4C1D95` - Morado más oscuro para hover

#### Variantes de Botones

- **Text Button**: Color primario gris (#A4A7AE)
- **Outlined Button**: Borde y texto en color primario
- **Filled Button**: Fondo morado (#7F56D9), texto blanco
- **Tonal Button**: Fondo gris claro, texto gris oscuro
- **Elevated Button**: Fondo blanco con elevación, texto primario
- **Icon Button**: Iconos en color primario
- **FAB Button**: Verde corporativo (#059669), texto blanco
- **Mini FAB**: Verde corporativo, tamaño reducido
- **Extended FAB**: Verde corporativo con texto e icono

## ✍️ Tipografía del Cliente

### Fuentes Locales

El sistema incluye fuentes **Inter** locales optimizadas para web (WOFF2) con los siguientes pesos y estilos:

#### Familia Inter (Principal)

- **300 Light** (normal e italic)
- **400 Regular** (normal e italic)
- **500 Medium** (normal e italic)
- **600 SemiBold** (normal e italic)
- **700 Bold** (normal e italic)
- **800 ExtraBold** (normal e italic)

#### Configuración Automática

Las fuentes se cargan automáticamente al importar el tema. No se requiere configuración adicional.

> **Nota**: La librería theme está optimizada para usarse dentro de aplicaciones Angular con Nx. La compilación como paquete independiente tiene limitaciones conocidas con PostCSS/Tailwind, pero funciona perfectamente cuando se integra en aplicaciones.

```scss
// Las fuentes se cargan automáticamente con el tema
@use '@intaqalab/theme' as theme;
```

#### Uso en CSS

```scss
// Usar fuente primaria (Inter)
font-family: var(--inta-font-primary);

// Usar fuente secundaria (Open Sans)
font-family: var(--inta-font-secondary);

// Usar fuente monoespaciada (Fira Code)
font-family: var(--inta-font-mono);
```

#### Uso en Tailwind CSS

```html
<!-- Fuente primaria -->
<p class="font-client-primary">Texto con Inter</p>

<!-- Fuente secundaria -->
<p class="font-client-secondary">Texto con Open Sans</p>

<!-- Fuente monoespaciada -->
<code class="font-client-mono">Código fuente</code>
```

#### Pesos de Fuente

```scss
--inta-font-weight-regular: 400;
--inta-font-weight-medium: 500;
--inta-font-weight-bold: 700;
```

### Componente de Demostración

Para ver todas las fuentes en acción, usa el componente `FontDemoComponent`:

```typescript
import { FontDemoComponent } from '@intaqalab/theme';

// En tu módulo o componente standalone
@Component({
  imports: [FontDemoComponent],
  // ...
})
```

## 🚀 Instalación y Configuración

### 1. Importar el Tema Global

En `src/styles.scss`:

```scss
// Importar el tema completo
@use '@intaqalab/theme' as theme;

// Aplicar el tema base
@include theme.client-material-theme();
```

### 2. Configurar Path Aliases

En `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@intaqalab/theme": ["libs/shared/theme/src/index.scss"]
    }
  }
}
```

### 3. Configurar Build Tools

En `project.json` de la aplicación:

```json
{
  "targets": {
    "build": {
      "options": {
        "stylePreprocessorOptions": {
          "includePaths": ["libs/shared/theme/src"]
        }
      }
    }
  }
}
```

## 🎯 Uso en Componentes

### Angular Material Components

```typescript
import { MatButtonModule } from '@angular/material/button';

@Component({
  imports: [MatButtonModule],
  template: `
    <!-- Botón con tema personalizado -->
    <button mat-flat-button>Botón Material</button>

    <!-- Botón outlined -->
    <button mat-stroked-button>Botón Outlined</button>
  `,
})
export class MyComponent {}
```

### Tailwind CSS Classes

```typescript
@Component({
  template: `
    <!-- Usando clases de Tailwind extendidas -->
    <div class="bg-client-surface text-client-primary p-4 rounded-client-radius-md">
      Contenido con colores del cliente
    </div>
  `,
})
export class MyComponent {}
```

### CSS Custom Properties

```scss
.my-component {
  background-color: var(--inta-surface);
  color: var(--inta-primary);
  border-radius: var(--inta-radius-md);
  font-family: var(--inta-font-primary);
}
```

## 🎨 Clases CSS Personalizadas

### Botones

```html
<!-- Botón primario personalizado -->
<button class="btn-client-primary">Acción Principal</button>

<!-- Botón secundario -->
<button class="btn-client-secondary">Acción Secundaria</button>

<!-- Botón de texto -->
<button class="btn-client-text">Acción de Texto</button>

<!-- Botón tonal -->
<button class="btn-client-tonal">Acción Tonal</button>

<!-- Botón elevado -->
<button class="btn-client-elevated">Acción Elevada</button>
```

### Angular Material Buttons

```typescript
import { MatButtonModule } from '@angular/material/button';
import {
  MatElevatedButtonDirective,
  MatFilledButtonDirective,
  MatOutlinedButtonDirective,
  MatTonalButtonDirective,
} from '@intaqalab/theme';

@Component({
  imports: [
    MatButtonModule,
    MatFilledButtonDirective,
    MatElevatedButtonDirective,
    MatOutlinedButtonDirective,
    MatTonalButtonDirective,
  ],
  template: `
    <!-- 🎯 Nuevas directivas intuitivas -->
    <button mat-filled-button>Filled Button</button>
    <button mat-elevated-button>Elevated Button</button>
    <button mat-outlined-button>Outlined Button</button>
    <button mat-tonal-button>Tonal Button</button>

    <!-- ✅ Sintaxis antigua (todavía funciona) -->
    <button matButton>Text</button>
    <button matButton="outlined">Outlined</button>
    <button matButton="filled">Filled</button>
    <button matButton="tonal">Tonal</button>
    <button matButton="elevated">Elevated</button>
    <button mat-flat-button>Flat (legacy)</button>

    <!-- Botones de icono -->
    <button matIconButton><mat-icon>home</mat-icon></button>

    <!-- FAB buttons -->
    <button matFab><mat-icon>add</mat-icon></button>
    <button matMiniFab><mat-icon>edit</mat-icon></button>
    <button matFab extended>
      <mat-icon>add</mat-icon>
      Extended
    </button>
  `,
})
export class MyComponent {}
```

### Cards

```html
<div class="card-client">
  <h3 class="card-client-title">Título de Card</h3>
  <p class="card-client-content">Contenido del card</p>
</div>
```

### Formularios

```html
<div class="form-client-group">
  <label class="form-client-label">Etiqueta</label>
  <input type="text" class="form-client-input" />
</div>
```

## ⚙️ Configuración de Tailwind

### Extensiones Disponibles

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Colores del cliente
        'client-primary': 'var(--inta-primary)',
        'client-secondary': 'var(--inta-secondary)',
        'client-button': 'var(--inta-button)', // Variable CSS para botones
        'client-button-hover': 'var(--inta-button-hover)', // Variable CSS para hover

        // Escala completa
        'client-neutral': {
          50: 'var(--inta-neutral-50)',
          100: 'var(--inta-neutral-100),
          // ... hasta 900
        }
      },
      fontFamily: {
        'client-primary': 'var(--inta-font-primary)',
        'client-secondary': 'var(--inta-font-secondary)',
        'client-mono': 'var(--inta-font-mono)',
      },
      borderRadius: {
        'client-sm': 'var(--inta-radius-sm)',
        'client-md': 'var(--inta-radius-md)',
        'client-lg': 'var(--inta-radius-lg)',
      },
      boxShadow: {
        'client-sm': 'var(--inta-shadow-sm)',
        'client-md': 'var(--inta-shadow-md)',
        'client-lg': 'var(--inta-shadow-lg)',
      }
    }
  }
}
```

## 🌙 Tema Oscuro

### Automático (basado en preferencias del sistema)

```scss
// El tema responde automáticamente a prefers-color-scheme
@media (prefers-color-scheme: dark) {
  :root {
    --inta-surface: #1a1a1a;
    --inta-surface-variant: #262626;
    --inta-background: #0a0a0a;
  }
}
```

### Manual (con clase CSS)

```typescript
// Agregar clase al elemento raíz
document.documentElement.classList.add('dark-theme');
```

```html
<body class="dark-theme">
  <!-- Contenido con tema oscuro -->
</body>
```

## 📚 Ejemplos

### Componente Completo

```typescript
import { Component } from '@angular/core';
import { MatButtonModule, MatCardModule } from '@angular/material';

@Component({
  imports: [MatButtonModule, MatCardModule],
  template: `
    <mat-card class="card-client">
      <mat-card-header>
        <mat-card-title class="card-client-title">Ejemplo de Tema</mat-card-title>
      </mat-card-header>

      <mat-card-content class="card-client-content">
        <p class="text-client-primary">Este contenido usa los colores del cliente.</p>
      </mat-card-content>

      <mat-card-actions>
        <button mat-flat-button class="btn-client-primary">Acción Principal</button>
        <button mat-stroked-button class="btn-client-secondary">Acción Secundaria</button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [
    `
      :host {
        @apply bg-client-background p-4;
      }
    `,
  ],
})
export class ExampleComponent {}
```

### Estilos Personalizados

```scss
// En styles.scss del componente
.custom-element {
  background: linear-gradient(135deg, var(--inta-primary) 0%, var(--inta-secondary) 100%);
  color: white;
  padding: 1rem;
  border-radius: var(--inta-radius-lg);
  box-shadow: var(--inta-shadow-lg);
}
```

## 🤝 Contribución

### Modificar Colores del Cliente

1. Editar `src/lib/_variables.scss`
2. Actualizar las CSS custom properties
3. Verificar compatibilidad con tema oscuro

### Agregar Nuevas Clases CSS

1. Editar `src/lib/_utilities.scss`
2. Usar variables CSS existentes
3. Seguir convenciones de nomenclatura

### Actualizar Tailwind Config

1. Editar `tailwind.config.js`
2. Mapear nuevas variables CSS
3. Probar en componentes existentes

## 📋 Checklist de Verificación

- [ ] Tema se compila sin errores
- [ ] Colores se aplican correctamente en Material components
- [ ] Tailwind classes funcionan en templates
- [ ] Tema oscuro funciona (opcional)
- [ ] Componentes nuevos usan el sistema de temas
- [ ] Documentación está actualizada

## 🔗 Recursos Relacionados

- [Angular Material Theming](https://material.angular.io/guide/theming)
- [Tailwind CSS Customization](https://tailwindcss.com/docs/configuration)
- [Nx Workspace Configuration](https://nx.dev/concepts/workspace-configuration)

---

**Versión**: 1.0.0
**Angular**: 21+
**Nx**: 2025+
**Última actualización**: Diciembre 2025
