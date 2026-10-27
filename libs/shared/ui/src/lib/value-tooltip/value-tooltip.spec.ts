import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatSelectHarness } from '@angular/material/select/testing';
import type { TooltipPosition } from '@angular/material/tooltip';
import { MatTooltip } from '@angular/material/tooltip';
import { MatTooltipHarness } from '@angular/material/tooltip/testing';
import { By } from '@angular/platform-browser';
import { provideTestingEnvironment } from '@intaqalab/config';
import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { ValueTooltip } from './value-tooltip';

@Component({
  imports: [MatFormFieldModule, MatInputModule, MatSelectModule, ValueTooltip],
  template: `
    <mat-form-field
      uiValueTooltip
      subscriptSizing="dynamic"
      [uiValueTooltipValue]="tooltipValue()"
      [uiValueTooltipPosition]="position()"
    >
      <mat-label>Weapon</mat-label>
      <mat-select [value]="selected()">
        <mat-option value="weapon">Weapon 120 mm</mat-option>
        <mat-option value="tube">Tube 22</mat-option>
      </mat-select>
    </mat-form-field>
    <input uiValueTooltip aria-label="Weapon input" [value]="inputValue()" />
    <mat-form-field uiValueTooltip subscriptSizing="dynamic">
      <mat-label>Specimen</mat-label>
      <input matInput readonly [value]="inputValue()" />
    </mat-form-field>
    <mat-form-field uiValueTooltip subscriptSizing="dynamic">
      <mat-label>Multiple weapons</mat-label>
      <mat-select multiple [value]="multiple()">
        <mat-option value="weapon">Weapon 120 mm</mat-option>
        <mat-option value="tube">Tube 22</mat-option>
      </mat-select>
    </mat-form-field>
    <div
      uiValueTooltip
      uiValueTooltipPosition="above"
      [uiValueTooltipValue]="observations()"
      [uiValueTooltipAnchor]="anchor()"
    >
      <span>{{ observations() }}</span>
    </div>
  `,
})
class TooltipHost {
  readonly selected = signal<string | null>('weapon');
  readonly position = signal<TooltipPosition | 'auto'>('auto');
  readonly anchor = signal<'host' | 'text'>('host');
  readonly tooltipValue = signal<string | undefined>(undefined);
  readonly observations = signal<string | null>('Full observations for this component');
  readonly inputValue = signal('Mortar 120 mm');
  readonly multiple = signal(['weapon', 'tube']);
}

@Component({
  imports: [MatFormFieldModule, MatSelectModule, FormField, ValueTooltip],
  template: `
    <mat-form-field uiValueTooltip>
      <mat-label>Weapon</mat-label>
      <mat-select [formField]="fields.weapon">
        @for (option of options(); track option.value) {
          <mat-option [value]="option.value">{{ option.label }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
})
class SignalFormTooltipHost {
  readonly value = signal({ weapon: 'weapon' });
  readonly fields = form(this.value);
  readonly options = signal([{ value: 'weapon', label: 'Weapon 120 mm' }]);
}

@Component({
  imports: [MatFormFieldModule, MatSelectModule, ValueTooltip],
  template: `
    <mat-form-field>
      <mat-label>Weapon catalog</mat-label>
      <mat-select value="weapon">
        <input uiValueTooltip aria-label="Search weapons" value="Search text" />
        <mat-option value="weapon">Weapon 120 mm</mat-option>
      </mat-select>
    </mat-form-field>
  `,
})
class NestedInputHost {}

@Component({
  imports: [ValueTooltip],
  template: `
    @for (label of labels; track $index) {
      <span uiValueTooltip uiValueTooltipPosition="right" uiValueTooltipAnchor="text" [uiValueTooltipValue]="label">
        {{ label }}
      </span>
    }
  `,
})
class RepeatedTextHost {
  readonly labels = ['Serie 1', 'Serie 2', 'Serie 2'];
}

describe('ValueTooltip', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  async function setup(initial: Partial<TooltipHost> = {}) {
    const view = await render(TooltipHost, { providers: [provideTestingEnvironment()], componentProperties: initial });
    const loader = TestbedHarnessEnvironment.loader(view.fixture);
    const tooltips = await loader.getAllHarnesses(MatTooltipHarness);
    return { view, tooltips, user: userEvent.setup() };
  }

  function tooltipAt(tooltips: MatTooltipHarness[], index: number): MatTooltipHarness {
    const tooltip = tooltips[index];
    if (!tooltip) throw new Error(`Missing tooltip at index ${index}`);
    return tooltip;
  }

  it('should show selected value on hover', async () => {
    const { tooltips } = await setup();
    const tooltip = tooltipAt(tooltips, 0);
    await tooltip.show();
    expect(await tooltip.getTooltipText()).toBe('Weapon 120 mm');
  });

  it('should initialize the tooltip after Signal Forms applies the selected value', async () => {
    const view = await render(SignalFormTooltipHost, { providers: [provideTestingEnvironment()] });
    const loader = TestbedHarnessEnvironment.loader(view.fixture);
    const selects = await loader.getAllHarnesses(MatSelectHarness);
    const select = selects[0];
    if (!select) throw new Error('Missing select');
    expect(await select.getValueText()).toBe('Weapon 120 mm');

    const tooltips = await loader.getAllHarnesses(MatTooltipHarness);
    const tooltip = tooltipAt(tooltips, 0);
    await tooltip.show();
    expect(await tooltip.getTooltipText()).toBe('Weapon 120 mm');
  });

  it('should show input value on hover', async () => {
    const { tooltips } = await setup();
    const tooltip = tooltipAt(tooltips, 1);
    await tooltip.show();
    expect(await tooltip.getTooltipText()).toBe('Mortar 120 mm');
  });

  it('should show explicit text on a non-control element', async () => {
    const { tooltips } = await setup();
    const tooltip = tooltipAt(tooltips, 4);
    await tooltip.show();
    expect(await tooltip.getTooltipText()).toBe('Full observations for this component');
  });

  it('should retain the initial text while the tooltip is visible', async () => {
    const { view, tooltips } = await setup();
    const tooltip = tooltipAt(tooltips, 4);
    await tooltip.show();
    view.fixture.componentInstance.observations.set('Updated observations');
    view.fixture.detectChanges();
    expect(await tooltip.getTooltipText()).toBe('Full observations for this component');
  });

  it('should apply text layout classes only when requested and remove them when disabled', async () => {
    const { view, tooltips } = await setup();
    const host = screen.getByText('Full observations for this component', { selector: 'span' });
    const tooltipHost = view.fixture.debugElement.queryAll(By.directive(ValueTooltip))[4];
    if (!tooltipHost) throw new Error('Missing text tooltip');
    const element: HTMLElement = tooltipHost.nativeElement;
    expect(element).not.toHaveClass('w-fit');

    view.fixture.componentInstance.anchor.set('text');
    view.fixture.detectChanges();
    expect(element).toHaveClass('block', 'w-fit', 'max-w-full', 'min-w-0', 'truncate');
    expect(host).toHaveTextContent('Full observations for this component');

    await tooltipAt(tooltips, 4).show();
    expect(await tooltipAt(tooltips, 4).getTooltipText()).toBe('Full observations for this component');
    view.fixture.componentInstance.anchor.set('host');
    view.fixture.detectChanges();
    expect(element).not.toHaveClass('block');
    expect(element).not.toHaveClass('w-fit');
    expect(element).not.toHaveClass('max-w-full');
    expect(element).not.toHaveClass('min-w-0');
    expect(element).not.toHaveClass('truncate');
  });

  it('should fit each host and reopen tooltips when alternating identical labels', async () => {
    const view = await render(RepeatedTextHost, { providers: [provideTestingEnvironment()] });
    for (const element of screen.getAllByText('Serie 2', { selector: 'span' })) {
      expect(element).toHaveClass('block', 'w-fit', 'max-w-full', 'min-w-0', 'truncate');
    }
    const loader = TestbedHarnessEnvironment.loader(view.fixture);
    const tooltips = await loader.getAllHarnesses(MatTooltipHarness);

    for (const index of [1, 2, 1, 2]) {
      const harness = tooltipAt(tooltips, index);
      await harness.show();
      expect(await harness.getTooltipText()).toBe('Serie 2');
      await harness.hide();
      await expect.poll(() => harness.isOpen()).toBe(false);
    }
  });

  it.each(['', '  ', null])('should not show explicit observations when the value is %s', async (value) => {
    const { tooltips } = await setup({ observations: signal<string | null>(value) });
    const tooltip = tooltipAt(tooltips, 4);
    await tooltip.show();
    expect(await tooltip.isOpen()).toBe(false);
  });

  it('should retain the initial explicit text when the value is later omitted', async () => {
    const { view, tooltips } = await setup({ tooltipValue: signal<string | undefined>('Explicit weapon description') });
    const tooltip = tooltipAt(tooltips, 0);
    await tooltip.show();
    expect(await tooltip.getTooltipText()).toBe('Explicit weapon description');

    view.fixture.componentInstance.tooltipValue.set(undefined);
    view.fixture.detectChanges();
    expect(await tooltip.getTooltipText()).toBe('Explicit weapon description');
  });

  it('should not read control values on idle renders', async () => {
    const { view } = await setup();
    const host = view.fixture.debugElement.query(By.directive(ValueTooltip));
    const select = host.query(By.directive(MatSelect)).injector.get(MatSelect);
    const readValue = vi.spyOn(select, 'triggerValue', 'get');
    const tooltip = host.injector.get(MatTooltip);

    view.fixture.detectChanges();

    expect(readValue).not.toHaveBeenCalled();

    view.fixture.componentInstance.selected.set('tube');
    view.fixture.detectChanges();

    expect(tooltip.message).toBe('Weapon 120 mm');
  });

  it('should not read the control when an explicit value is provided', async () => {
    const { view, tooltips } = await setup({ tooltipValue: signal<string | undefined>('Explicit description') });
    const host = view.fixture.debugElement.query(By.directive(ValueTooltip));
    const select = host.query(By.directive(MatSelect)).injector.get(MatSelect);
    const readValue = vi.spyOn(select, 'triggerValue', 'get');

    await tooltipAt(tooltips, 0).show();

    expect(readValue).not.toHaveBeenCalled();
    expect(host.injector.get(MatTooltip).message).toBe('Explicit description');
  });

  it.each([
    { position: 'above', left: 0.45, top: 0.85 },
    { position: 'below', left: 0.45, top: 0.05 },
    { position: 'left', left: 0.85, top: 0.45 },
    { position: 'right', left: 0.05, top: 0.45 },
  ])('should choose $position when it has the most space on hover', async ({ position, left, top }) => {
    const { view } = await setup();
    const host = view.fixture.debugElement.query(By.directive(ValueTooltip));
    const tooltip = host.injector.get(MatTooltip);
    vi.spyOn(host.nativeElement, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(
        window.innerWidth * left,
        window.innerHeight * top,
        window.innerWidth * 0.1,
        window.innerHeight * 0.1,
      ),
    );

    fireEvent.mouseEnter(host.nativeElement);

    expect(tooltip.position).toBe(position);
  });

  it('should recalculate the position on each hover after the host moves', async () => {
    const { view } = await setup();
    const host = view.fixture.debugElement.query(By.directive(ValueTooltip));
    const tooltip = host.injector.get(MatTooltip);
    const measure = vi.spyOn(host.nativeElement, 'getBoundingClientRect');
    measure.mockReturnValue(new DOMRect(0, 0, window.innerWidth, 40));
    fireEvent.mouseEnter(host.nativeElement);
    expect(tooltip.position).toBe('below');

    measure.mockReturnValue(new DOMRect(0, window.innerHeight - 40, window.innerWidth, 40));
    fireEvent.mouseLeave(host.nativeElement);
    fireEvent.mouseEnter(host.nativeElement);
    expect(tooltip.position).toBe('above');
  });

  it('should not measure the host on each render', async () => {
    const { view } = await setup();
    const host = view.fixture.debugElement.query(By.directive(ValueTooltip));
    const measure = vi.spyOn(host.nativeElement, 'getBoundingClientRect');
    view.fixture.detectChanges();
    expect(measure).not.toHaveBeenCalled();
  });

  it.each(['above', 'below', 'left', 'right', 'before', 'after'] as const)(
    'should use the requested %s position on hover',
    async (position) => {
      const { view } = await setup();
      const host = view.fixture.debugElement.query(By.directive(ValueTooltip));
      const tooltip = host.injector.get(MatTooltip);
      view.fixture.componentInstance.position.set(position);
      view.fixture.detectChanges();

      fireEvent.mouseEnter(host.nativeElement);

      expect(tooltip.position).toBe(position);
    },
  );

  it('should retain the initial message across repeated hovers', async () => {
    const { view, tooltips } = await setup();
    const host = view.fixture.debugElement.query(By.directive(ValueTooltip));
    const tooltip = host.injector.get(MatTooltip);
    const harness = tooltipAt(tooltips, 0);
    await harness.show();
    await harness.hide();

    view.fixture.componentInstance.selected.set('tube');
    view.fixture.detectChanges();

    expect(tooltip.message).toBe('Weapon 120 mm');

    await harness.show();
    expect(await harness.getTooltipText()).toBe('Weapon 120 mm');
  });

  it('should cancel a delayed opening when the mouse leaves', async () => {
    const { view, tooltips } = await setup();
    const host = view.fixture.debugElement.query(By.directive(ValueTooltip));
    host.injector.get(MatTooltip).showDelay = 1000;
    vi.useFakeTimers();

    fireEvent.mouseEnter(host.nativeElement);
    fireEvent.mouseLeave(host.nativeElement);
    await vi.advanceTimersByTimeAsync(1000);
    vi.useRealTimers();

    expect(await tooltipAt(tooltips, 0).isOpen()).toBe(false);
  });

  it('should retain the initial message when the value becomes empty before a delayed opening', async () => {
    const { view, tooltips } = await setup();
    const host = view.fixture.debugElement.query(By.directive(ValueTooltip));
    host.injector.get(MatTooltip).showDelay = 1000;
    vi.useFakeTimers();

    fireEvent.mouseEnter(host.nativeElement);
    view.fixture.componentInstance.selected.set(null);
    view.fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(1000);
    vi.useRealTimers();

    expect(await tooltipAt(tooltips, 0).getTooltipText()).toBe('Weapon 120 mm');
  });

  it('should not read control values after destruction', async () => {
    const { view, tooltips } = await setup();
    const host = view.fixture.debugElement.query(By.directive(ValueTooltip));
    const select = host.query(By.directive(MatSelect)).injector.get(MatSelect);
    await tooltipAt(tooltips, 0).show();
    view.fixture.destroy();
    const readValue = vi.spyOn(select, 'triggerValue', 'get');

    TestBed.inject(ApplicationRef).tick();

    expect(readValue).not.toHaveBeenCalled();
  });

  it('should restore automatic space selection after removing the preferred position', async () => {
    const { view } = await setup();
    const host = view.fixture.debugElement.query(By.directive(ValueTooltip));
    const tooltip = host.injector.get(MatTooltip);
    vi.spyOn(host.nativeElement, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(0, window.innerHeight - 40, window.innerWidth, 40),
    );
    view.fixture.componentInstance.position.set('below');
    view.fixture.detectChanges();
    fireEvent.mouseEnter(host.nativeElement);
    expect(tooltip.position).toBe('below');

    view.fixture.componentInstance.position.set('auto');
    view.fixture.detectChanges();
    fireEvent.mouseLeave(host.nativeElement);
    fireEvent.mouseEnter(host.nativeElement);

    expect(tooltip.position).toBe('above');
  });

  it('should not show a tooltip when no option is selected', async () => {
    const { tooltips } = await setup({ selected: signal<string | null>(null) });
    const tooltip = tooltipAt(tooltips, 0);
    await tooltip.show();
    expect(await tooltip.isOpen()).toBe(false);
  });

  it('should capture the first nonempty selected value on hover and retain it afterwards', async () => {
    const { view, tooltips } = await setup({ selected: signal<string | null>(null) });
    const tooltip = tooltipAt(tooltips, 0);
    await tooltip.show();
    expect(await tooltip.isOpen()).toBe(false);

    view.fixture.componentInstance.selected.set('weapon');
    view.fixture.detectChanges();
    await view.fixture.whenStable();
    await tooltip.show();
    expect(await tooltip.getTooltipText()).toBe('Weapon 120 mm');
    await tooltip.hide();

    view.fixture.componentInstance.selected.set('tube');
    view.fixture.detectChanges();
    await tooltip.show();
    expect(await tooltip.getTooltipText()).toBe('Weapon 120 mm');
  });

  it('should capture the selected text on hover after Signal Forms options arrive', async () => {
    const options = signal([{ value: 'weapon', label: 'Weapon 120 mm' }]);
    const loadedOptions = options();
    options.set([]);
    const view = await render(SignalFormTooltipHost, {
      providers: [provideTestingEnvironment()],
      componentProperties: { options },
    });
    const loader = TestbedHarnessEnvironment.loader(view.fixture);
    const tooltips = await loader.getAllHarnesses(MatTooltipHarness);
    const tooltip = tooltipAt(tooltips, 0);
    await tooltip.show();
    expect(await tooltip.isOpen()).toBe(false);

    options.set(loadedOptions);
    view.fixture.detectChanges();
    const selects = await loader.getAllHarnesses(MatSelectHarness);
    const select = selects[0];
    if (!select) throw new Error('Missing select');
    expect(await select.getValueText()).toBe('Weapon 120 mm');

    await tooltip.show();
    expect(await tooltip.getTooltipText()).toBe('Weapon 120 mm');
  });

  it('should read a readonly input from the form field', async () => {
    const { tooltips } = await setup();
    const tooltip = tooltipAt(tooltips, 2);
    await tooltip.show();
    expect(await tooltip.getTooltipText()).toBe('Mortar 120 mm');
  });

  it('should attach the tooltip to the form field instead of its inner control', async () => {
    const { view } = await setup();
    const host = view.fixture.debugElement.query(By.directive(ValueTooltip));
    expect(host.nativeElement.tagName).toBe('MAT-FORM-FIELD');
    expect(host.injector.get(MatTooltip)).toBeDefined();
  });

  it('should show the readonly field tooltip on hover and hide it on leave', async () => {
    const { tooltips } = await setup();
    const tooltip = tooltipAt(tooltips, 2);
    await tooltip.show();
    expect(await tooltip.getTooltipText()).toBe('Mortar 120 mm');
    await tooltip.hide();
    await expect.poll(() => tooltip.isOpen()).toBe(false);
  });

  it('should use the nested input value instead of an ancestor select value', async () => {
    const view = await render(NestedInputHost, { providers: [provideTestingEnvironment()] });
    const loader = TestbedHarnessEnvironment.loader(view.fixture);
    const [select] = await loader.getAllHarnesses(MatSelectHarness);
    if (!select) throw new Error('Missing catalog select');
    await select.open();
    const overlays = TestbedHarnessEnvironment.documentRootLoader(view.fixture);
    const tooltips = await overlays.getAllHarnesses(MatTooltipHarness);
    const tooltip = tooltipAt(tooltips, 0);
    await tooltip.show();
    expect(await tooltip.getTooltipText()).toBe('Search text');
  });

  it('should preserve the full text of a long specimen summary', async () => {
    const summary = Array.from({ length: 30 }, (_, index) => `Specimen ${index + 1}`).join(', ');
    const { tooltips } = await setup({ inputValue: signal(summary) });
    const tooltip = tooltipAt(tooltips, 2);
    await tooltip.show();
    expect(await tooltip.getTooltipText()).toBe(summary);
  });

  it('should retain the initial message after programmatic input changes', async () => {
    const { view, tooltips } = await setup();
    const tooltip = tooltipAt(tooltips, 2);
    await tooltip.show();
    view.fixture.componentInstance.inputValue.set('Updated specimen');
    view.fixture.detectChanges();
    expect(await tooltip.getTooltipText()).toBe('Mortar 120 mm');
  });

  it('should retain the initial selected value before the first hover', async () => {
    const { view, tooltips } = await setup();
    view.fixture.componentInstance.selected.set('tube');
    view.fixture.detectChanges();
    const tooltip = tooltipAt(tooltips, 0);
    await tooltip.show();
    expect(await tooltip.getTooltipText()).toBe('Weapon 120 mm');
  });

  it('should show multiple selections in option order', async () => {
    const { tooltips } = await setup();
    const tooltip = tooltipAt(tooltips, 3);
    await tooltip.show();
    expect(await tooltip.getTooltipText()).toBe('Weapon 120 mm, Tube 22');
  });

  it('should retain the initial message when the input becomes empty', async () => {
    const { view, tooltips } = await setup();
    const tooltip = tooltipAt(tooltips, 1);
    await tooltip.show();
    view.fixture.componentInstance.inputValue.set('  ');
    view.fixture.detectChanges();
    expect(await tooltip.getTooltipText()).toBe('Mortar 120 mm');
    expect(await tooltip.isOpen()).toBe(true);
  });

  it('should trim the value without adding a label or separator', async () => {
    const { tooltips } = await setup({ inputValue: signal('  Mortar 120 mm  ') });
    const tooltip = tooltipAt(tooltips, 1);
    await tooltip.show();
    expect(await tooltip.getTooltipText()).toBe('Mortar 120 mm');
  });
});
