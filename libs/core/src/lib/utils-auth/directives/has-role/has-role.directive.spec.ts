import { Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';

import { AuthService } from '../../auth-service';
import { Role } from '../../models/role.model';
import { HasRoleDirective } from './has-role.directive';

const AuthServiceMock = {
  userRoles: signal<Role[]>([Role.INTAQALAB_ADMIN]),
  hasAnyRole: (roles: Role[]) => roles.includes(Role.INTAQALAB_ADMIN),
};

@Component({
  template: `
    <h2 *libHasRole="roleAgree" data-testid="h2-element">Agree</h2>
    <h3 *libHasRole="roleKo" data-testid="h3-element">Ko</h3>
  `,
  imports: [HasRoleDirective],
})
class TestComponent {
  roleAgree: Role[] = [Role.INTAQALAB_ADMIN];
  roleKo: Role[] = [];
}

describe('HasRoleDirective', () => {
  async function setup() {
    return await render(TestComponent, {
      providers: [
        {
          provide: AuthService,
          useValue: AuthServiceMock,
        },
      ],
    });
  }

  it('should show the element h2', async () => {
    await setup();
    expect(screen.getByTestId('h2-element')).toBeInTheDocument();
  });

  it('should not show the element h3', async () => {
    await setup();
    expect(screen.queryByTestId('h3-element')).not.toBeInTheDocument();
  });
});
