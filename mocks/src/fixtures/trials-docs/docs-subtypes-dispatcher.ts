import { getFixture } from '../../utils';

export interface DocumentSubtype {
  id: string;
  name: string;
}

export function docsSubtypesDispatcher() {
  const subtypes = getFixture('fixtures/trials-docs', 'docs-subtypes-fixture.json') as DocumentSubtype[];
  return subtypes;
}
