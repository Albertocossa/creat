
export enum ClientStatus {
  ACTIVE = 'Ativo',
  INACTIVE = 'Inativo',
  PROSPECT = 'Prospecto'
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: ClientStatus;
  notes: string;
  createdAt: string;
}

export interface CRMStats {
  totalClients: number;
  activeClients: number;
  prospects: number;
  recentActivity: number;
}
