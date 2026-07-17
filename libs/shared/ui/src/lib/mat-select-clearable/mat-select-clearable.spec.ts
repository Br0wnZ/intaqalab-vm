import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MatSelectClearable } from './mat-select-clearable';

@Component({
  template: `
    <mat-form-field>
      <mat-select clearable [formControl]="control">
        <mat-option value="one">One</mat-option>
        <mat-option value="two">Two</mat-option>
      </mat-select>
    </mat-form-field>
  `,
  imports: [MatFormFieldModule, MatSelectModule, ReactiveFormsModule, MatSelectClearable],
})
class TestComponent {
  control = new FormControl<string | null>(null);
}

describe('MatSelectClearable', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, TestComponent],
    }).compileComponents();
  });

  it('should not show clear button initially if the value is null', async () => {
    const fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const btn = fixture.nativeElement.querySelector('.mat-select-clear-btn');
    expect(btn).toBeNull();
  });

  it('should show the clear button when there is a selected value', async () => {
    const fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges(); // 1. Init component and directive
    await fixture.whenStable();

    fixture.componentInstance.control.setValue('one'); // 2. Set value
    fixture.detectChanges(); // 3. Process change
    await fixture.whenStable();

    const btn = fixture.nativeElement.querySelector('.mat-select-clear-btn');
    expect(btn).not.toBeNull();
  });

  it('should clear the value when the clear button is clicked', async () => {
    const fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.control.setValue('one');
    fixture.detectChanges();
    await fixture.whenStable();

    const btn = fixture.nativeElement.querySelector('.mat-select-clear-btn') as HTMLElement;
    expect(btn).not.toBeNull();

    btn.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.control.value).toBeNull();
    const btnAfter = fixture.nativeElement.querySelector('.mat-select-clear-btn');
    expect(btnAfter).toBeNull();
  });
});
