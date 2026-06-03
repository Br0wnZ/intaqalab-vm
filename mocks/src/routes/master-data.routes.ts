import type { Request, Response } from 'express';
import { Router } from 'express';

import { clientsDispatch } from '../fixtures/clients/clients-dispatcher';
import { linesOfShootDispatcher } from '../fixtures/lines-of-shoot/lines-of-shoot-dispatcher';
import { masterDataDimensionDispatcher } from '../fixtures/master-data/dimension/dimension-dispatcher';
import { masterDataDocumentTypeslDispatcher } from '../fixtures/master-data/document-type/document-type-dispatcher';
import { masterDataFuzeTypeslDispatcher } from '../fixtures/master-data/fuze-type/fuze-type-dispatcher';
import { impactZonesDispatcher } from '../fixtures/master-data/impact-zones-dispatcher';
import { masterDataLoadingAreaDenominationsDispatcher } from '../fixtures/master-data/loading-zone/denominations-loading-zone/denominations-loading-zone-dispatcher';
import { masterDataLoadingAreaDispatcher } from '../fixtures/master-data/loading-zone/loading-zone-dispatcher';
import { masterDataMaterialDispatcher } from '../fixtures/master-data/material/material-dispatcher';
import { masterDataStanagDispatcher } from '../fixtures/master-data/stanag/stanag-dispatcher';
import { targetDimensionsDispatcher } from '../fixtures/master-data/target-dimensions-dispatcher';
import { targetMaterialsDispatcher } from '../fixtures/master-data/target-materials-dispatcher';
import { targetThicknessesDispatcher } from '../fixtures/master-data/target-thicknesses-dispatcher';
import { masterDataTargetTypeDispatcher } from '../fixtures/master-data/target-type/target-type-dispatcher';
import { targetTypesDispatcher } from '../fixtures/master-data/target-types-dispatcher';
import { masterDataTrialTypeDispatcher } from '../fixtures/master-data/trial-type/trial-type-dispatcher';
import { trialsTypeDispatch } from '../fixtures/trials/trials-type-dispatcher';

export const masterDataRouter = Router();

masterDataRouter.get('/clients', (req, res) => {
  const dataToSend = clientsDispatch(req);
  res.send(dataToSend);
});

masterDataRouter.get('/users', (req, res) => {
  const page = parseInt((req.query.page as string) || '1', 10);
  const pageSize = parseInt((req.query.pageSize as string) || '25', 10);
  const mockUsers = [
    { id: 'b01a0e23-da71-3a08-9893-11b8b2dfb069', username: 'Usuario CET 1', roles: ['SYSTEM_ADMIN'] },
    { id: 'd6d77053-92bc-3af6-b332-8bea8c4c6904', username: 'Usuario CET 2', roles: ['ADMINISTRATIVE'] },
    { id: '3d58ce20-fe80-3793-a0b2-21905baa60b3', username: 'Usuario CET 3', roles: ['TRIAL_ADMIN'] },
  ];
  res.send({
    page,
    pageSize,
    totalElements: mockUsers.length,
    items: mockUsers,
  });
});

// Lines of Shoot — swagger: GET /centers/{centerId}/lines-of-shoot → MasterDataI18nListResponse
const linesOfShootHandler = (req: Request, res: Response) => res.send(linesOfShootDispatcher(req));

masterDataRouter.get('/:centerId/lines-of-shoot', linesOfShootHandler);

masterDataRouter.post('/:centerId/lines-of-shoot', (req: Request, res: Response) => res.status(201).send(req.body));
masterDataRouter.put('/:centerId/lines-of-shoot/:id', (req: Request, res: Response) => res.status(200).send(req.body));
masterDataRouter.delete('/:centerId/lines-of-shoot/:id', (req: Request, res: Response) => res.status(204).send());

// MASTERS --> DOCUMENT TYPES (global endpoint)
masterDataRouter.get('/document-types', (req, res) => {
  const { pageSize = 25, page = 1 } = req.query;
  const pageSizeNumber = parseInt(pageSize as string, 10);
  const pageNumber = parseInt(page as string, 10);

  const dataToSend = masterDataDocumentTypeslDispatcher({
    pageSize: pageSizeNumber,
    page: pageNumber,
  });
  res.status(200).send(dataToSend);
});

masterDataRouter.post('/document-types', (req: Request, res: Response) => {
  res.status(201).send({
    id: '019a2ad8-cccc-cccc-cccc-000000000000',
    ...req.body,
    label: Object.values(req.body.name ?? {})[0] ?? '',
  });
});

masterDataRouter.put('/document-types/:documentTypeId', (req: Request, res: Response) => {
  res
    .status(200)
    .send({ id: req.params['documentTypeId'], ...req.body, label: Object.values(req.body.name ?? {})[0] ?? '' });
});

masterDataRouter.delete('/document-types/:documentTypeId', (req: Request, res: Response) => {
  res.status(204).send();
});

//  MASTERS --> TRIAL TYPE //
const fireTrialTypesHandler = (req: Request, res: Response) => {
  const { pageSize = 10, page = 1 } = req.query;
  const pageSizeNumber = parseInt(pageSize as string, 10);
  const pageNumber = parseInt(page as string, 10);

  if (pageSizeNumber === 100) {
    const dataToSend = trialsTypeDispatch(req);
    res.send(dataToSend);
  } else {
    const dataToSend = masterDataTrialTypeDispatcher({
      pageSize: pageSizeNumber,
      page: pageNumber,
    });
    res.status(200).send(dataToSend);
  }
};

masterDataRouter.get('/fire-trial-types', fireTrialTypesHandler);
masterDataRouter.get('/:centerId/fire-trial-types', fireTrialTypesHandler);

masterDataRouter.post(['/fire-trial-types', '/:centerId/fire-trial-types'], (req: Request, res: Response) => {
  res.status(200).send(req.body);
});

masterDataRouter.put(['/fire-trial-types/:id', '/:centerId/fire-trial-types/:id'], (req: Request, res: Response) => {
  res.status(200).send(req.body);
});

masterDataRouter.delete(['/fire-trial-types/:id', '/:centerId/fire-trial-types/:id'], (req: Request, res: Response) => {
  res.status(200).send(req.body);
});
// END

// MASTERS --> DOCUMENT TYPE //
masterDataRouter.get('/:centerId/master-data/document-types', (req, res) => {
  const { pageSize = 10, page = 1 } = req.query;
  const pageSizeNumber = parseInt(pageSize as string, 10);
  const pageNumber = parseInt(page as string, 10);

  const dataToSend = masterDataDocumentTypeslDispatcher({
    pageSize: pageSizeNumber,
    page: pageNumber,
  });
  res.status(200).send(dataToSend);
});
masterDataRouter.post('/:centerId/master-data/document-types', (req, res) => {
  res.status(200).send(req.body);
});
masterDataRouter.put('/:centerId/master-data/document-types/:id', (req, res) => {
  res.status(200).send(req.body);
});

masterDataRouter.delete('/:centerId/master-data/document-types/:id', (req, res) => {
  res.status(200).send(req.body);
});
// END //

// MASTERS --> TARGET TYPE //
masterDataRouter.get('/:centerId/target-types', (req, res) => {
  const { pageSize = 10, page = 1 } = req.query;
  const pageSizeNumber = parseInt(pageSize as string, 10);
  const pageNumber = parseInt(page as string, 10);

  if (pageSizeNumber === 100) {
    const acceptLanguage: 'es' | 'en' = req.get('Accept-Language') as 'es' | 'en';
    const dataToSend = targetTypesDispatcher(req);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dataToSend.map((item: any) => {
      item.label = item.name[acceptLanguage];
    });
    res.status(200).send(dataToSend);
  } else {
    const dataToSend = masterDataTargetTypeDispatcher({
      pageSize: pageSizeNumber,
      page: pageNumber,
    });
    res.status(200).send(dataToSend);
  }
});
masterDataRouter.post('/:centerId/target-types', (req, res) => {
  res.status(200).send(req.body);
});
masterDataRouter.put('/:centerId/target-types/:id', (req, res) => {
  res.status(200).send(req.body);
});

masterDataRouter.delete('/:centerId/target-types/:id', (req, res) => {
  res.status(200).send(req.body);
});

// MASTERS --> MATERIAL //
masterDataRouter.get('/:centerId/target-materials', (req, res) => {
  const { pageSize = 10, page = 1 } = req.query;
  const pageSizeNumber = parseInt(pageSize as string, 10);
  const pageNumber = parseInt(page as string, 10);

  if (pageSizeNumber === 100) {
    const dataToSend = targetMaterialsDispatcher(req);
    const acceptLanguage: 'es' | 'en' = req.get('Accept-Language') as 'es' | 'en';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dataToSend.map((item: any) => {
      item.label = item.name[acceptLanguage];
    });
    res.status(200).send(dataToSend);
  } else {
    const dataToSend = masterDataMaterialDispatcher({
      pageSize: pageSizeNumber,
      page: pageNumber,
    });
    res.status(200).send(dataToSend);
  }
});
masterDataRouter.post('/:centerId/target-materials', (req, res) => {
  res.status(200).send(req.body);
});
masterDataRouter.put('/:centerId/target-materials/:id', (req, res) => {
  res.status(200).send(req.body);
});

masterDataRouter.delete('/:centerId/target-materials/:id', (req, res) => {
  res.status(200).send(req.body);
});
// END //

// MASTERS --> DIMENSION //
masterDataRouter.get('/:centerId/target-dimensions', (req, res) => {
  const { pageSize = 10, page = 1 } = req.query;
  const pageSizeNumber = parseInt(pageSize as string, 10);
  const pageNumber = parseInt(page as string, 10);

  if (pageSizeNumber === 100) {
    const dataToSend = targetDimensionsDispatcher(req);
    res.status(200).send(dataToSend);
  } else {
    const dataToSend = masterDataDimensionDispatcher({
      pageSize: pageSizeNumber,
      page: pageNumber,
    });
    res.status(200).send(dataToSend);
  }
});
masterDataRouter.post('/:centerId/target-dimensions', (req, res) => {
  res.status(200).send(req.body);
});
masterDataRouter.put('/:centerId/target-dimensions/:id', (req, res) => {
  res.status(200).send(req.body);
});

masterDataRouter.delete('/:centerId/target-dimensions/:id', (req, res) => {
  res.status(200).send(req.body);
});
// END //

// MASTERS --> FUZE TYPE //
masterDataRouter.get('/:centerId/fuse-working-modes', (req, res) => {
  const { pageSize = 10, page = 1 } = req.query;
  const pageSizeNumber = parseInt(pageSize as string, 10);
  const pageNumber = parseInt(page as string, 10);

  const dataToSend = masterDataFuzeTypeslDispatcher({
    pageSize: pageSizeNumber,
    page: pageNumber,
  });
  res.status(200).send(dataToSend);
});
masterDataRouter.post('/:centerId/fuse-working-modes', (req, res) => {
  res.status(200).send(req.body);
});
masterDataRouter.put('/:centerId/fuse-working-modes/:id', (req, res) => {
  res.status(200).send(req.body);
});

masterDataRouter.delete('/:centerId/fuse-working-modes/:id', (req, res) => {
  res.status(200).send(req.body);
});

// Obtener espesores de objetivos
masterDataRouter.get('/centers/:centerId/target-thicknesses', (req, res) => {
  const dataToSend = targetThicknessesDispatcher(req);
  res.status(200).send(dataToSend);
});

// Obtener zonas de impacto
masterDataRouter.get('/centers/:centerId/impact-zones', (req, res) => {
  const dataToSend = impactZonesDispatcher(req);
  const acceptLanguage: 'es' | 'en' = req.get('Accept-Language') as 'es' | 'en';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataToSend.map((item: any) => {
    item.label = item.name[acceptLanguage];
  });

  res.status(200).send(dataToSend);
});

// MASTERS --> LOADING_ZONE
masterDataRouter.get('/:centerId/master-data/loading-zone', (req, res) => {
  const { pageSize = 10, page = 1 } = req.query;
  const pageSizeNumber = parseInt(pageSize as string, 10);
  const pageNumber = parseInt(page as string, 10);

  const dataToSend = masterDataLoadingAreaDispatcher({
    pageSize: pageSizeNumber,
    page: pageNumber,
  });

  res.status(200).send(dataToSend);
});

masterDataRouter.post('/:centerId/master-data/loading-zone', (req, res) => {
  res.status(200).send(req.body);
});
masterDataRouter.put('/:centerId/master-data/loading-zone/:id', (req, res) => {
  res.status(200).send(req.body);
});
masterDataRouter.delete('/:centerId/master-data/loading-zone/:id', (req, res) => {
  res.status(200).send(req.body);
});

// Obtener zonas de carga para select
masterDataRouter.get('/:centerId/master-data/denominations-loading-zone', (req, res) => {
  const dataToSend = masterDataLoadingAreaDenominationsDispatcher();

  res.status(200).send(dataToSend);
});

// MASTERS --> STANAG
masterDataRouter.get('/:centerId/master-data/stanag', (req, res) => {
  const { pageSize = 10, page = 1 } = req.query;
  const pageSizeNumber = parseInt(pageSize as string, 10);
  const pageNumber = parseInt(page as string, 10);

  const dataToSend = masterDataStanagDispatcher({
    pageSize: pageSizeNumber,
    page: pageNumber,
  });

  res.status(200).send(dataToSend);
});

masterDataRouter.post('/:centerId/master-data/stanag', (req, res) => {
  res.status(200).send(req.body);
});
masterDataRouter.put('/:centerId/master-data/stanag/:id', (req, res) => {
  res.status(200).send(req.body);
});
masterDataRouter.delete('/:centerId/master-data/stanag/:id', (req, res) => {
  res.status(200).send(req.body);
});
