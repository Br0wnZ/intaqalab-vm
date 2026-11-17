import { render, screen } from '@testing-library/angular';
import { vi } from 'vitest';

import { LoaderService } from '../../services/loader.service';
import { LoaderComponent } from './loader.component';

/** Matches the debounce delay in LoaderService */
const SHOW_DEBOUNCE_MS = 150;

describe('LoaderComponent', () => {
  let loaderService: LoaderService;

  const setup = async () => {
    const view = await render(LoaderComponent);
    loaderService = view.fixture.debugElement.injector.get(LoaderService);
    return view;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    loaderService?.reset();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should create the component', async () => {
    const { fixture } = await setup();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should not show loader when isLoading is false', async () => {
    await setup();
    expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
  });

  it('should show loader after the debounce delay', async () => {
    const { fixture } = await setup();
    loaderService.show();
    await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);
    fixture.detectChanges();

    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('should not show loader before the debounce delay elapses', async () => {
    const { fixture } = await setup();
    loaderService.show();
    await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS - 1);
    fixture.detectChanges();

    expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
  });

  it('should not show loader if hide() is called before debounce fires', async () => {
    const { fixture } = await setup();
    loaderService.show();
    loaderService.hide();
    await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);
    fixture.detectChanges();

    expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
  });

  it('should hide loader when isLoading changes from true to false', async () => {
    const { fixture } = await setup();
    loaderService.show();
    await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);
    fixture.detectChanges();
    expect(screen.getByTestId('loader')).toBeInTheDocument();

    loaderService.hide();
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();
    expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
  });

  it('should contain mat-spinner when loading', async () => {
    const { fixture } = await setup();
    loaderService.show();
    await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);
    fixture.detectChanges();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should have correct CSS classes when loading', async () => {
    const { fixture } = await setup();
    loaderService.show();
    await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);
    fixture.detectChanges();

    const loader = screen.getByTestId('loader');
    expect(loader).toHaveClass('loading');
    expect(loader).toContainHTML('class="spinner"');
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should remain visible until all show() calls are balanced by hide()', async () => {
    const { fixture } = await setup();
    loaderService.show();
    loaderService.show();
    await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);
    fixture.detectChanges();

    expect(screen.getByTestId('loader')).toBeInTheDocument();

    loaderService.hide();
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();
    expect(screen.getByTestId('loader')).toBeInTheDocument();

    loaderService.hide();
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();
    expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
  });

  it('should hide immediately when reset() is called regardless of active requests', async () => {
    const { fixture } = await setup();
    loaderService.show();
    loaderService.show();
    loaderService.show();
    await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);
    fixture.detectChanges();

    expect(screen.getByTestId('loader')).toBeInTheDocument();

    loaderService.reset();
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();

    expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
  });

  it('should show loader again after reset() followed by a new show()', async () => {
    const { fixture } = await setup();
    loaderService.show();
    loaderService.show();
    loaderService.reset();
    loaderService.show();
    await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);
    fixture.detectChanges();

    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });
});
