import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
import { CentersDataService } from '@intaqalab/data-access';

@Component({
  selector: 'lib-demo-centers',
  imports: [],
  template: `
    <p>demo-centers works!</p>
    <div>Welcome to home Route</div>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoCentersComponent implements OnInit {
  centersData = inject(CentersDataService);
  centers = this.centersData.centers;

  ngOnInit(): void {
    console.log('hello');
  }
}
