export type Role = 'manager' | 'member';

export type Page = 'dashboard' | 'leads' | 'deals' | 'reports' | 'settings';

export interface UserData {
  name: string;
  initials: string;
  roleTitle: string;
}

export interface ReportMetrics {
  leads: string;
  deals: string;
  conversion: string;
  value: string;
  scopeDescription: string;
}

export interface ActivityMetrics {
  calls: string;
  emails: string;
  meetings: string;
}

export interface ToastState {
  visible: boolean;
  message: string;
}
