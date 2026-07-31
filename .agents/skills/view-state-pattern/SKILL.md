---
name: view-state-pattern
description: Standardizes the 3-State View Pattern (Loading with ui-skeleton, Error with i18n, Success with real components). Automatically scans attached UI images or component templates to generate pixel-perfect skeletons with zero extra prompt required. USE WHEN creating or modifying any feature view, shell component, dialog, or page that loads remote data, or when converting UI mockups/components into skeleton states.
user-invocable: true
---

# 🖼️ Patrón Obligatorio de 3 Estados de Vista & Auto-Generación de Skeleton (View State Pattern)

Esta skill automatiza la estructuración del **Patrón de 3 Estados** (`Loading`, `Error`, `Success`) en componentes y pantallas de Intaqalab.

> [!TIP]
> **Modo Ejecución Automática (Zero-Friction):**
> Para usar esta skill **solo necesitas adjuntar una imagen visual/mockup y/o hacer referencia al componente Angular** e invocar la skill. La skill detectará automáticamente los adjuntos/referencias y escaneará el diseño sin requerir indicaciones ni especificaciones adicionales en el prompt.

---

## ⚡ Flujo de Auto-Escaneo y Replicación Visual

Al invocar la skill, aplica automáticamente la estrategia según los insumos recibidos:

### 📷 Caso A: Imagen Adjuntada (+ Componente opcional)

1. **Análisis de Layout Visual:** Escanea la imagen adjuntada para identificar regiones espaciales: cabecera, barra de herramientas/filtros, cuadrícula de tarjetas, tabla de datos, indicadores/métricas, formularios o barras laterales.
2. **Mapeo a Primitivas UI Esqueleto:**
   - **Títulos/Subtítulos:** `<ui-skeleton variant="text" width="..." height="..." />`
   - **Botones:** `<ui-skeleton variant="button" width="..." />`
   - **Inputs/Selects/Filtros:** `<ui-skeleton variant="rectangle" width="..." height="..." />`
   - **Avatares/Badges/Iconos:** `<ui-skeleton variant="circle" width="..." height="..." />`
   - **Grids/Listas de Tarjetas:** `@for (i of (N | range); track i) { <ui-skeleton-card animation="wave" /> }`
   - **Tablas de Datos:** `<ui-skeleton-table [rows]="N" [columns]="M" />`
   - **Formularios:** `<ui-skeleton-form>` o distribución de rectángulos según disposición.
3. **Maquetación Tailwind 1:1:** Replica la composición espacial usando clases inline de Tailwind CSS (`flex`, `grid`, `gap-*`, `p-*`, `items-center`, `justify-between`) para igualar las proporciones exactas de la imagen.

### 📄 Caso B: Componente Referenciado (Sin Imagen)

1. **Escaneo de la Plantilla HTML:** Lee la plantilla HTML del componente (o el contenido del bloque normal/éxito) para extraer su jerarquía DOM exacta.
2. **Replicación Estructural Espejo:** Construye el bloque `@if (isLoading())` duplicando la misma estructura de contenedores y clases Tailwind CSS del estado normal, sustituyendo los elementos de datos e interacción por componentes `ui-skeleton`.
3. **Bucle de Iteración con Pipe:** Sustituye los bucles `@for (item of items(); track item.id)` del estado normal por `@for (i of (6 | range); track i)` en el estado `Loading` para renderizar tarjetas o filas skeleton repetidas.

### 🔀 Caso C: Imagen + Componente Existente

- Combina la estructura HTML/Tailwind real del componente con las proporciones y densidades observadas en la imagen para lograr un esqueleto `@if (isLoading())` pixel-perfect perfectamente integrado en la plantilla de 3 estados.

---

## 🚫 Regla de Inyección y Acceso a Store (Antipatrón Prohibido)

> [!CAUTION]
> **NUNCA acceder a la store en la plantilla HTML (`store.isLoading()`, `store.items()`, etc.).**
> La store siempre **DEBE** inyectarse como privada y readonly (`readonly #store = inject(MyStore);`) en la clase del componente.
> En la vista se accederá **ÚNICAMENTE** a través de señales computadas o getters expuestos por el componente.

```ts
export class MyFeatureShellComponent {
  readonly #store = inject(MyStore);

  readonly isLoading = computed(() => this.#store.isLoading());
  readonly error = computed(() => this.#store.error());
  readonly items = computed(() => this.#store.items());
}
```

---

## 📐 Estructura Canónica de la Plantilla (3-State Pattern)

```html
@if (isLoading()) {
<!-- ===================================================================== -->
<!-- ESTADO 1: LOADING (Skeletons auto-generados replicando la vista)      -->
<!-- ===================================================================== -->
<div class="flex flex-col gap-6 p-6">
  <!-- Cabecera Skeleton -->
  <div class="flex items-center justify-between">
    <ui-skeleton variant="text" width="240px" height="2rem" />
    <ui-skeleton variant="button" width="120px" />
  </div>

  <!-- Filtros / Búsqueda Skeleton -->
  <div class="flex gap-4">
    <ui-skeleton variant="rectangle" width="200px" height="40px" />
    <ui-skeleton variant="rectangle" width="150px" height="40px" />
  </div>

  <!-- Content Skeleton (Card Grid / Table / Form según Auto-Escaneo) -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    @for (i of (6 | range); track i) {
    <ui-skeleton-card animation="wave" />
    }
  </div>
</div>

} @else if (error()) {
<!-- ===================================================================== -->
<!-- ESTADO 2: ERROR (Componente ui-error-state con i18n traducido)       -->
<!-- ===================================================================== -->
<ui-error-state
  [title]="'<FEATURE>.ERRORS.LOAD_FAILED_TITLE' | translate"
  [message]="'<FEATURE>.ERRORS.LOAD_FAILED_DETAIL' | translate"
/>

} @else {
<!-- ===================================================================== -->
<!-- ESTADO 3: ÉXITO / NORMAL (Componentes reales con datos)              -->
<!-- ===================================================================== -->
<div class="flex flex-col gap-6 p-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">{{ title() }}</h1>
    <button mat-flat-button (click)="create()">Crear</button>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    @for (item of items(); track item.id) {
    <inta-entity-card [item]="item" />
    }
  </div>
</div>
}
```

---

## 🎯 Reglas de Implementación y Código

1. **Inyección Privada de Store:**
   Inyecta la store estrictamente como `readonly #store = inject(MyStore)`. Expón las señales a la vista mediante `computed(() => this.#store.property())`.

2. **Imports Automáticos en TS:**
   Importa los componentes de esqueleto (`Skeleton`, `SkeletonCard`, `SkeletonTable`, `SkeletonForm`) y el componente de estado de error (`ErrorState`) desde `@intaqalab/ui`.
   Importa `RangePipe` de `@intaqalab/utils` para iteraciones en plantilla.
   Importa `TranslateModule` de `@ngx-translate/core` para localización del estado de error.

3. **Réplica Estructural Pixel-Perfect:**
   - **Variantes `ui-skeleton`:** `text` (títulos/textos), `button` (acciones), `circle` (avatares/iconos), `rectangle` (inputs/cards/bloques).
   - **Componentes Dedicados:** `<ui-skeleton-table [rows]="N" [columns]="M" />` para tablas, `<ui-skeleton-form>` para formularios.
   - **Bucles de Skeletons:** Usar **siempre** `(n | range)` (`@for (i of (6 | range); track i)`). 🚫 Prohibido arrays literales como `[1,2,3]`.
   - **Animación:** Aplica `animation="wave"` en todos los componentes de esqueleto.

4. **Estado de Error y Claves i18n (Obligatorio):**
   - Usa **siempre** el componente `<ui-error-state>` (`ErrorState` de `@intaqalab/ui`).
   - Define o genera en los ficheros de i18n (`es.json`, `en.json`, `de.json`) las claves de traducción correspondientes al título y detalle/mensaje del error según la feature (ej: `<FEATURE>.ERRORS.LOAD_FAILED_TITLE` y `<FEATURE>.ERRORS.LOAD_FAILED_DETAIL`).
   - Ejemplo de claves i18n a sincronizar en los 3 locales:
     ```json
     "<FEATURE>": {
       "ERRORS": {
         "LOAD_FAILED_TITLE": "Error al cargar los datos",
         "LOAD_FAILED_DETAIL": "No se ha podido recuperar la información requerida. Intente de nuevo más tarde."
       }
     }
     ```
