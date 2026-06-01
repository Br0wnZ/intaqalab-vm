import { Component, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'lib-loader',
  imports: [MatProgressSpinnerModule],
  template: `
    @if (loaderService.isLoading()) {
      <div data-testid="loader" class="loading">
        <div class="spinner">
          <mat-spinner></mat-spinner>
        </div>
      </div>
    }
  `,
  styleUrl: './loader.component.css',
})
export class LoaderComponent {
  loaderService = inject(LoaderService);
}
