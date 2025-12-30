
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
}

export interface CompanyProfile {
  name: string;
  industry: string;
  fiscalYear: string;
  customChartOfAccounts?: string[];
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  cashBalance: number;
}

export interface ReportData {
  name: string;
  value: number;
}
