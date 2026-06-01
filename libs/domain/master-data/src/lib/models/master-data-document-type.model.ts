export interface MasterDataDocumentType {
  id: string;
  name: { es: string; en: string };
  label: string;
  active: boolean;
  category: 'GENERAL' | 'SPECIFIC';
}
