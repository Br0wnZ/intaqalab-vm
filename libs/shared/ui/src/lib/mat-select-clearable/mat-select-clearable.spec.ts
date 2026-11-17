import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { MatSelectClearable } from './mat-select-clearable';

@Component({
  template: `
    <mat-form-field>
      <mat-label>Option</mat-label>
      <mat-select clearable [formField]="testForm">
        <mat-option value="one">One</mat-option>
        <mat-option value="two">Two</mat-option>
      </mat-select>
    </mat-form-field>
  `,
  imports: [MatFormFieldModule, MatSelectModule, FormField, MatSelectClearable],
})
class TestComponent {
  readonly value = signal<string | null>(null);
  readonly testForm = form(this.value);
}

describe('MatSelectClearable', () => {
  it('should not show clear button initially if the value is null', async () => {
    const { fixture } = await render(TestComponent);
    TestBed.tick();
    await fixture.whenStable();

    expect(screen.queryByRole('button', { name: 'Limpiar selección' })).not.toBeInTheDocument();
  });

  it('should show the clear button when there is a selected value', async () => {
    const { fixture } = await render(TestComponent);
    TestBed.tick();
    await fixture.whenStable();

    fixture.componentInstance.value.set('one');
    TestBed.tick();
    await fixture.whenStable();

    expect(screen.getByRole('button', { name: 'Limpiar selección' })).toBeInTheDocument();
  });

  it('should clear the value when the clear button is clicked', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(TestComponent);
    TestBed.tick();
    await fixture.whenStable();

    fixture.componentInstance.value.set('one');
    TestBed.tick();
    await fixture.whenStable();

    const clearBtn = screen.getByRole('button', { name: 'Limpiar selección' });
    await user.click(clearBtn);
    TestBed.tick();
    await fixture.whenStable();

    expect(fixture.componentInstance.value()).toBeNull();
    expect(screen.queryByRole('button', { name: 'Limpiar selección' })).not.toBeInTheDocument();
  });
});
