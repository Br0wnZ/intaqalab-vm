---
name: dialog-patterns
description: Implements Angular Material Dialog patterns for the Intaqalab project. USE WHEN creating confirmation dialogs, form dialogs, info modals, or any MatDialog-based component. Covers dialog component structure, data injection, result typing, and opener pattern.
---

# Material Dialog Patterns — Intaqalab Standard

Patrón canónico para todos los diálogos del proyecto basado en `@angular/material/dialog` + Angular 21 Signal Architecture.

## Estructura de un Dialog Component

```typescript
// libs/domain/<domain>/feature-<name>/src/lib/dialogs/<action>-dialog.ts
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

// 1. Tipado explícito de los datos de entrada
export type ConfirmDeleteDialogData = {
  entityName: string;
  entityId: string;
};

// 2. Tipado explícito del resultado
export type ConfirmDeleteDialogResult =
  | { action: 'confirm'; id: string }
  | { action: 'cancel' };

@Component({
  selector: 'inta-confirm-delete-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Header -->
    <h2 mat-dialog-title class="flex items-center gap-2 text-lg font-semibold m-0">
      <mat-icon class="text-client-error">delete_forever</mat-icon>
      {{ 'DOMAIN.DIALOGS.CONFIRM_DELETE.TITLE' | translate }}
    </h2>

    <!-- Content -->
    <mat-dialog-content class="flex flex-col gap-3 !px-0">
      <p class="text-sm text-gray-600 m-0">
        {{ 'DOMAIN.DIALOGS.CONFIRM_DELETE.MESSAGE' | translate }}
        <strong>{{ data.entityName }}</strong>
      </p>
    </mat-dialog-content>

    <!-- Actions -->
    <mat-dialog-actions class="flex gap-2 !px-0 justify-end">
      <button mat-stroked-button [mat-dialog-close]="{ action: 'cancel' }">
        {{ 'COMMONS.CANCEL' | translate }}
      </button>
      <button
        mat-flat-button
        class="bg-client-error text-white"
        aria-label="Confirmar eliminación"
        (click)="confirm()"
      >
        {{ 'COMMONS.DELETE_DATA' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: ``,
})
export class ConfirmDeleteDialogComponent {
  // Inyección con campo privado nativo
  readonly #dialogRef = inject(MatDialogRef<ConfirmDeleteDialogComponent>);
  protected readonly data = inject<ConfirmDeleteDialogData>(MAT_DIALOG_DATA);

  confirm(): void {
    const result: ConfirmDeleteDialogResult = {
      action: 'confirm',
      id: this.data.entityId,
    };
    this.#dialogRef.close(result);
  }
}
```

## Patrón del Componente que Abre el Dialog

```typescript
// En el componente/feature que lanza el dialog
import { MatDialog } from '@angular/material/dialog';
import {
  ConfirmDeleteDialogComponent,
  ConfirmDeleteDialogData,
  ConfirmDeleteDialogResult,
} from './dialogs/confirm-delete-dialog';

@Component({ ... })
export class EntityListComponent {
  readonly #dialog = inject(MatDialog);
  protected readonly store = inject(EntityStore);

  openDeleteDialog(entity: Entity): void {
    const data: ConfirmDeleteDialogData = {
      entityName: entity.name,
      entityId: entity.id,
    };

    const dialogRef = this.#dialog.open<
      ConfirmDeleteDialogComponent,
      ConfirmDeleteDialogData,
      ConfirmDeleteDialogResult
    >(ConfirmDeleteDialogComponent, {
      width: '420px',
      data,
    });

    // afterClosed devuelve undefined si se cierra con Escape/backdrop
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.action === 'confirm') {
        this.store.delete(result.id);
      }
    });
  }
}
```

## Variante: Dialog con Formulario

```typescript
export type CreateEntityDialogData = void; // sin datos de entrada
export type CreateEntityDialogResult = { action: 'create'; dto: CreateEntityDto } | { action: 'cancel' };

@Component({
  selector: 'inta-create-entity-dialog',
  imports: [MatDialogModule, MatButtonModule, ReactiveFormsModule, /* Signal Forms */],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ 'DOMAIN.DIALOGS.CREATE.TITLE' | translate }}</h2>

    <mat-dialog-content>
      <!-- Signal Form fields -->
      <mat-form-field class="w-full" floatLabel="always">
        <mat-label>{{ 'DOMAIN.FIELDS.NAME' | translate }}</mat-label>
        <input matInput [formControl]="form.controls.name" />
        @if (form.controls.name.errors?.['required']) {
          <mat-error>{{ 'COMMONS.REQUIRED_FIELD' | translate }}</mat-error>
        }
      </mat-form-field>
    </mat-dialog-content>

    <mat-dialog-actions class="justify-end gap-2">
      <button mat-stroked-button [mat-dialog-close]="{ action: 'cancel' }">
        {{ 'COMMONS.CANCEL' | translate }}
      </button>
      <button mat-flat-button color="primary" [disabled]="form.invalid()" (click)="submit()">
        {{ 'COMMONS.CREATE' | translate }}
      </button>
    </mat-dialog-actions>
  `,
})
export class CreateEntityDialogComponent {
  readonly #dialogRef = inject(MatDialogRef<CreateEntityDialogComponent>);

  // Signal Form
  protected readonly form = group({
    name: control('', { validators: [Validators.required] }),
  });

  submit(): void {
    if (this.form.invalid()) return;
    this.#dialogRef.close({ action: 'create', dto: this.form.value() });
  }
}
```

## Configuraciones de `MatDialog.open()`

```typescript
this.#dialog.open(MyDialogComponent, {
  width: '420px',       // Confirmaciones simples
  width: '600px',       // Formularios medianos
  width: '800px',       // Formularios complejos / tablas
  maxWidth: '95vw',     // Siempre para responsividad mobile
  disableClose: true,   // Cuando hay formulario con datos (evita pérdida accidental)
  data: { ... },        // Tipado con el type de datos
  panelClass: 'inta-dialog', // Clase global si necesitas estilos custom
});
```

## Reglas

- `#dialogRef` siempre privado nativo (`#`).
- `data` inyectado con `inject<T>(MAT_DIALOG_DATA)` — tipado explícito.
- El resultado SIEMPRE es un tipo union con `action` discriminante (`'confirm' | 'cancel'`).
- `afterClosed().subscribe()` siempre valida `result?.action` antes de actuar.
- `mat-dialog-close` en el botón cancelar (shorthand sin lógica).
- `(click)="confirm()"` en el botón de acción principal (lógica en el método).
- NUNCA uses `private` — usa `#` para privado y `protected` para lo expuesto al template.
