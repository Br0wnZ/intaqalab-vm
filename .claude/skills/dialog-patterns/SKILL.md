---
name: dialog-patterns
description: Implements Angular Material Dialog patterns for the Intaqalab project. USE WHEN creating confirmation dialogs, form dialogs, info modals, or any MatDialog-based component. Covers dialog component structure, data injection, result typing, and opener pattern.
---

# Material Dialog Patterns — Intaqalab Standard

Canonical pattern for all project dialogs based on `@angular/material/dialog` + Angular 21 Signal Architecture.

## Dialog Component Structure

```typescript
// libs/domain/<domain>/feature-<name>/src/lib/dialogs/<action>-dialog.ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

// 1. Explicit input data typing
export type ConfirmDeleteDialogData = {
  entityName: string;
  entityId: string;
};

// 2. Explicit result typing (discriminated union)
export type ConfirmDeleteDialogResult = { action: 'confirm'; id: string } | { action: 'cancel' };

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
      <button mat-flat-button aria-label="Confirm deletion" class="bg-client-error text-white" (click)="confirm()">
        {{ 'COMMONS.DELETE_DATA' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: ``,
})
export class ConfirmDeleteDialogComponent {
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

## Opener Component Pattern

```typescript
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import {
  ConfirmDeleteDialogComponent,
  ConfirmDeleteDialogData,
  ConfirmDeleteDialogResult,
} from './dialogs/confirm-delete-dialog';

@Component({ ... })
export class EntityListComponent {
  readonly #dialog = inject(MatDialog);
  protected readonly store = inject(EntityStore);

  async openDeleteDialog(entity: Entity): Promise<void> {
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

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result?.action === 'confirm') {
      this.store.delete(result.id);
    }
  }
}
```

## Form Dialog Pattern

```typescript
export type CreateEntityDialogData = void;
export type CreateEntityDialogResult = { action: 'create'; dto: CreateEntityDto } | { action: 'cancel' };

@Component({
  selector: 'inta-create-entity-dialog',
  imports: [MatDialogModule, MatButtonModule, SaveButton /* Signal Forms */],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ 'DOMAIN.DIALOGS.CREATE.TITLE' | translate }}</h2>

    <mat-dialog-content>
      <mat-form-field floatLabel="always" class="w-full">
        <mat-label>{{ 'DOMAIN.FIELDS.NAME' | translate }}</mat-label>
        <input matInput [placeholder]="'DOMAIN.FIELDS.NAME_PLACEHOLDER' | translate" [formField]="form.controls.name" />
      </mat-form-field>
    </mat-dialog-content>

    <mat-dialog-actions class="justify-end gap-2">
      <button mat-stroked-button [mat-dialog-close]="{ action: 'cancel' }">
        {{ 'COMMONS.CANCEL' | translate }}
      </button>
      <ui-save-button label="COMMONS.CREATE" [isSaving]="isSubmitting()" (save)="submit()" />
    </mat-dialog-actions>
  `,
})
export class CreateEntityDialogComponent {
  readonly #dialogRef = inject(MatDialogRef<CreateEntityDialogComponent>);
  protected readonly form = form({
    name: control('', { validators: [Validators.required] }),
  });

  submit(): void {
    if (this.form.invalid()) return;
    this.#dialogRef.close({ action: 'create', dto: this.form.value() });
  }
}
```

## Rules Summary

- `#dialogRef` always native private field (`#`).
- `data` injected via `inject<T>(MAT_DIALOG_DATA)` with explicit typing.
- Result is ALWAYS a discriminated union (`{ action: 'confirm' | 'cancel', ... }`).
- For form save/create actions, ALWAYS use `<ui-save-button>` (`SaveButton` from `@intaqalab/ui`).
- Never use TypeScript `private` keyword; use `#` for private members and `protected` for template-bound properties.
