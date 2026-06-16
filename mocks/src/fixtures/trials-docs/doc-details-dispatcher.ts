import type { Request } from 'express';

import { getFixture } from '../../utils';
import { getDocsStore } from './trials-docs-dispatcher';

export function trialsDocDetailsDispatch(req: Request) {
  const docId = req.params['documentId'];
  const store = getDocsStore();
  const found = store.find((d) => d.id === docId);

  if (found) {
    return {
      id: found.id,
      centerId: req.params['centerId'] || '019a2ad8-f9cc-7c55-b18b-f075cb2dd091f',
      name: found.name,
      category: found.category,
      type: found.type,
      versions: [
        {
          id: `019a2ad8-f9cc-7c55-b18b-f075b2dd091f`,
          versionTag: found.version || 'v1',
          isActive: true,
          createdBy: 'username',
          createdAt: found.createdAt || '2025-12-01T12:30:00Z',
        },
      ],
      createdBy: 'username',
      createdAt: found.createdAt || '2025-12-01T12:30:00Z',
      updatedAt: found.updatedAt || '2025-12-05T16:30:00Z',
    };
  }

  const documentDetail = getFixture('fixtures/trials-docs', 'doc-details-fixture.json');
  return {
    ...documentDetail,
    centerId: req.params['centerId'] || '019a2ad8-f9cc-7c55-b18b-f075cb2dd091f',
  };
}
