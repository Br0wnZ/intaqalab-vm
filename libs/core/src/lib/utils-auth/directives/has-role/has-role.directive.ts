import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';

import { AuthService } from '../../auth-service';
import type { Role } from '../../models/role.model';

@Directive({
  selector: '[libHasRole]',
})
export class HasRoleDirective {
  templateRef = inject(TemplateRef);
  viewContainer = inject(ViewContainerRef);
  authService = inject(AuthService);

  libHasRole = input.required<Role[] | Role>();

  constructor() {
    effect(() => {
      const requiredRoles = this.libHasRole();
      const rolesToCheck = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

      if (rolesToCheck.length > 0) {
        this.#updateView(rolesToCheck);
      }
    });
  }

  #updateView(roles: Role[]) {
    if (this.authService.hasAnyRole(roles)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
