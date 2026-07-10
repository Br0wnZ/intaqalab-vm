import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, resource, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { PageEvent } from '@angular/material/paginator';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';

interface DocumentType {
  id: number;
  name: string;
  active: boolean;
  observations: string;
  category: string;
}

@Component({
  selector: 'inta-admin-docs-section',
  imports: [TranslateModule, MatButtonModule, MatIconModule, MatSlideToggleModule, MatTableModule, MatPaginatorModule],
  template: `
    <div class="min-h-screen p-8">
      <header class="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
        <h1 class="text-gray-900 flex items-center gap-2">{{ 'ADMIN.ADMIN_DOCS_SECTION.HEADER' | translate }}</h1>

        <button
          class="flex items-center bg-purple-600 hover:bg-purple-700 cursor-pointer text-white px-6 py-2.5 rounded-lg"
        >
          <mat-icon class="mr-2">add_circle_outline</mat-icon>
          {{ 'ADMIN.ADMIN_DOCS_SECTION.NEW_DOCUMENT_TYPE' | translate }}
        </button>
      </header>

      <section class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div
          class="p-6 border-b border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
        >
          <h2 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
            {{ 'ADMIN.ADMIN_DOCS_SECTION.DOCUMENTS_LIST' | translate }}
          </h2>

          <div class="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div class="relative w-full sm:w-80 group">
              <mat-icon
                class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 scale-90 group-focus-within:text-[#6366f1] transition-colors"
              >
                search
              </mat-icon>
              <input
                placeholder="{{ 'ADMIN.ADMIN_DOCS_SECTION.SEARCH_PLACEHOLDER' | translate }}"
                type="text"
                class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 outline-none text-sm text-gray-600 placeholder-gray-400 transition-all bg-gray-50/30 focus:bg-white"
                [value]="searchQuery()"
                (input)="updateSearch($any($event.target).value)"
              />
            </div>

            <button
              class="flex items-center justify-between px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all w-full sm:w-auto min-w-[160px] shadow-sm"
            >
              <span class="flex items-center gap-2">{{ 'ADMIN.ADMIN_DOCS_SECTION.FILTER_BY_STATUS' | translate }}</span>
              <mat-icon class="text-gray-400 scale-90">expand_more</mat-icon>
            </button>
          </div>
        </div>

        <div class="overflow-x-auto relative flex-grow">
          @if (documentsResource.isLoading()) {
            <div class="absolute inset-0 bg-white/80 z-10 flex items-center justify-center backdrop-blur-sm h-64">
              <div class="flex flex-col items-center">
                <mat-icon class="animate-spin text-[#6366f1] text-3xl mb-2">sync</mat-icon>
                <span class="text-xs font-medium text-gray-500">{{ 'ADMIN.ADMIN_DOCS_SECTION.SYNC' | translate }}</span>
              </div>
            </div>
          }

          <table mat-table class="w-full" [dataSource]="paginatedDocuments()">
            <ng-container matColumnDef="name">
              <th
                *matHeaderCellDef
                mat-header-cell
                class="!px-6 !py-4 !font-semibold !text-xs  !tracking-wider !text-gray-500 !bg-gray-50/80 !border-b !border-gray-100"
              >
                {{ 'ADMIN.ADMIN_DOCS_SECTION.TABLE.NAME' | translate }}
              </th>
              <td *matCellDef="let doc" mat-cell class="!px-6 !py-4 !font-medium !text-gray-700 !border-b-gray-50">
                {{ doc.name }}
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th
                *matHeaderCellDef
                mat-header-cell
                class="!px-6 !py-4 !font-semibold !text-xs  !tracking-wider !text-gray-500 !bg-gray-50/80 !border-b !border-gray-100"
              >
                {{ 'ADMIN.ADMIN_DOCS_SECTION.TABLE.STATUS' | translate }}
              </th>
              <td *matCellDef="let doc" mat-cell class="!px-6 !py-4 !border-b-gray-50">
                <div class="flex items-center gap-3">
                  <mat-slide-toggle
                    color="primary"
                    class="scale-90"
                    [checked]="doc.active"
                    (change)="toggleStatus(doc)"
                  ></mat-slide-toggle>
                  <span>
                    {{ doc.active ? 'Activo' : 'Inactivo' }}
                  </span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="observations">
              <th
                *matHeaderCellDef
                mat-header-cell
                class="!px-6 !py-4 !font-semibold !text-xs  !tracking-wider !text-gray-500 !bg-gray-50/80 !border-b !border-gray-100"
              >
                {{ 'ADMIN.ADMIN_DOCS_SECTION.TABLE.OBSERVATIONS' | translate }}
              </th>
              <td
                *matCellDef="let doc"
                mat-cell
                title="{{ doc.observations }}"
                class="!px-6 !py-4 !text-gray-500 !max-w-xs truncate !border-b-gray-50"
              >
                {{ doc.observations }}
              </td>
            </ng-container>

            <ng-container matColumnDef="category">
              <th
                *matHeaderCellDef
                mat-header-cell
                class="!px-6 !py-4 !font-semibold !text-xs  !tracking-wider !text-gray-500 !bg-gray-50/80 !border-b !border-gray-100"
              >
                {{ 'ADMIN.ADMIN_DOCS_SECTION.TABLE.CATEGORY' | translate }}
              </th>
              <td *matCellDef="let doc" mat-cell class="!px-6 !py-4 !border-b-gray-50">
                <span>
                  {{ doc.category }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th
                *matHeaderCellDef
                mat-header-cell
                class="!px-6 !py-4 !font-semibold !text-xs  !tracking-wider !text-gray-500 !text-right !bg-gray-50/80 !border-b !border-gray-100"
              >
                {{ 'ADMIN.ADMIN_DOCS_SECTION.TABLE.ACTIONS' | translate }}
              </th>
              <td *matCellDef="let doc" mat-cell class="!px-6 !py-4 !border-b-gray-50">
                <div class="flex items-center justify-end gap-1 transition-transform duration-150">
                  <button
                    mat-icon-button
                    class="!text-gray-400 hover:!text-rose-500 hover:!bg-rose-50 transition-colors transform hover:scale-105 w-8 h-8 flex items-center justify-center"
                  >
                    <mat-icon class="!w-5 !h-5 !text-[20px]">delete_outline</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    class="!text-gray-400 hover:!text-[#6366f1] hover:!bg-indigo-50 transition-colors transform hover:scale-105 w-8 h-8 flex items-center justify-center"
                  >
                    <mat-icon class="!w-5 !h-5 !text-[20px]">edit</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr *matNoDataRow class="mat-row">
              <td class="mat-cell" [attr.colspan]="displayedColumns.length">
                <div class="flex flex-col items-center gap-2 py-12 text-center text-gray-400">
                  <span class="text-4xl grayscale opacity-50">📂</span>
                  <p>{{ 'ADMIN.ADMIN_DOCS_SECTION.NO_RESULTS' | translate }}</p>
                </div>
              </td>
            </tr>

            <tr *matHeaderRowDef="displayedColumns" mat-header-row></tr>
            <tr
              *matRowDef="let row; columns: displayedColumns"
              mat-row
              class="group hover:bg-indigo-50/30 transition-colors duration-200"
            ></tr>
          </table>
        </div>

        <mat-paginator
          showFirstLastButtons
          aria-label="Seleccionar página de documentos"
          class="!border-t !border-gray-100 !bg-white"
          [length]="filteredDocuments().length"
          [pageSize]="pageSize()"
          [pageIndex]="pageIndex()"
          [pageSizeOptions]="[5, 10, 25]"
          (page)="handlePageEvent($event)"
        ></mat-paginator>
      </section>
    </div>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDocsSection {
  readonly searchQuery = signal('');
  readonly statusFilter = signal<'all' | 'active' | 'inactive'>('all');

  readonly pageIndex = signal(0);
  readonly pageSize = signal(5);

  readonly displayedColumns: string[] = ['name', 'status', 'observations', 'category', 'actions'];

  readonly documentsResource = resource({
    loader: async () => {
      await new Promise((r) => setTimeout(r, 600));
      return Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        name: i % 2 === 0 ? `Prueba fuego v${i}` : `Resultados ejecución ${202400 + i}`,
        active: i % 3 !== 0,
        observations: i % 2 === 0 ? 'Revisión pendiente por legal' : 'Aprobado automáticamente',
        category: i % 4 === 0 ? 'General' : 'Particular',
      })) as DocumentType[];
    },
  });

  readonly filteredDocuments = computed(() => {
    const docs = this.documentsResource.value() ?? [];
    const query = this.searchQuery().toLowerCase();
    const status = this.statusFilter();

    return docs.filter((doc) => {
      const matchesSearch = doc.name.toLowerCase().includes(query);
      const matchesStatus = status === 'all' ? true : status === 'active' ? doc.active : !doc.active;
      return matchesSearch && matchesStatus;
    });
  });

  readonly paginatedDocuments = computed(() => {
    const docs = this.filteredDocuments();
    const startIndex = this.pageIndex() * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    return docs.slice(startIndex, endIndex);
  });

  toggleStatus(doc: DocumentType) {
    doc.active = !doc.active;
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
  }

  updateSearch(query: string) {
    this.searchQuery.set(query);
    this.pageIndex.set(0);
  }
}
