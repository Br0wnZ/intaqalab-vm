import { Component, signal } from '@angular/core';
import { FormField, FormRoot, form } from '@angular/forms/signals';
import { provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { SaveButton } from './save-button';

describe('SaveButton', () => {
  it('defaults to buttonType="button" and emits save on click', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    await render(SaveButton, {
      providers: [provideTranslateService()],
      componentInputs: { isSaving: false },
      on: { save: onSave },
    });

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');

    await user.click(button);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('sets type="submit" when buttonType="submit" and submits Signal Form with FormRoot', async () => {
    const user = userEvent.setup();
    const submittedValues: string[] = [];

    @Component({
      imports: [FormField, FormRoot, SaveButton],
      template: `
        <form [formRoot]="testForm">
          <input aria-label="Name" [formField]="testForm.name" />
          <ui-save-button buttonType="submit" [isSaving]="testForm().submitting()" />
        </form>
      `,
    })
    class SubmitFormHost {
      readonly model = signal({ name: 'test' });
      readonly testForm = form(this.model, {
        submission: {
          action: async (f) => {
            submittedValues.push(f().value().name);
          },
        },
      });
    }

    await render(SubmitFormHost, {
      providers: [provideTranslateService()],
    });

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');

    await user.click(button);
    expect(submittedValues).toEqual(['test']);

    const input = screen.getByRole('textbox', { name: 'Name' });
    await user.clear(input);
    await user.type(input, 'updated{Enter}');
    expect(submittedValues).toEqual(['test', 'updated']);
  });
});
