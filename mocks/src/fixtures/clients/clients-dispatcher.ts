import type { Request } from 'express';

import { getFixture } from '../../utils';

/** Contrato del swagger: ClientListItemResponse */
interface ClientListItemResponse {
  id: string;
  name: string;
  email: string;
  identificationDocumentTypeId: 'CIF' | 'NIF' | 'NIE';
  identificationDocumentId: string;
}

/** Contrato del swagger: ClientListResponse */
interface ClientListResponse {
  totalElements: number;
  items: ClientListItemResponse[];
}

export function clientsDispatch(req: Request): ClientListResponse {
  const name = req.query['name']?.toString().toLowerCase();
  const email = req.query['email']?.toString().toLowerCase();
  const docType = req.query['documentType']?.toString();

  const items = getFixture<ClientListItemResponse[]>('fixtures/clients', 'clients-fixture.json').filter(
    (client) =>
      (!name || client.name.toLowerCase().includes(name)) &&
      (!email || client.email.toLowerCase().includes(email)) &&
      (!docType || client.identificationDocumentTypeId === docType),
  );

  return {
    totalElements: items.length,
    items,
  };
}
