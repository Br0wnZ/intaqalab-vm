import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import { Role } from './models/role.model';
import type { User, UserData } from './models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  readonly #router = inject(Router);
  readonly #destroyRef = inject(DestroyRef);

  #userData = signal<UserData | undefined>(undefined);
  user = computed<User>(() => {
    const userData = this.#userData();
    return {
      name: userData?.family_name ?? '',
    };
  });

  setUserData(userData: UserData) {
    this.#userData.set(userData);
  }

  userRoles = signal<Role[]>([]);

  setRoles(roles: Role[]) {
    this.userRoles.set(roles);
  }

  setRawRoles(rawroles: string[]) {
    const rolesvalidByFormat = onlyUpperCases(rawroles);
    console.log('raw values:', rolesvalidByFormat);
    const rolesToAdd :Role[] = [];
    for ( const rawRole of rawroles){
      const role = parseRol(rawRole); 
      if(role !== null){
        rolesToAdd.push(role)
      }
    }
    console.log('setting roles to', rolesToAdd)
    this.userRoles.set(rolesToAdd);
  }

  hasRole(role: Role) {
    return this.userRoles().includes(role);
  }

  hasAnyRole(roles: Role[]) {
    return roles.some((role) => this.userRoles().includes(role));
  }

  constructor() {
    this.#monitorRoutePermissions();
  }

  #monitorRoutePermissions() {
    effect(() => {
      this.userRoles();
      this.#checkCurrentRoutePermissions();
    });

    this.#router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe(() => {
        this.#checkCurrentRoutePermissions();
      });
  }

  #checkCurrentRoutePermissions() {
    let route = this.#router.routerState.root;
    while (route.firstChild) {
      route = route.firstChild;
    }

    const snapshot = route.snapshot;
    const requiredRoles = snapshot.data?.['roles'] as Role[];

    if (requiredRoles?.length > 0) {
      const hasPermission = this.hasAnyRole(requiredRoles);
      if (!hasPermission) {
        this.#router.navigate(['/']);
      }
    }
  }
}

function onlyUpperCases(arr: string[]): string[] {
  return arr.filter((str) => str.length > 0 && str === str.toUpperCase());
}


function parseRol(value: string): Role | null {
  if (Object.keys(Role).includes(value as Role)) {
    return value as Role;
  } else {
    console.warn(`Unknown role: ${value}, skipping it`)
    return null
  }
}