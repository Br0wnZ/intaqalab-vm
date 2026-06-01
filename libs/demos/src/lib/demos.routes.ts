import type { Route } from '@angular/router';

import { DemoCentersComponent } from './components/demo-centers.component';

const demoRoutes: Route[] = [
  {
    path: '',

    children: [
      {
        path: 'centers',
        component: DemoCentersComponent,
      },
    ],
  },
];
export default demoRoutes;
