import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import type { Role } from '@intaqalab/core';
import { AuthService } from '@intaqalab/core';
import type { HasStatus, TrialStatus } from '@intaqalab/models';

export interface ShowByStatusAndRoleInput {
  roles?: Role[];
  status?: TrialStatus[];
  trial: HasStatus;
}
@Directive({
  selector: '[intaShow]',
})
export class ShowByStatusAndRoleDirective {
  templateRef = inject(TemplateRef);
  viewContainer = inject(ViewContainerRef);
  authService = inject(AuthService);

  intaShow = input.required<ShowByStatusAndRoleInput>();

  constructor() {
    effect(() => {
      const { trial, roles, status } = this.intaShow();
      if (roles || status) {
        this.#updateByRoleAndByStatus(roles || true, status || true, trial);
      }
    });
  }

  #updateByRoleAndByStatus(allowedRoles: Role[] | true, allowedStatus: TrialStatus[] | true, trial: HasStatus) {
    const validRoles = allowedRoles === true || this.#includesRoles(allowedRoles, this.authService.userRoles());
    const validStatus = allowedStatus === true || this.#includesStatus(allowedStatus, trial.status);

    if (validRoles && validStatus) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }

  #includesRoles(allowedRoles: Role[], rolesUser: Role[]) {
    return allowedRoles.some((rol) => rolesUser.includes(rol));
  }

  #includesStatus(allowedRoles: TrialStatus[], status: TrialStatus) {
    return allowedRoles.includes(status);
  }
}
