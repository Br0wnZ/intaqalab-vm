---
description: Reemplazo moderno del antiguo flujo /new-feature. Genera el comando Nx y el código base inicial para una Feature completa usando Angular 21 y Zoneless.
argument-hint: "Dominio: [nombre], Feature: [nombre], Tipo: [CRUD | Dashboard | Form]"
---

# Create Feature

Actúa como `@angular-architect` y `@nx-generator-expert`. Necesito crear una nueva librería de tipo "feature" dentro de un dominio específico.

## Contexto de la Tarea

${input:args}

## Instrucciones de Implementación

1.  **Comando Nx**
    - Proporciona el comando exacto usando `nx g @nx/angular:lib`.
    - Es MANDATORIO incluir: `--directory="libs/domain/[Dominio]/feature-[FeatureName]"` y `--tags="scope:[Dominio],type:feature"`.
    - No uses CommonModule.

2.  **Componente Shell (Container)**
    - Genera el código del componente principal (`[feature].ts` - sin sufijo `.component`).
    - Nombra la clase `[FeatureName]` (sin sufijo `Component`).
    - No es necesario especificar `standalone: true` (es el valor por defecto en Angular 21).
    - Añade `changeDetection: ChangeDetectionStrategy.OnPush`.
    - Inyecta el Store si aplica. Usa inyección con `#store = inject(...)`.
    - En el template usa el bloque `@if` y `@for`.
    - Para los estilos, usa Tailwind inline (`class="flex flex-col gap-4 p-4"`). NADA de SCSS estructural.

3.  **Configuración de Rutas (opcional)**
    - Muestra cómo integrar este componente en el archivo `[dominio].data.routes.ts`.

4.  **i18n**
    - Muestra un ejemplo de las claves a añadir en `es.json` y el uso del pipe `| translate` en el HTML.
