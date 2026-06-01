export type Client = {
  id: string;
  name: string;
  email: string;
  /** @see swagger: identificationDocumentTypeId enum: CIF | NIF | NIE */
  identificationDocumentTypeId: 'CIF' | 'NIF' | 'NIE';
  identificationDocumentId: string;
};

/** Contrato del swagger: GET /clients → ClientListResponse */
export type ClientListResponse = {
  totalElements: number;
  items: Client[];
};
