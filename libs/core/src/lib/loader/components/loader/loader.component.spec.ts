import type { ComponentFixture } from '@angular/core/testing';
import { fakeAsync, tick } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import { vi } from 'vitest';

import { LoaderService } from '../../services/loader.service';
import { LoaderComponent } from './loader.component';

/** Matches the debounce delay in LoaderService */
const SHOW_DEBOUNCE_MS = 150;

describe('LoaderComponent', () => {
  let fixture: ComponentFixture<LoaderComponent>;
  let loaderService: LoaderService;

  beforeEach(async () => {
    const rendered = await render(LoaderComponent);
    fixture = rendered.fixture;
    loaderService = fixture.debugElement.injector.get(LoaderService);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    loaderService.reset();
    vi.restoreAllMocks();
  });

  it('should create the component', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should not show loader when isLoading is false', () => {
    expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
  });

  it('should show loader after the debounce delay', fakeAsync(() => {
    loaderService.show();
    tick(SHOW_DEBOUNCE_MS);
    fixture.detectChanges();

    expect(screen.getByTestId('loader')).toBeInTheDocument();
  }));

  it('should not show loader before the debounce delay elapses', fakeAsync(() => {
    loaderService.show();
    tick(SHOW_DEBOUNCE_MS - 1);
    fixture.detectChanges();

    expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
  }));

  it('should not show loader if hide() is called before debounce fires', fakeAsync(() => {
    loaderService.show();
    loaderService.hide();
    tick(SHOW_DEBOUNCE_MS);
    fixture.detectChanges();

    expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
  }));

  it('should hide loader when isLoading changes from true to false', fakeAsync(() => {
    loaderService.show();
    tick(SHOW_DEBOUNCE_MS);
    fixture.detectChanges();
    expect(screen.getByTestId('loader')).toBeInTheDocument();

    loaderService.hide();
    tick();
    fixture.detectChanges();
    expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
  }));

  it('should contain mat-spinner when loading', fakeAsync(() => {
    loaderService.show();
    tick(SHOW_DEBOUNCE_MS);
    fixture.detectChanges();

    const loader = screen.getByTestId('loader');
    expect(loader.querySelector('mat-spinner')).toBeTruthy();
  }));

  it('should have correct CSS classes when loading', fakeAsync(() => {
    loaderService.show();
    tick(SHOW_DEBOUNCE_MS);
    fixture.detectChanges();

    const loader = screen.getByTestId('loader');
    expect(loader).toHaveClass('loading');
    expect(loader.querySelector('.spinner')).toBeTruthy();
  }));

  it('should remain visible until all show() calls are balanced by hide()', fakeAsync(() => {
    loaderService.show();
    loaderService.show();
    tick(SHOW_DEBOUNCE_MS);
    fixture.detectChanges();

    expect(screen.getByTestId('loader')).toBeInTheDocument();

    loaderService.hide();
    tick();
    fixture.detectChanges();
    expect(screen.getByTestId('loader')).toBeInTheDocument();

    loaderService.hide();
    tick();
    fixture.detectChanges();
    expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
  }));

  it('should hide immediately when reset() is called regardless of active requests', fakeAsync(() => {
    loaderService.show();
    loaderService.show();
    loaderService.show();
    tick(SHOW_DEBOUNCE_MS);
    fixture.detectChanges();

    expect(screen.getByTestId('loader')).toBeInTheDocument();

    loaderService.reset();
    tick();
    fixture.detectChanges();

    expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
  }));

  it('should show loader again after reset() followed by a new show()', fakeAsync(() => {
    loaderService.show();
    loaderService.show();
    loaderService.reset();
    loaderService.show();
    tick(SHOW_DEBOUNCE_MS);
    fixture.detectChanges();

    expect(screen.getByTestId('loader')).toBeInTheDocument();
  }));
});
