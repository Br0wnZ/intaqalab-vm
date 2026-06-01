import type { ComponentFixture } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { BooleanStatusBadge } from './boolean-status-badge.component';

describe('BooleanStatusBadge', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderComponent = async (isActive: boolean, customClass?: string) => {
    const componentInputs: Record<string, unknown> = { isActive };
    if (customClass !== undefined) {
      componentInputs['class'] = customClass;
    }

    return render(BooleanStatusBadge, {
      imports: [TranslateModule.forRoot()],
      componentInputs,
    });
  };

  describe('Active State', () => {
    let fixture: ComponentFixture<BooleanStatusBadge>;
    let component: BooleanStatusBadge;

    beforeEach(async () => {
      vi.clearAllMocks();
      const renderResult = await renderComponent(true);
      fixture = renderResult.fixture;
      component = fixture.componentInstance;
    });

    it('should render the component', () => {
      expect(component).toBeTruthy();
    });

    it('should display active status text', () => {
      expect(screen.getByText(/MASTER_DATA.STATUS.ACTIVE/i)).toBeInTheDocument();
    });

    it('should apply green styling when active', () => {
      const hostClasses = component.elementClass;
      expect(hostClasses).toContain('bg-green-100');
      expect(hostClasses).toContain('text-green-700');
      expect(hostClasses).toContain('border-green-200');
    });

    it('should not apply red styling when active', () => {
      const hostClasses = component.elementClass;
      expect(hostClasses).not.toContain('bg-red-100');
      expect(hostClasses).not.toContain('text-red-700');
    });

    it('should include base styling classes', () => {
      const hostClasses = component.elementClass;
      expect(hostClasses).toContain('inline-flex');
      expect(hostClasses).toContain('items-center');
      expect(hostClasses).toContain('rounded-full');
      expect(hostClasses).toContain('text-xs');
      expect(hostClasses).toContain('font-semibold');
    });
  });

  describe('Inactive State', () => {
    let fixture: ComponentFixture<BooleanStatusBadge>;
    let component: BooleanStatusBadge;

    beforeEach(async () => {
      vi.clearAllMocks();
      const renderResult = await renderComponent(false);
      fixture = renderResult.fixture;
      component = fixture.componentInstance;
    });

    it('should display inactive status text', () => {
      expect(screen.getByText(/MASTER_DATA.STATUS.INACTIVE/i)).toBeInTheDocument();
    });

    it('should apply red styling when inactive', () => {
      const hostClasses = component.elementClass;
      expect(hostClasses).toContain('bg-red-100');
      expect(hostClasses).toContain('text-red-700');
      expect(hostClasses).toContain('border-red-200');
    });

    it('should not apply green styling when inactive', () => {
      const hostClasses = component.elementClass;
      expect(hostClasses).not.toContain('bg-green-100');
      expect(hostClasses).not.toContain('text-green-700');
    });
  });

  describe('Custom Class', () => {
    let component: BooleanStatusBadge;

    beforeEach(async () => {
      vi.clearAllMocks();
      const renderResult = await renderComponent(true, 'custom-class');
      component = renderResult.fixture.componentInstance;
    });

    it('should include custom class in element class', () => {
      expect(component.elementClass).toContain('custom-class');
    });
  });
});
