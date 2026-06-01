import type { ComponentType } from '@angular/cdk/portal';
import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Injector,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { FeatureFlagService } from '@intaqalab/config';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslatePipe } from '@ngx-translate/core';

import type { CommandTab } from '../../../../index';
import { injectionTokenTabCommand } from '../../../../index';
import type { TabTopProcess } from './taps-top.model';

interface TabConfig {
  label: string;
  loader: () => Promise<ComponentType<unknown>>;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  data?: any;
  component?: ComponentType<unknown>;
}
@Component({
  selector: 'lib-tabs-top',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTabsModule,
    NgComponentOutlet,
    TranslatePipe,
    IntaIconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (featureFlags.tabsNavigation()) {
      <mat-tab-group
        animationDuration="0ms"
        class="inta-tabs"
        [disableRipple]="true"
        [selectedIndex]="selectedTabIndex()"
        [preserveContent]="true"
        (selectedIndexChange)="onTabChange($event)"
      >
        @for (tab of tabsToShow; track tab; let idx = $index; let total = $count) {
          <mat-tab [label]="tab.label">
            <ng-template mat-tab-label>
              {{ tab.label | translate }}
              @if (total > 1) {
                <span
                  tabindex="0"
                  class="inta-tabs__close"
                  (click)="removeTab(idx); $event.stopPropagation()"
                  (keydown.enter)="removeTab(idx); $event.stopPropagation()"
                >
                  <ui-inta-icon name="closeCircle" size="sm" />
                </span>
              }
            </ng-template>
            <ng-template matTabContent>
              @if (tab.component) {
                <div class="inta-tabs__panel">
                  <ng-container *ngComponentOutlet="tab.component; injector: tab.data"></ng-container>
                </div>
              }
            </ng-template>
          </mat-tab>
        }
      </mat-tab-group>
    }
  `,
  styles: ``,
})
export class TabsTopComponent {
  readonly featureFlags = inject(FeatureFlagService);
  readonly #ref = inject(ChangeDetectorRef);
  readonly #injector = inject(Injector);

  readonly tabToAdd = input<TabTopProcess | undefined>();
  readonly actionTabs = output<CommandTab>();
  readonly tabChanged = output<{ index: number; label: string }>();

  readonly selectedTabIndex = signal(0);
  readonly tabsToShow: TabConfig[] = [];

  constructor() {
    effect(() => {
      const tabToAdd = this.tabToAdd();
      if (tabToAdd !== undefined) {
        this.#addTab(tabToAdd);
      }
    });
  }

  async #addTab(tabToAdd: TabTopProcess) {
    const componentToAdd = await tabToAdd.loader();
    const newTab: TabConfig = {
      label: tabToAdd.label,
      loader: tabToAdd.loader,
      data: this.#getInjector(tabToAdd),
      component: componentToAdd,
    };
    this.tabsToShow.push(newTab);
    this.#ref.markForCheck();
    this.onTabChange(this.tabsToShow.length - 1);
  }

  async onTabChange(index: number) {
    this.selectedTabIndex.set(index);
    const activeTab = this.tabsToShow[index];
    if (activeTab) {
      this.tabChanged.emit({ index, label: activeTab.label });
    }
  }

  #getInjector(tab: TabTopProcess): Injector {
    return Injector.create({
      providers: [
        { provide: tab.injector, useValue: tab.data },
        {
          provide: injectionTokenTabCommand,
          useValue: (command: CommandTab) => {
            this.actionTabs.emit(command);
          },
        },
      ],
      parent: this.#injector,
    });
  }

  removeTab(index: number) {
    this.tabsToShow.splice(index, 1);
  }
}
