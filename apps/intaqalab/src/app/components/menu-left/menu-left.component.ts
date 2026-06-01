import type { AfterViewInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTree, MatTreeModule } from '@angular/material/tree';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslatePipe } from '@ngx-translate/core';

import type { MenuNode } from './menu-left.config';
import { MenuLeftService } from './menu-left.service';

@Component({
  selector: 'app-menu-left',
  imports: [MatTreeModule, MatButtonModule, MatIconModule, MatTooltipModule, TranslatePipe, IntaIconComponent],
  providers: [MenuLeftService],
  host: {
    class: 'flex h-full min-h-0 flex-col',
  },
  styles: `
    .menu-scroll {
      scrollbar-width: none;
    }

    .menu-scroll:hover,
    .menu-scroll:focus-within {
      scrollbar-width: thin;
    }

    .menu-scroll::-webkit-scrollbar {
      width: 0;
      height: 0;
    }

    .menu-scroll:hover::-webkit-scrollbar,
    .menu-scroll:focus-within::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    .menu-scroll::-webkit-scrollbar-thumb {
      background-color: #98a2b3;
      border-radius: 9999px;
    }

    .menu-scroll::-webkit-scrollbar-track {
      background: transparent;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="relative m-2 h-[68px] overflow-hidden"
      [class.mx-auto]="collapsed()"
      [class.w-16]="collapsed()"
      [class.w-40]="!collapsed()"
    >
      <img
        src="assets/logo-max.svg"
        alt="Logo"
        class="absolute inset-0 h-full w-40 max-w-none object-left transition-opacity duration-150"
        [class.opacity-0]="collapsed()"
        [class.opacity-100]="!collapsed()"
        [class.delay-0]="collapsed()"
        [class.delay-200]="!collapsed()"
      />
      <img
        src="assets/logo-min.svg"
        alt="Logo"
        class="absolute top-0 bottom-0 left-1/2 h-full w-16 max-w-none -translate-x-1/2 object-center transition-opacity duration-150"
        [class.opacity-100]="collapsed()"
        [class.opacity-0]="!collapsed()"
        [class.delay-0]="collapsed()"
        [class.delay-200]="!collapsed()"
      />
    </div>

    <div class="flex px-3 py-2" [class.justify-center]="collapsed()" [class.justify-end]="!collapsed()">
      <button
        type="button"
        class="inline-flex h-8 w-8 items-center justify-center cursor-pointer"
        [attr.aria-label]="collapsed() ? 'Expandir menu lateral' : 'Colapsar menu lateral'"
        [title]="collapsed() ? 'Expandir' : 'Colapsar'"
        (click)="onToggleMenu()"
      >
        <ui-inta-icon
          name="chevronLeftSquare"
          size="xxl"
          class="origin-center transform"
          [class.rotate-180]="!collapsed()"
          [class.-translate-x-px]="!collapsed()"
        />
      </button>
    </div>

    <div class="mx-3 border-b border-gray-200"></div>

    <nav class="menu-scroll flex-1 min-h-0 overflow-y-auto py-2">
      @if (collapsed()) {
        <div class="flex h-full flex-col items-center">
          @for (node of menuService.dataSource(); track node.name; let last = $last) {
            <div class="flex w-full flex-col items-center">
              <button
                type="button"
                class="inline-flex w-full flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-gray-700"
                [attr.aria-label]="node.name | translate"
                [title]="node.name | translate"
                [class.cursor-pointer]="!node.children?.length"
                [class.cursor-default]="!!node.children?.length"
                [class.bg-violet-50]="isCollapsedSectionActive(node)"
                [class.text-violet-700]="isCollapsedSectionActive(node)"
                (click)="clickCollapsedNode(node)"
              >
                @if (node.iconName) {
                  <ui-inta-icon size="xxl" class="shrink-0 text-current" [name]="node.iconName" />
                } @else if (node.icon) {
                  <mat-icon aria-hidden="true" class="!h-6 !w-6 !text-gray-700">{{ node.icon }}</mat-icon>
                }
                <span class="text-center text-xs font-medium leading-4">{{ node.name | translate }}</span>
              </button>

              @if (isCollapsedGroupExpanded(node)) {
                <div class="mt-2 flex w-full flex-col items-center gap-2">
                  @for (child of node.children ?? []; track child.name) {
                    <button
                      type="button"
                      matTooltipPosition="right"
                      class="inline-flex h-9 w-9 items-center justify-center rounded-md"
                      [attr.aria-label]="child.name | translate"
                      [matTooltip]="child.name | translate"
                      [matTooltipDisabled]="!collapsed()"
                      [class.cursor-pointer]="!child.children?.length"
                      [class.cursor-default]="!!child.children?.length"
                      [class.bg-violet-50]="isNodeActive(child)"
                      [class.text-violet-700]="isNodeActive(child)"
                      (click)="clickCollapsedSubNode(node, child)"
                    >
                      @if (child.iconName) {
                        <ui-inta-icon size="xl" class="shrink-0 text-current" [name]="child.iconName" />
                      } @else if (child.icon) {
                        <mat-icon aria-hidden="true" class="!h-5 !w-5 !text-gray-600">{{ child.icon }}</mat-icon>
                      } @else {
                        <span aria-hidden="true" class="inline-block h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                      }
                    </button>
                  }
                </div>
              }
            </div>
            @if (!last) {
              <div class="my-2 w-20 border-b border-gray-200"></div>
            }
          }
        </div>
      } @else {
        <mat-tree
          class="mat-tree--with-guides !bg-transparent [--tree-guide-left:20px] [--tree-branch-length:14px]"
          [dataSource]="menuService.dataSource()"
          [childrenAccessor]="childrenAccessor"
          #tree
        >
          <mat-tree-node
            *matTreeNodeDef="let node"
            matTreeNodePadding
            class="!justify-start mx-3 [&[aria-level='1']]:mx-0 [&[aria-level='1']>button]:ml-3 [&:not([aria-level='1'])>button]:mr-3 [&[aria-level='1']::before]:!hidden"
          >
            <button
              type="button"
              class="relative z-10 inline-flex cursor-pointer items-center gap-2 bg-white text-left text-gray-500 font-medium hover:text-gray-700 [[aria-level='1']_&]:text-black data-[active=true]:!text-violet-700 data-[active=true]:hover:!text-violet-700"
              [attr.data-active]="
                isNodeActive(node) || (isCollapsedSectionActive(node) && isTopLevelNode(node)) ? 'true' : null
              "
              (click)="menuService.navigate(node)"
            >
              @if (node.iconName) {
                <ui-inta-icon
                  size="xl"
                  class="!hidden shrink-0 text-current [[aria-level='1']_&]:!inline-flex"
                  [name]="node.iconName"
                />
              } @else if (node.icon) {
                <mat-icon aria-hidden="true" class="!hidden !h-5 !w-5 !text-current [[aria-level='1']_&]:!inline-flex">
                  {{ node.icon }}
                </mat-icon>
              }
              <span>{{ node.name | translate }}</span>
            </button>
          </mat-tree-node>

          <mat-tree-node
            *matTreeNodeDef="let node; when: hasChild"
            matTreeNodePadding
            class="!justify-start [&[aria-level='1']::before]:!hidden [&[aria-level='1']::after]:!hidden data-[active=true]:!bg-violet-50"
            [cdkTreeNodeTypeaheadLabel]="node.name"
            [attr.data-active]="isCollapsedSectionActive(node) ? 'true' : null"
          >
            <button
              type="button"
              matTreeNodeToggle
              class="relative z-10 inline-flex cursor-default items-center gap-1 bg-transparent text-left text-gray-500 font-medium hover:text-gray-700 [[aria-level='1']_&]:text-black data-[active=true]:!text-violet-700 data-[active=true]:hover:!text-violet-700 mx-3"
              [attr.aria-label]="'Toggle ' + node.name"
              [attr.data-active]="isCollapsedSectionActive(node) ? 'true' : null"
              (click)="menuService.navigate(node)"
            >
              <span class="inline-flex items-center gap-2">
                @if (node.iconName) {
                  <ui-inta-icon
                    size="xl"
                    class="!hidden shrink-0 text-current [[aria-level='1']_&]:!inline-flex"
                    [name]="node.iconName"
                  />
                } @else if (node.icon) {
                  <mat-icon
                    aria-hidden="true"
                    class="!hidden !h-5 !w-5 !text-current [[aria-level='1']_&]:!inline-flex"
                  >
                    {{ node.icon }}
                  </mat-icon>
                }
                <span>{{ node.name | translate }}</span>
              </span>
              <span class="ml-1 inline-flex h-5 w-5 shrink-0 items-center justify-center">
                @if (tree.isExpanded(node)) {
                  <ui-inta-icon name="minusSquare" size="xl" />
                } @else {
                  <ui-inta-icon name="plusSquare" size="xl" />
                }
              </span>
            </button>
          </mat-tree-node>
        </mat-tree>
      }
    </nav>
  `,
})
export class MenuLeftComponent implements AfterViewInit {
  readonly collapsed = input(false);
  readonly collapsedChange = output<boolean>();

  protected readonly menuService = inject(MenuLeftService);

  protected readonly expandedCollapsedGroup = signal<string | null>(null);
  protected readonly tree = viewChild(MatTree);

  readonly childrenAccessor = (node: MenuNode) => node.children ?? [];
  readonly hasChild = (_: number, node: MenuNode) => !!node.children && node.children.length > 0;

  constructor() {
    effect(() => {
      const activeSectionName = this.menuService.activeCollapsedSection();
      const treeInstance = this.tree();
      const dataSource = this.menuService.dataSource();

      if (treeInstance && activeSectionName && !this.collapsed()) {
        const activeNode = dataSource.find((n) => n.name === activeSectionName);
        if (activeNode) {
          treeInstance.expand(activeNode);
        }
      }
    });
  }

  ngAfterViewInit() {
    this.tree()?.expandAll();
  }

  protected onToggleMenu(): void {
    this.collapsedChange.emit(!this.collapsed());
  }

  protected clickCollapsedNode(node: MenuNode): void {
    if (node.children?.length) {
      const current = this.expandedCollapsedGroup();
      this.expandedCollapsedGroup.set(current === node.name ? null : node.name);
      return;
    }

    this.menuService.navigate(node);
  }

  protected clickCollapsedSubNode(_section: MenuNode, node: MenuNode): void {
    if (!node.children?.length) {
      this.menuService.navigate(node);
    }
  }

  protected isCollapsedGroupExpanded(node: MenuNode): boolean {
    return !!node.children?.length && this.expandedCollapsedGroup() === node.name;
  }

  protected isCollapsedSectionActive(node: MenuNode): boolean {
    return this.menuService.activeCollapsedSection() === node.name;
  }

  protected isNodeActive(node: MenuNode): boolean {
    return !!node.id && this.menuService.activeNodeId() === node.id;
  }

  protected isTopLevelNode(node: MenuNode): boolean {
    return this.menuService.dataSource().includes(node);
  }
}
