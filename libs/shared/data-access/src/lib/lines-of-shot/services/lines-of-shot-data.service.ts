import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { injectLinesOfShotEndpoint } from '@intaqalab/config';
import type { LinesOfShot, PaginatedApiResponse } from '@intaqalab/models';
import { TranslateService } from '@ngx-translate/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';

type LinesOfShotApiResponse = PaginatedApiResponse<LinesOfShot>;
@Injectable({
  providedIn: 'root',
})
export class LinesOfShotDataService {
  readonly #translate = inject(TranslateService);
  readonly #httpClient = inject(HttpClient);
  readonly #linesOfShotApiUrl = injectLinesOfShotEndpoint();

  list(addAll?: boolean): Observable<LinesOfShot[]> {
    return this.#retrieve().pipe(
      map((data) => {
        const items = data.items;
        if (addAll) {
          items.push({ id: '', label: this.#translate.instant('CALENDAR_TRIALS.ALL_LINES') });
        }
        return items;
      }),
    );
  }

  #retrieve() {
    return this.#httpClient.get<LinesOfShotApiResponse>(`${this.#linesOfShotApiUrl}?pageSize=100&sort=name;asc`);
  }
}
