
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, FileText, Upload, Settings, TrendingUp, ChevronRight, 
  Loader2, Sparkles, Building2, FileCheck, AlertCircle, X, Trash2, 
  Users, ShieldCheck, HeartPulse, Landmark, ArrowUpRight,
  FileSearch, CheckCircle, Clock, ListOrdered, Calendar, BarChart3,
  CreditCard, Search, ArrowDownUp, Filter, Printer, Download, AlertTriangle,
  Lock, LogOut, UserCircle, Mail, Key, User
} from 'lucide-react';
import { CompanyProfile, Transaction, CRMClient, AIAdvice, BankAccount, TransactionType } from './types.ts';
import { Dashboard } from './components/Dashboard.tsx';
import { DRE, DFC } from './components/FinancialReports.tsx';
import { processStatementFile, analyzeCNPJCard, generateAIStrategy } from './geminiService.ts';

// Componente de Logo
const FlowFinLogo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <div className={`relative flex items-center ${className}`}>
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d="M20 20C20 20 45 20 65 20C75 20 80 25 80 35C80 40 75 45 65 45H35L20 80" stroke="#2563EB" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M35 55H70C80 55 85 60 85 70C85 75 80 80 70 80H40L25 55" stroke="#10B981" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"/>
    </svg>
  </div>
);

const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" className="mr-3">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

interface FileStatus {
  name: string;
  size: number;
  status: 'waiting' | 'loading' | 'done' | 'error';
  progress: number;
  errorMessage?: string;
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'cliente' | 'gestor' | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const [company, setCompany] = useState<CompanyProfile>(() => {
    try {
      const saved = localStorage.getItem('flowfin_company');
      return saved ? JSON.parse(saved) : { name: '', cnpj: '', industry: '', fiscalYear: '2024' };
    } catch (e) { return { name: '', cnpj: '', industry: '', fiscalYear: '2024' }; }
  });

  const [crm, setCRM] = useState<CRMClient[]>(() => {
    try {
      const saved = localStorage.getItem('flowfin_crm');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('flowfin_transactions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'dre' | 'dfc' | 'upload' | 'setup' | 'crm' | 'strategy' | 'transactions' | 'banks' | 'full-report'>('setup');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isProcessingCNPJ, setIsProcessingCNPJ] = useState(false);
  const [isProcessingStrategy, setIsProcessingStrategy] = useState(false);
  const [isProcessingStatements, setIsProcessingStatements] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [aiAdvice, setAIAdvice] = useState<AIAdvice | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileStatus[]>([]);
  
  const cnpjInputRef = useRef<HTMLInputElement>(null);
  const statementInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { localStorage.setItem('flowfin_company', JSON.stringify(company)); }, [company]);
  useEffect(() => { localStorage.setItem('flowfin_crm', JSON.stringify(crm)); }, [crm]);
  useEffect(() => { localStorage.setItem('flowfin_transactions', JSON.stringify(transactions)); }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (!selectedClientId) return [];
    return transactions.filter(t => t.costCenter === selectedClientId);
  }, [transactions, selectedClientId]);

  const handleLogin = (role: 'cliente' | 'gestor') => {
    setUserRole(role);
    setIsAuthenticated(true);
    if (role === 'gestor') setActiveTab('crm');
    else {
      if (company.cnpj) setSelectedClientId(company.cnpj);
      setActiveTab('setup');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setAuthView('login');
    setSelectedClientId(null);
  };

  const handleCNPJUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsProcessingCNPJ(true);
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        try {
          const data = await analyzeCNPJCard({ data: base64, mimeType: file.type });
          const updatedCompany = { ...company, ...data };
          setCompany(updatedCompany as CompanyProfile);
          if (data.cnpj) setSelectedClientId(data.cnpj);
          const newClient: CRMClient = {
            id: Math.random().toString(36).substr(2, 9),
            ...updatedCompany,
            onboardingDate: new Date().toLocaleDateString(),
            fiscalYear: '2024'
          } as CRMClient;
          setCRM(prev => [newClient, ...prev]);
        } catch (err) { setErrorToast('Erro no processamento.'); }
        finally { setIsProcessingCNPJ(false); }
      };
    }
  };

  const handleStatementUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && selectedClientId) {
      setIsProcessingStatements(true);
      // Fix: Explicitly cast e.target.files to File[] using Array.from to avoid 'unknown' type issues in the for-loop
      const newFiles = Array.from(e.target.files) as File[];
      const allNew: Transaction[] = [];

      for (const file of newFiles) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        await new Promise((resolve) => {
          reader.onload = async () => {
            try {
              const res = await processStatementFile(company, { 
                data: (reader.result as string).split(',')[1], 
                mimeType: file.type, fileName: file.name 
              });
              allNew.push(...res.map(t => ({ ...t, costCenter: selectedClientId })));
            } catch (e) {}
            resolve(true);
          };
        });
      }
      setTransactions(prev => [...prev, ...allNew]);
      setIsProcessingStatements(false);
    }
  };

  const NavItem = ({ id, icon: Icon, label, disabled = false }: { id: any, icon: any, label: string, disabled?: boolean }) => (
    <button
      disabled={disabled}
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-3 w-full p-3 rounded-xl transition-all ${
        activeTab === id ? 'bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow-lg' : 
        disabled ? 'opacity-30 cursor-not-allowed text-slate-400' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon size={18} />
      <span className="font-bold text-sm">{label}</span>
    </button>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-inter">
        <div className="mb-12 flex flex-col items-center">
          <FlowFinLogo className="w-24 h-24 bg-white p-4 rounded-[2rem] shadow-2xl mb-6" />
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">FLOWFIN</h1>
        </div>
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
           <button onClick={() => handleLogin('cliente')} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-xl text-left">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-8"><Building2 size={32} /></div>
              <h2 className="text-3xl font-black text-slate-900">Cliente</h2>
              <p className="text-slate-500 mt-2 font-medium">Acesse seus relatórios e fluxo.</p>
           </button>
           <button onClick={() => handleLogin('gestor')} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-xl text-left">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mb-8"><ShieldCheck size={32} /></div>
              <h2 className="text-3xl font-black text-slate-900">Gestor</h2>
              <p className="text-slate-500 mt-2 font-medium">Gestão de carteira e CRM.</p>
           </button>
        </div>
        <p className="mt-12 text-slate-400 font-medium text-sm">Powered by <span className="text-blue-600 font-bold">Bruno Leonn</span></p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-inter">
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col no-print">
        <div className="p-8">
          <div className="flex items-center space-x-3 mb-10">
            <FlowFinLogo className="w-10 h-10" />
            <span className="text-2xl font-black text-slate-900 tracking-tighter">FLOWFIN</span>
          </div>
          <nav className="space-y-1.5">
            <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard BI" disabled={filteredTransactions.length === 0} />
            <NavItem id="dre" icon={FileText} label="Relatório DRE" disabled={filteredTransactions.length === 0} />
            <NavItem id="upload" icon={Upload} label="Importar Dados" />
            {userRole === 'gestor' && <NavItem id="crm" icon={Users} label="Clientes CRM" />}
            <NavItem id="setup" icon={Settings} label="Onboarding IA" />
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-slate-100">
          <button onClick={handleLogout} className="flex items-center space-x-2 text-slate-400 hover:text-red-500 transition-colors">
            <LogOut size={18} /> <span className="font-bold text-sm">Sair</span>
          </button>
          <p className="text-center text-[8px] font-black text-slate-400 uppercase tracking-widest mt-4">Powered by <span className="text-blue-600 font-bold">Bruno Leonn</span></p>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-10">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'setup' && (
            <div className="bg-gradient-to-br from-blue-700 to-emerald-600 p-12 rounded-[3rem] text-white shadow-2xl">
              <h2 className="text-5xl font-black mb-4 tracking-tighter">Onboarding Inteligente</h2>
              <p className="text-blue-50 text-xl opacity-90">Suba o Cartão CNPJ para configurar a empresa.</p>
              <button onClick={() => cnpjInputRef.current?.click()} className="mt-10 bg-white text-blue-900 px-10 py-5 rounded-2xl font-black shadow-2xl transition-all">
                {isProcessingCNPJ ? 'Analisando...' : 'Upload CNPJ'}
              </button>
              <input type="file" ref={cnpjInputRef} className="hidden" onChange={handleCNPJUpload} />
            </div>
          )}
          {activeTab === 'dashboard' && <Dashboard transactions={filteredTransactions} />}
          {activeTab === 'dre' && <DRE transactions={filteredTransactions} />}
          {activeTab === 'crm' && (
             <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                      <tr><th className="px-8 py-6">Empresa</th><th className="px-8 py-6">CNPJ</th><th className="px-8 py-6 text-right">Ação</th></tr>
                   </thead>
                   <tbody>
                      {crm.map(c => (
                        <tr key={c.id} className="border-b">
                           <td className="px-8 py-6 font-black uppercase">{c.name}</td>
                           <td className="px-8 py-6 font-mono">{c.cnpj}</td>
                           <td className="px-8 py-6 text-right">
                              <button onClick={() => { setCompany(c); setSelectedClientId(c.cnpj); setActiveTab('dashboard'); }} className="text-blue-600 font-bold underline">Gerenciar</button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          )}
          {activeTab === 'upload' && (
            <div className="bg-white p-12 rounded-[3rem] border border-slate-200 text-center">
               <h2 className="text-3xl font-black mb-6">Importação de Extratos</h2>
               <div onClick={() => statementInputRef.current?.click()} className="border-4 border-dashed rounded-[3rem] p-20 cursor-pointer hover:bg-slate-50 transition-all">
                  <Upload className="mx-auto mb-4 text-slate-300" size={48} />
                  <p className="text-xl font-bold">Clique para selecionar arquivos</p>
                  <input type="file" multiple ref={statementInputRef} className="hidden" onChange={handleStatementUpload} />
               </div>
               {isProcessingStatements && <p className="mt-4 animate-pulse font-bold text-blue-600 text-sm">Processando transações via IA...</p>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
