import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { RatingCriteria } from './rating-criteria';

const mockRatingCriteria = {
  v0c: { useful1Min: 101, useful1Max: 202, uselessMin: 303, uselessMax: 404 },
  v0cMean: { useful1Min: 111, useful1Max: 191, uselessMin: 211, uselessMax: 251 },
  v0cStdDev: { useful1Min: 12, useful1Max: 22, uselessMin: 32, uselessMax: 42 },
  p: { useful1Min: 53, useful1Max: 153, uselessMin: 253, uselessMax: 353 },
  pMean: { useful1Min: 64, useful1Max: 144, uselessMin: 244, uselessMax: 344 },
  projectile: { useful1Min: 7, useful1Max: 17, uselessMin: 27, uselessMax: 37 },
  fuse: { useful1Min: 8, useful1Max: 18, uselessMin: 28, uselessMax: 38 },
  primer: { useful1Min: 9, useful1Max: 19, uselessMin: 29, uselessMax: 39 },
};

@Component({
  template: `
    <inta-rating-criteria
      [readonly]="readonly"
      [(ratingCriteria)]="criteria"
      (ratingCriteriaChange)="onChange($event)"
    />
  `,
  imports: [RatingCriteria],
})
class TestHostComponent {
  criteria = mockRatingCriteria;
  readonly = false;
  onChange = vi.fn();
}

const setup = async (ratingCriteria = mockRatingCriteria, readonly = false) => {
  const user = userEvent.setup();
  const view = await render(TestHostComponent, {
    componentProperties: {
      criteria: ratingCriteria,
      readonly,
    },
    imports: [TranslateModule.forRoot()],
    providers: [provideHttpClient(), provideHttpClientTesting(), provideAnimationsAsync(), provideTestingEnvironment()],
  });
  const hostInstance = view.fixture.componentInstance;
  return { view, user, ratingCriteriaChangeSpy: hostInstance.onChange, hostInstance };
};

describe('RatingCriteria', () => {
  it('should render title and headers', async () => {
    await setup();
    expect(screen.getByText('TRIAL_PLANNING.RATING_CRITERIA.TITLE')).toBeInTheDocument();
    expect(screen.getByText('TRIAL_PLANNING.RATING_CRITERIA.COLUMNS.PROPERTY')).toBeInTheDocument();
  });

  it('should display initial speed and pressure values in inputs', async () => {
    await setup();
    const v0cMinInput = screen.getByRole('textbox', { name: 'v0c-useful1Min' }) as HTMLInputElement;
    expect(parseFloat(v0cMinInput.value.replace(',', '.'))).toBeCloseTo(101, 1);

    const v0cMaxInput = screen.getByRole('textbox', { name: 'v0c-useful1Max' }) as HTMLInputElement;
    expect(parseFloat(v0cMaxInput.value.replace(',', '.'))).toBeCloseTo(202, 1);

    const pMinInput = screen.getByRole('textbox', { name: 'p-useful1Min' }) as HTMLInputElement;
    expect(parseFloat(pMinInput.value.replace(',', '.'))).toBeCloseTo(53, 1);
  });

  it('should disable all inputs when readonly is true', async () => {
    await setup(mockRatingCriteria, true);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
    inputs.forEach((input) => {
      expect(input).toBeDisabled();
    });
  });

  it('should convert speed values when ft/s is selected', async () => {
    const { user } = await setup();

    const velocitySelect = screen.getByRole('combobox', { name: /TRIAL_PLANNING.RATING_CRITERIA.VELOCITY_LABEL/i });
    await user.click(velocitySelect);
    const optionFts = await screen.findByText('ft/s');
    await user.click(optionFts);

    const v0cMinInput = screen.getByRole('textbox', { name: 'v0c-useful1Min' }) as HTMLInputElement;
    expect(parseFloat(v0cMinInput.value.replace(',', '.'))).toBeCloseTo(101 * 3.28084, 1);
  });

  it('should convert pressure values when MPa is selected', async () => {
    const { user } = await setup();

    const pressureSelect = screen.getByRole('combobox', { name: /TRIAL_PLANNING.RATING_CRITERIA.PRESSURE_LABEL/i });
    await user.click(pressureSelect);
    const optionMpa = await screen.findByText('MPa');
    await user.click(optionMpa);

    const pMinInput = screen.getByRole('textbox', { name: 'p-useful1Min' }) as HTMLInputElement;
    expect(parseFloat(pMinInput.value.replace(',', '.'))).toBeCloseTo(5.3, 1);
  });
});
