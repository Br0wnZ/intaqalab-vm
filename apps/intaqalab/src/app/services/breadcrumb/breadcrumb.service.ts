import { Injectable, inject, signal } from '@angular/core';
import type { ActivatedRouteSnapshot } from '@angular/router';
import { NavigationEnd, PRIMARY_OUTLET, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

export interface BreadcrumbItem {
  label: string;
  url: string;
}

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  readonly #router = inject(Router);

  readonly items = signal<BreadcrumbItem[]>([]);

  constructor() {
    this.#router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        startWith(null),
        map(() => this.#buildBreadcrumbs(this.#router.routerState.snapshot.root)),
      )
      .subscribe((crumbs) => this.items.set(crumbs));
  }

  setItems(crumbs: BreadcrumbItem[]) {
    this.items.set(crumbs);
  }

  #buildBreadcrumbs(route: ActivatedRouteSnapshot, url = '', crumbs: BreadcrumbItem[] = []): BreadcrumbItem[] {
    const children = route.children;

    if (children.length === 0) {
      return crumbs;
    }

    for (const child of children) {
      if (child.outlet !== PRIMARY_OUTLET) continue;

      const routeURL = child.url.map((segment) => segment.path).join('/');
      const nextURL = routeURL ? `${url}/${routeURL}` : url;
      const breadcrumbLabel = child.data['breadcrumb'] as string | undefined;
      const lastCrumb = crumbs[crumbs.length - 1];

      if (breadcrumbLabel && breadcrumbLabel !== lastCrumb?.label) {
        crumbs.push({ label: breadcrumbLabel, url: nextURL });
      }

      return this.#buildBreadcrumbs(child, nextURL, crumbs);
    }

    return crumbs;
  }
}
