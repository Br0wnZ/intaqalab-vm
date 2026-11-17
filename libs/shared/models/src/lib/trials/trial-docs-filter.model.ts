import type { DocumentSubtype } from './document-subtype.model';
import type { TrialDocsStatus } from './trial-docs-status.enum';

export type TrialDocsFilter = {
  category: string;
  status: TrialDocsStatus;
  typeId: DocumentSubtype['id'];
};
