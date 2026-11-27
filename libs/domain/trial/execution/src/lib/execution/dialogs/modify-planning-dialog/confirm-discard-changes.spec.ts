import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideTestingEnvironment } from '@intaqalab/config';
import { provideTranslateService } from '@ngx-translate/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfirmDiscardChanges } from './confirm-discard-changes';

describe('ConfirmDiscardChanges', () => {
  let component: ConfirmDiscardChanges;
  let fixture: ComponentFixture<ConfirmDiscardChanges>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDiscardChanges],
      providers: [
        provideTestingEnvironment(),
        provideTranslateService(),
        { provide: MAT_DIALOG_DATA, useValue: { hasLocalChanges: true } },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDiscardChanges);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
