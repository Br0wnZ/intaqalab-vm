---
name: view-state-pattern
description: Standardizes the 3-State View Pattern (Loading with ui-skeleton/ui-skeleton-card, Error with i18n, Success with real components). USE WHEN creating or modifying any feature view, shell component, or page that loads remote data.
user-invocable: true
---

# 🖼️ Patrón Obligatorio de 3 Estados de Vista (View State Pattern)

Todas las vistas y componentes de pantalla en Intaqalab que consuman datos asíncronos o remotos (a través de SignalStore u `httpResource`) **DEBEN** estructurarse utilizando obligatoriamente los 3 estados en la plantilla.

---

## 📐 Estructura Canónica de la Plantilla

```html
@if (store.isLoading()) {
  <!-- ===================================================================== -->
  <!-- ESTADO 1: LOADING (Skeletons replicando la disposición de la vista)    -->
  <!-- ===================================================================== -->
  <div class="flex flex-col gap-6 p-6">
    <!-- Cabecera Skeleton -->
    <div class="flex items-center justify-between">
      <ui-skeleton variant="text" width="240px" height="2rem" />
      <ui-skeleton variant="button" width="120px" />
    </div>

    <!-- Filtros Skeleton -->
    <div class="flex gap-4">
      <ui-skeleton variant="rectangle" width="200px" height="40px" />
      <ui-skeleton variant="rectangle" width="150px" height="40px" />
    </div>

    <!-- Grid / Lista Skeleton -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      @for (i of [1, 2, 3, 4, 5, 6]; track i) {
        <ui-skeleton-card animation="wave" />
      }
    </div>
  </div>

} @else if (store.error()) {
  <!-- ===================================================================== -->
  <!-- ESTADO 2: ERROR (Mensaje traducido accesible)                        -->
  <!-- ===================================================================== -->
  <div class="flex flex-col items-center justify-center p-12 text-center gap-3">
    <mat-icon class="text-client-error !w-12 !h-12 !text-[48px]">error_outline</mat-icon>
    <p class="text-lg font-semibold text-slate-800">
      {{ 'ERRORS.LOADING_ERROR' | translate }}
    </p>
  </div>

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
      @for (item of store.items(); track item.id) {
        <inta-entity-card [item]="item" />
      }
    </div>
  </div>
}
```

---

## 🎯 Reglas de Implementación

1. **Imports Requeridos:**
   Importa `Skeleton`, `SkeletonCard` de `@intaqalab/ui` y `TranslateModule` de `@ngx-translate/core`.

2. **Réplica Estructural Pixel-Perfect:**
   El estado `Loading` debe imitar la disposición espacial de los componentes reales:
   - Usa `variant="text"` para títulos y etiquetas.
   - Usa `variant="button"` para botones de acción.
   - Usa `variant="circle"` para avatares o iconos circulares.
   - Usa `variant="rectangle"` (o `<ui-skeleton-card>`) para contenedores, tablas o tarjetas.

3. **Animación:**
   Usa `animation="wave"` (shimmer) para listados y vistas principales para dar mayor sensación de fluidez visual.

4. **Estado de Error:**
   Usa la clave i18n `'ERRORS.LOADING_ERROR'` (o `'ERRORS.GENERIC'`) con `@ngx-translate` para garantizar la localización en ES, EN y DE.
