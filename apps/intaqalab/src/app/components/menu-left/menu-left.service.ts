import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { FeatureFlagService } from '@intaqalab/config';
import { AuthService } from '@intaqalab/core';
import { filter } from 'rxjs';

import { CommandsTabService } from '../../services/tabs/commands-tab-service';
import type { MenuAction, MenuNode } from './menu-left.config';
import { ACTION_ROUTES, MENU_TREE, URL_ACTION_MAP } from './menu-left.config';

@Injectable()
export class MenuLeftService {
  readonly #router = inject(Router);
  readonly #destroyRef = inject(DestroyRef);
  readonly #tabsService = inject(CommandsTabService);
  readonly #featureFlags = inject(FeatureFlagService);
  readonly #authService = inject(AuthService);

  readonly activeNodeId = signal<MenuAction | null>(null);
  readonly activeCollapsedSection = signal<string | null>(null);
  readonly dataSource = computed(() => this.#filterTree(MENU_TREE));

  #isFirstNavigation = true;

  constructor() {
    this.#syncFromUrl(this.#router.url);
    this.#router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe((event) => {
        this.#syncFromUrl(event.urlAfterRedirects);

        if (this.#isFirstNavigation) {
          this.#isFirstNavigation = false;
          if (this.#featureFlags.tabsNavigation()) {
            const normalized = event.urlAfterRedirects.split('?')[0]?.split('#')[0] ?? '';
            const matched = URL_ACTION_MAP.find(({ startsWith }) => normalized.startsWith(startsWith));
            if (matched && ACTION_ROUTES[matched.action] === undefined) {
              this.#handleTabAction(matched.action);
            }
          }
        }
      });
  }

  navigate(node: MenuNode): void {
    if (!node.id) return;

    this.activeNodeId.set(node.id);
    this.#setActiveSectionFromAction(node.id);

    const route = ACTION_ROUTES[node.id];
    if (route !== undefined) {
      this.#router.navigateByUrl(route);
    } else {
      this.#handleTabAction(node.id);
    }
  }

  #handleTabAction(action: MenuAction): void {
    switch (action) {
      case 'TRIAL_NEW':
        this.#tabsService.addTrialCreate();
        break;
      case 'TRIAL_LIST':
        this.#tabsService.addTrialList();
        break;
      case 'CALENDAR_TRIALS':
        this.#tabsService.addCalendarTrials();
        break;
    }
  }

  #setActiveSectionFromAction(action: MenuAction): void {
    const section = this.dataSource().find((node) => this.#containsAction(node, action));
    this.activeCollapsedSection.set(section?.name ?? null);
  }

  #containsAction(node: MenuNode, action: MenuAction): boolean {
    if (node.id === action) return true;
    return node.children?.some((child) => this.#containsAction(child, action)) ?? false;
  }

  #syncFromUrl(url: string): void {
    const normalized = url.split('?')[0]?.split('#')[0] ?? '';
    const matched = URL_ACTION_MAP.find(({ startsWith }) => normalized.startsWith(startsWith));

    if (!matched) {
      this.activeNodeId.set(null);
      this.activeCollapsedSection.set(null);
      return;
    }

    this.activeNodeId.set(matched.action);
    this.#setActiveSectionFromAction(matched.action);
  }

  #filterTree(nodes: MenuNode[]): MenuNode[] {
    return nodes
      .filter((node) => !node.roles || this.#authService.hasAnyRole(node.roles))
      .map((node) => {
        if (node.children) {
          const filteredChildren = this.#filterTree(node.children);
          return { ...node, children: filteredChildren };
        }
        return node;
      })
      .filter((node) => !node.children || node.children.length > 0);
  }
}
