import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FeatureFlagService } from '@intaqalab/config';
import type { CommandTab, TabTopProcess } from '@intaqalab/core';

@Injectable({
  providedIn: 'root',
})
export class CommandsTabService {
  readonly #router = inject(Router);
  readonly #featureFlags = inject(FeatureFlagService);
  readonly tabToAdd = signal<TabTopProcess | undefined>(undefined);

  async addTrialCreate() {
    const Commands = await import('@intaqalab/trial-management').then((m) => m.DomainTrialsTabsCommands);
    const newTab = { ...Commands.TopTabTrialCreate };
    this.#addNewTab(newTab);
  }

  async addTrialView(id: number | string) {
    const Commands = await import('@intaqalab/trial-management').then((m) => m.DomainTrialsTabsCommands);
    const newTab = { ...Commands.TopTabTrialViewFactory(id) };

    this.#addNewTab(newTab);
  }

  async addTrialList() {
    const Commands = await import('@intaqalab/trial-management').then((m) => m.DomainTrialsTabsCommands);

    const newTab = { ...Commands.TopTabTrialList };
    this.#addNewTab(newTab);
  }

  async addCalendarTrials() {
    const TopTabTrialList = await import('@intaqalab/calendar-trials').then((m) => m.TopTabTrialList);

    const newTab = { ...TopTabTrialList };
    this.#addNewTab(newTab);
  }

  async addDocumentTrial(id: string) {
    const Commands = await import('@intaqalab/trial-management').then((m) => m.DomainTrialsTabsCommands);

    const newTab = { ...Commands.TopTabTrialDocumentsViewFactory(id) };
    this.#addNewTab(newTab);
  }

  executeCommand({ command, argument }: CommandTab) {
    if (command === 'TRIAL_DETAIL') {
      this.addTrialView(argument);
    } else if (command === 'TRIAL_LIST') {
      this.addTrialList();
    } else if (command === 'TRIAL_VIEW_DOCUMENT') {
      this.addDocumentTrial(argument);
    }
  }

  #addNewTab(tab: TabTopProcess) {
    if (this.#featureFlags.tabsNavigation()) {
      this.tabToAdd.set(tab);
    } else {
      const url = tab.route;
      if (url) {
        this.#router.navigateByUrl(url);
      } else {
        console.warn('not defined route in', tab);
      }
    }
  }
}
