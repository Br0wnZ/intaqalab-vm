export interface CertificateApiResponse {
  page: number;
  pageSize: number;
  totalElements: number;
  items: Certificate[];
}

export interface Certificate {
  id: string;
  name: string;
  components: CertificateComponent[];
  createdBy: string;
  modifiedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateComponent {
  id: string;
  name: string;
}
