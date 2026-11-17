# Testing Fundamentals

This guide covers the fundamental principles and practices for writing unit tests in this repository, which uses Vitest as the test runner.

## Core Philosophy: Zoneless & Async-First

This project follows a modern, zoneless testing approach. State changes schedule updates asynchronously, and tests must account for this.

**Do NOT** use `fixture.detectChanges()` to manually trigger updates.
**ALWAYS** use the "Act, Wait, Assert" pattern:

1.  **Act:** Update state or perform an action (e.g., set a component input, click a button).
2.  **Wait:** Use `await fixture.whenStable()` to allow the framework to process the scheduled update and render the changes.
3.  **Assert:** Verify the outcome.

### Basic Test Structure Example (ATL + Zoneless Vitest)

```ts
import { render, screen } from '@testing-library/angular';

import { MyComponent } from './my.component';

describe('MyComponent', () => {
  it('should display the default title', async () => {
    await render(MyComponent);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Default Title');
  });

  it('should display a different title after a change', async () => {
    const { fixture } = await render(MyComponent);

    // ACT: Change the component's signal title property.
    fixture.componentInstance.title.set('New Test Title');

    // WAIT for the asynchronous zoneless update to complete.
    await fixture.whenStable();

    // ASSERT the DOM has been updated.
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('New Test Title');
  });
});
```

## TestBed, ATL `render()` and ComponentFixture

- **`render()` (Angular Testing Library):** The standard entry point for component specs in this workspace (`setupTestBed()` configures pure zoneless mode in `src/test-setup.ts`, with zero `zone.js`). Never call `render()` inside `beforeEach`.
- **`TestBed` & `TestBed.tick()`:** Use `TestBed.configureTestingModule({...})` for service/store specs and `TestBed.tick()` + `await Promise.resolve()` to flush `httpResource` effects without `fakeAsync`.
- **`ComponentFixture`**: Handle on the created component instance and its environment.
  - `fixture.componentInstance`: Access the component's class instance.
  - `fixture.debugElement`: Platform-agnostic Angular wrapper (`debugElement.query(By.css('...'))`) preferred over direct DOM `.querySelector()` (banned by `testing-library/no-node-access`).

## Simulated Timers (Pure Zoneless Vitest)

`zone.js`, `fakeAsync()`, and `tick()` are removed from the workspace. For debounced services or `setTimeout` flows, use Vitest fake timers:

```ts
vi.useFakeTimers();
service.triggerDebounce();
await vi.advanceTimersByTimeAsync(150);
vi.useRealTimers();
```
