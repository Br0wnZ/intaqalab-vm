import type { Routes } from '@angular/router';

import { MasterDataStore } from './+state/master-data.store';
import { MasterDataDefaultUpsertDialogComponent } from './components/dialogs/upsert/default/default-upsert-dialog.component';
import { DimensionsUpsertDialogComponent } from './components/dialogs/upsert/dimensions/dimensions-upsert-dialog.component';
import { DocumentTypeUpsertDialogComponent } from './components/dialogs/upsert/document-type/document-type-upsert-dialog.component';
import { LoadingZoneUpsertDialogComponent } from './components/dialogs/upsert/loading-zone/loading-zone-upsert-dialog.component';
import { MeasurementsAndRecordsDialogComponent } from './components/dialogs/upsert/measures/measures-dialog.component';
import { StanagUpsertDialogComponent } from './components/dialogs/upsert/stanag/stanag-upsert-dialog.component';
import { MasterDataListComponent } from './components/list/master-data-list.component';
import { DIMENSION_VIEW } from './data/dimension.constants';
import { DOCUMENT_TYPE_VIEW } from './data/document-type.constants';
import { FUZE_TYPE_VIEW } from './data/fuze-type.constants';
import { LOADING_ZONE_VIEW } from './data/loading-zone.constants';
import { MATERIAL_VIEW } from './data/material.constants';
import { MEASUREMENTS_AND_RECORDS_VIEW } from './data/measures.constants';
import { STANAG_VIEW } from './data/stanag.constants';
import { TARGET_TYPE_VIEW } from './data/target-type.constants';
import { TRIAL_TYPE_VIEW } from './data/trial-type.constants';
import { MODAL_COMPONENT } from './modal.token';
import { MasterDataService } from './services/master-data.service';
import { DimensionService } from './services/masters/dimension/dimension.service';
import { DocumentTypeService } from './services/masters/document-types/document-types.service';
import { FuzeTypeService } from './services/masters/fuze-types/fuze-types.service';
import { LoadingZoneService } from './services/masters/loading-zone/loading-zone.service';
import { MaterialService } from './services/masters/material/material.service';
import { MeasurementsAndRecordsService } from './services/masters/measures/measures.service';
import { StanagService } from './services/masters/stanag/stanag.service';
import { TargetTypeService } from './services/masters/target-types/target-types.service';
import { TrialTypeService } from './services/masters/trial-types/trial-types.service';

export const routes: Routes = [
  {
    path: '',
    providers: [{ provide: MODAL_COMPONENT, useValue: MasterDataDefaultUpsertDialogComponent }],
    children: [
      {
        path: 'trial-type',
        component: MasterDataListComponent,
        data: { breadcrumb: 'BREADCRUMB.CATALOG_TRIAL_TYPE', masterView: TRIAL_TYPE_VIEW },
        providers: [{ provide: MasterDataService, useExisting: TrialTypeService }, MasterDataStore],
      },
      {
        path: 'document-type',
        component: MasterDataListComponent,
        data: { breadcrumb: 'BREADCRUMB.CATALOG_DOCUMENT_TYPE', masterView: DOCUMENT_TYPE_VIEW },
        providers: [
          { provide: MasterDataService, useExisting: DocumentTypeService },
          { provide: MODAL_COMPONENT, useValue: DocumentTypeUpsertDialogComponent },
          MasterDataStore,
        ],
      },
      {
        path: 'target-type',
        component: MasterDataListComponent,
        data: { breadcrumb: 'BREADCRUMB.CATALOG_TARGET_TYPE', masterView: TARGET_TYPE_VIEW },
        providers: [{ provide: MasterDataService, useExisting: TargetTypeService }, MasterDataStore],
      },
      {
        path: 'material',
        component: MasterDataListComponent,
        data: { breadcrumb: 'BREADCRUMB.CATALOG_MATERIAL', masterView: MATERIAL_VIEW },
        providers: [{ provide: MasterDataService, useExisting: MaterialService }, MasterDataStore],
      },
      {
        path: 'dimension',
        component: MasterDataListComponent,
        data: { breadcrumb: 'BREADCRUMB.CATALOG_DIMENSION', masterView: DIMENSION_VIEW },
        providers: [
          { provide: MasterDataService, useExisting: DimensionService },
          { provide: MODAL_COMPONENT, useValue: DimensionsUpsertDialogComponent },
          MasterDataStore,
        ],
      },
      {
        path: 'fuze-type',
        component: MasterDataListComponent,
        data: { breadcrumb: 'BREADCRUMB.CATALOG_FUZE_TYPE', masterView: FUZE_TYPE_VIEW },
        providers: [{ provide: MasterDataService, useExisting: FuzeTypeService }, MasterDataStore],
      },
      {
        path: 'loading-zone',
        component: MasterDataListComponent,
        data: { breadcrumb: 'BREADCRUMB.CATALOG_LOADING_ZONE', masterView: LOADING_ZONE_VIEW },
        providers: [
          { provide: MasterDataService, useExisting: LoadingZoneService },
          { provide: MODAL_COMPONENT, useValue: LoadingZoneUpsertDialogComponent },
          MasterDataStore,
        ],
      },
      {
        path: 'stanag',
        component: MasterDataListComponent,
        data: { breadcrumb: 'BREADCRUMB.CATALOG_STANAG', masterView: STANAG_VIEW },
        providers: [
          { provide: MasterDataService, useExisting: StanagService },
          { provide: MODAL_COMPONENT, useValue: StanagUpsertDialogComponent },
          MasterDataStore,
        ],
      },
      {
        path: 'measures',
        component: MasterDataListComponent,
        data: { breadcrumb: 'BREADCRUMB.CATALOG_MEASUREMENTS_AND_RECORDS', masterView: MEASUREMENTS_AND_RECORDS_VIEW },
        providers: [
          { provide: MasterDataService, useExisting: MeasurementsAndRecordsService },
          { provide: MODAL_COMPONENT, useValue: MeasurementsAndRecordsDialogComponent },
          MasterDataStore,
        ],
      },
    ],
  },
];
