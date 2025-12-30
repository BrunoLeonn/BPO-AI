
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  subCategory: string;
  costCenter: string;
  bankName: string;
  status: 'pending' | 'reconciled';
  confidence?: number; // Percentual de precisão da IA
}

export interface BankAccount {
  id: string;
  bankName: string;
  companyName: string;
  agency?: string;
  accountNumber?: string;
  currentBalance: number;
  lastUpdated: string;
}

export interface CompanyProfile {
  name: string;
  tradingName?: string;
  cnpj: string;
  industry: string;
  cnae?: string;
  address?: string;
  openingDate?: string;
  fiscalYear: string;
  customChartOfAccounts?: string[];
}

export interface CRMClient extends CompanyProfile {
  id: string;
  onboardingDate: string;
  healthScore?: number;
}

export interface AIAdvice {
  healthScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}
