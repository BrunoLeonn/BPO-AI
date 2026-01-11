
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, FileText, Upload, Settings, TrendingUp, ChevronRight, 
  Loader2, Sparkles, Building2, FileCheck, AlertCircle, X, Trash2, 
  Users, ShieldCheck, HeartPulse, Landmark, ArrowUpRight,
  FileSearch, CheckCircle, Clock, ListOrdered, Calendar, BarChart3,
  CreditCard, Search, ArrowDownUp, Filter, Printer, Download, AlertTriangle,
  Lock, LogOut, UserCircle, Mail, Key, User
} from 'lucide-react';
import { CompanyProfile, Transaction, CRMClient, AIAdvice, BankAccount, TransactionType } from './types';
import { Dashboard } from './components/Dashboard';
import { DRE, DFC } from './components/FinancialReports';
import { processStatementFile, analyzeCNPJCard, generateAIStrategy } from './geminiService';

// Componente de Logo fiel à imagem enviada
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
  // Estados de Autenticação
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'cliente' | 'gestor' | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  // Multi-cliente Contexto
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Estados com Persistência LocalStorage Robustos
  const [company, setCompany] = useState<CompanyProfile>(() => {
    try {
      const saved = localStorage.getItem('flowfin_company');
      return saved ? JSON.parse(saved) : { name: '', cnpj: '', industry: '', fiscalYear: '2024' };
    } catch (e) {
      return { name: '', cnpj: '', industry: '', fiscalYear: '2024' };
    }
  });

  const [crm, setCRM] = useState<CRMClient[]>(() => {
    try {
      const saved = localStorage.getItem('flowfin_crm');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('flowfin_transactions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
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

  // Auto-Save Effect
  useEffect(() => {
    localStorage.setItem('flowfin_company', JSON.stringify(company));
  }, [company]);

  useEffect(() => {
    localStorage.setItem('flowfin_crm', JSON.stringify(crm));
  }, [crm]);

  useEffect(() => {
    localStorage.setItem('flowfin_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Filtragem de Transações por Cliente Selecionado
  const filteredTransactions = useMemo(() => {
    if (!selectedClientId) return [];
    return transactions.filter(t => t.costCenter === selectedClientId);
  }, [transactions, selectedClientId]);

  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => setErrorToast(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

  // Lógica de Login
  const handleLogin = (role: 'cliente' | 'gestor') => {
    setUserRole(role);
    setIsAuthenticated(true);
    if (role === 'gestor') {
      setActiveTab('crm');
    } else {
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

  // Funções de Processamento
  const handleCNPJUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsProcessingCNPJ(true);
      setErrorToast(null);
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
          setCRM(prevCRM => [newClient, ...prevCRM]);
          
        } catch (err: any) {
          console.error(err);
          setErrorToast('Erro ao processar CNPJ.');
        } finally {
          setIsProcessingCNPJ(false);
        }
      };
    }
  };

  const handleStatementUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (!selectedClientId) {
        setErrorToast('Selecione um cliente antes de importar extratos.');
        return;
      }

      setIsProcessingStatements(true);
      setErrorToast(null);
      const newFiles: File[] = Array.from(e.target.files);
      
      const initialFiles: FileStatus[] = newFiles.map(f => ({ 
        name: f.name, 
        size: f.size,
        status: 'waiting' as const,
        progress: 0
      }));
      setUploadedFiles(prev => [...prev, ...initialFiles]);
      
      const allNewTransactions: Transaction[] = [];

      for (const file of newFiles) {
        setUploadedFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'loading' } : f));
        
        const progressInterval = setInterval(() => {
          setUploadedFiles(prev => prev.map(f => {
            if (f.name === file.name && f.status === 'loading' && f.progress < 92) {
              const increment = Math.max(0.5, 5 / (file.size / 100000));
              return { ...f, progress: Math.min(92, f.progress + increment) };
            }
            return f;
          }));
        }, 150);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        await new Promise((resolve) => {
          reader.onload = async () => {
            const base64 = (reader.result as string).split(',')[1];
            try {
              const result = await processStatementFile(company, { 
                data: base64, 
                mimeType: file.type, 
                fileName: file.name 
              });
              
              const transactionsWithClient = result.map(t => ({ ...t, costCenter: selectedClientId! }));
              
              allNewTransactions.push(...transactionsWithClient);
              clearInterval(progressInterval);
              setUploadedFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'done', progress: 100 } : f));
            } catch (err: any) {
              clearInterval(progressInterval);
              setUploadedFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'error', errorMessage: 'IA Ocupada' } : f));
            }
            resolve(true);
          };
        });
      }

      setTransactions(prev => {
        const combined = [...prev, ...allNewTransactions];
        const sorted = combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const banksFound = Array.from(new Set(sorted.filter(t => t.costCenter === selectedClientId).map(t => t.bankName)));
        const newAccounts = banksFound.map(bank => {
          const bankTransactions = sorted.filter(t => t.bankName === bank && t.costCenter === selectedClientId);
          const balance = bankTransactions.reduce((acc, t) => acc + (t.type === TransactionType.INCOME ? t.amount : -Math.abs(t.amount)), 0);
          return {
            id: bank,
            bankName: bank,
            companyName: company.name || 'Empresa Cliente',
            currentBalance: balance,
            accountNumber: 'Sincronizado',
            agency: '---',
            lastUpdated: new Date().toLocaleDateString()
          };
        });
        setBankAccounts(newAccounts);

        return sorted;
      });

      setIsProcessingStatements(false);
    }
  };

  const loadStrategy = async () => {
    if (filteredTransactions.length === 0) return;
    setIsProcessingStrategy(true);
    try {
      const advice = await generateAIStrategy(company, filteredTransactions);
      setAIAdvice(advice);
      setActiveTab('strategy');
    } catch (err: any) {
      setErrorToast('Erro ao gerar consultoria.');
    } finally {
      setIsProcessingStrategy(false);
    }
  };

  const handlePrint = () => {
    setIsExporting(true);
    setTimeout(() => {
      window.focus();
      window.print();
      setIsExporting(false);
    }, 400);
  };

  const NavItem = ({ id, icon: Icon, label, disabled = false }: { id: any, icon: any, label: string, disabled?: boolean }) => (
    <button
      disabled={disabled}
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-3 w-full p-3 rounded-xl transition-all ${
        activeTab === id ? 'bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow-lg shadow-blue-100' : 
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
        <div className="mb-12 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-500">
          <FlowFinLogo className="w-24 h-24 bg-white p-4 rounded-[2rem] shadow-2xl shadow-blue-100 mb-6" />
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">FLOWFIN</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Fluxo Gestão Financeira</p>
        </div>

        {authView === 'login' ? (
          <div className="w-full max-w-4xl space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <button 
                onClick={() => handleLogin('cliente')}
                className="group relative bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-blue-400 transition-all text-left overflow-hidden active:scale-95"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 group-hover:bg-blue-600/10 transition-colors"></div>
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg shadow-blue-50">
                  <Building2 size={32} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Acesso Cliente</h2>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Importe seus extratos, visualize seus relatórios e acompanhe a saúde do seu negócio.
                </p>
                <div className="mt-8 flex items-center text-blue-600 font-black text-sm uppercase tracking-widest">
                  Entrar como Cliente <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              <button 
                onClick={() => handleLogin('gestor')}
                className="group relative bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-emerald-400 transition-all text-left overflow-hidden active:scale-95"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors"></div>
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-lg shadow-emerald-50">
                  <ShieldCheck size={32} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Acesso Gestor</h2>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Gestão de carteira de clientes, CRM avançado e consultoria estratégica via IA.
                </p>
                <div className="mt-8 flex items-center text-emerald-600 font-black text-sm uppercase tracking-widest">
                  Entrar como Gestor <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>

            <div className="flex flex-col items-center space-y-6">
              <button 
                className="flex items-center justify-center w-full max-w-sm bg-white border border-slate-200 p-4 rounded-2xl font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all active:scale-95"
              >
                <GoogleLogo />
                Continuar com Google
              </button>
              
              <button 
                onClick={() => setAuthView('register')}
                className="text-blue-600 font-bold hover:underline"
              >
                Não tem uma conta? Cadastre-se aqui
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-lg bg-white p-12 rounded-[3rem] border border-slate-200 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tighter">Crie sua conta</h2>
            
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleLogin('cliente'); }}>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder="Seu nome" className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-medium" required />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">E-mail Corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="email" placeholder="email@empresa.com" className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-medium" required />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Senha</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-medium" required />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Tipo de Perfil</label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="relative cursor-pointer">
                    <input type="radio" name="reg-role" className="peer sr-only" defaultChecked />
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center font-bold text-slate-500 peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 transition-all">
                      Sou Empresa
                    </div>
                  </label>
                  <label className="relative cursor-pointer">
                    <input type="radio" name="reg-role" className="peer sr-only" />
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center font-bold text-slate-500 peer-checked:bg-emerald-500 peer-checked:text-white peer-checked:border-emerald-500 transition-all">
                      Sou Gestor
                    </div>
                  </label>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black text-lg shadow-xl hover:bg-slate-800 transition-all active:scale-95 mt-4"
              >
                Cadastrar agora
              </button>

              <div className="pt-6 text-center">
                <button 
                  type="button"
                  onClick={() => setAuthView('login')}
                  className="text-slate-400 font-bold hover:text-slate-600 transition-colors"
                >
                  Já tem uma conta? Entre aqui
                </button>
              </div>
            </form>
          </div>
        )}

        <p className="mt-12 text-slate-400 font-medium text-sm uppercase tracking-widest">
          Powered by <span className="text-blue-600 font-bold">Bruno Leonn</span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-inter">
      <style>
        {`
          @media print {
            aside, nav, button, .no-print, .upload-section { display: none !important; }
            main { padding: 0 !important; overflow: visible !important; height: auto !important; width: 100% !important; background: white !important; }
            .print-only { display: block !important; }
            .report-page { page-break-after: always; padding: 2rem; border: none !important; box-shadow: none !important; }
            .recharts-responsive-container { width: 100% !important; height: 350px !important; }
            #root { height: auto !important; }
            .max-w-6xl { max-width: 100% !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        `}
      </style>

      {errorToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-4 border border-slate-700">
            <AlertTriangle size={20} className="text-emerald-400" />
            <p className="font-bold text-sm">{errorToast}</p>
            <button onClick={() => setErrorToast(null)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col no-print">
        <div className="p-8">
          <div className="flex flex-col space-y-1 mb-10">
            <div className="flex items-center space-x-3">
              <FlowFinLogo className="w-10 h-10" />
              <div>
                <span className="text-2xl font-black tracking-tighter text-slate-900 block leading-none">FLOWFIN</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Fluxo Gestão Financeira</span>
              </div>
            </div>
          </div>

          <nav className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-300px)]">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-3">Gestão</div>
            <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard BI" disabled={filteredTransactions.length === 0} />
            <NavItem id="strategy" icon={HeartPulse} label="Consultoria Flow" disabled={filteredTransactions.length === 0} />
            <NavItem id="full-report" icon={FileCheck} label="Relatório Final" disabled={filteredTransactions.length === 0 || !aiAdvice} />
            <NavItem id="dre" icon={FileText} label="Relatório DRE" disabled={filteredTransactions.length === 0} />
            <NavItem id="dfc" icon={TrendingUp} label="Fluxo de Caixa" disabled={filteredTransactions.length === 0} />
            
            <div className="pt-6 pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-3">Operacional</div>
            <NavItem id="upload" icon={Upload} label="Importar Dados" />
            <NavItem id="banks" icon={Building2} label="Contas Bancárias" disabled={bankAccounts.length === 0} />
            <NavItem id="transactions" icon={ArrowDownUp} label="Extrato Consolidado" disabled={filteredTransactions.length === 0} />
            {userRole === 'gestor' && <NavItem id="crm" icon={Users} label="Clientes CRM" />}
            <NavItem id="setup" icon={Settings} label="Onboarding IA" />
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-100 space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Empresa Ativa</p>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${company.name ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
              <p className="text-sm font-bold truncate text-slate-800">{company.name || 'Aguardando Seleção'}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-[10px] ${userRole === 'gestor' ? 'bg-emerald-500' : 'bg-blue-600'}`}>
                {userRole === 'gestor' ? 'GS' : 'CL'}
              </div>
              <p className="text-xs font-black text-slate-600 uppercase truncate max-w-[80px]">{userRole}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
          <p className="text-center text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2">
            Powered by <span className="text-blue-600 font-bold">Bruno Leonn</span>
          </p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-10">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'setup' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 no-print">
              <div className="bg-gradient-to-br from-blue-700 to-emerald-600 p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute right-[-20px] top-[-20px] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <FlowFinLogo className="w-16 h-16 bg-white rounded-2xl p-2 mb-8 shadow-2xl" />
                  <h2 className="text-5xl font-black mb-4 tracking-tighter">Onboarding Inteligente</h2>
                  <p className="text-blue-50 text-xl max-w-xl opacity-90 leading-relaxed">
                    Comece o fluxo enviando o Cartão CNPJ do seu cliente. Nossa IA irá configurar todo o plano de contas automaticamente.
                  </p>
                  <div className="mt-12">
                    <button 
                      onClick={() => cnpjInputRef.current?.click()}
                      disabled={isProcessingCNPJ}
                      className="bg-white text-blue-900 px-10 py-5 rounded-2xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center disabled:opacity-50"
                    >
                      {isProcessingCNPJ ? <Loader2 className="animate-spin mr-3" /> : <Landmark className="mr-3" />}
                      {isProcessingCNPJ ? 'Analisando Empresa...' : 'Fazer Upload CNPJ'}
                    </button>
                    <input type="file" ref={cnpjInputRef} className="hidden" accept="application/pdf,image/*" onChange={handleCNPJUpload} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'full-report' && aiAdvice && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div className="flex items-center justify-between no-print">
                 <div>
                    <h2 className="text-3xl font-black text-slate-900">Relatório Estratégico FlowFin</h2>
                    <p className="text-slate-400 font-bold mt-1">Visão BI 360º para tomadas de decisão.</p>
                 </div>
                 <button 
                  onClick={handlePrint}
                  disabled={isExporting}
                  className="bg-gradient-to-r from-blue-600 to-emerald-500 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-100 hover:scale-105 active:scale-95 transition-all flex items-center disabled:opacity-70"
                 >
                   {isExporting ? <Loader2 className="animate-spin mr-2" /> : <Printer className="mr-2" size={20} />}
                   {isExporting ? 'Processando Relatório...' : 'Gerar PDF para o Cliente'}
                 </button>
              </div>

              <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
                <div className="bg-slate-900 p-20 text-white relative overflow-hidden report-page">
                   <div className="absolute right-0 top-0 w-1/2 h-full bg-emerald-500 skew-x-12 translate-x-32 opacity-10"></div>
                   <div className="relative z-10">
                      <div className="flex items-center space-x-4 mb-12">
                         <div className="bg-white p-3 rounded-2xl shadow-xl">
                            <FlowFinLogo className="w-12 h-12" />
                         </div>
                         <div>
                            <span className="text-4xl font-black tracking-tighter">FLOWFIN</span>
                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Fluxo Gestão Financeira</p>
                         </div>
                      </div>
                      <h1 className="text-7xl font-black mb-6 tracking-tighter leading-tight">Análise Executiva<br/>Financeira</h1>
                      <div className="flex flex-wrap gap-16 mt-16">
                         <div>
                            <p className="text-blue-400 text-xs font-black uppercase tracking-widest mb-2">Cliente Parceiro</p>
                            <p className="text-3xl font-bold">{company.name || '---'}</p>
                         </div>
                         <div>
                            <p className="text-blue-400 text-xs font-black uppercase tracking-widest mb-2">Ano de Referência</p>
                            <p className="text-3xl font-bold">{company.fiscalYear}</p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="p-16 report-page bg-white">
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 items-center">
                      <div className="text-center">
                         <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-10">Saúde Financeira IA</h3>
                         <div className="relative w-64 h-64 mx-auto flex items-center justify-center aspect-square">
                            <svg viewBox="0 0 256 256" className="w-full h-full transform -rotate-90">
                               <circle cx="128" cy="128" r="115" stroke="currentColor" strokeWidth="22" fill="transparent" className="text-slate-100" />
                               <circle cx="128" cy="128" r="115" stroke="currentColor" strokeWidth="22" fill="transparent" 
                                       strokeDasharray={722} strokeDashoffset={722 - (722 * aiAdvice.healthScore) / 100}
                                       className={`${aiAdvice.healthScore > 70 ? 'text-emerald-500' : 'text-blue-500'}`} strokeLinecap="round" />
                            </svg>
                            <span className="absolute text-8xl font-black tracking-tighter text-slate-900">{aiAdvice.healthScore}</span>
                         </div>
                      </div>
                      <div className="lg:col-span-2">
                         <h3 className="text-3xl font-black mb-8 flex items-center text-slate-900">
                           <Sparkles className="mr-3 text-blue-600" /> Resumo Consultivo
                         </h3>
                         <p className="text-slate-600 leading-relaxed text-2xl font-medium italic border-l-[12px] border-emerald-100 pl-10 py-4">
                            "{aiAdvice.summary}"
                         </p>
                      </div>
                   </div>
                </div>

                <div className="p-16 report-page bg-slate-50">
                   <h3 className="text-3xl font-black text-slate-900 mb-12">Dashboards de Performance</h3>
                   <Dashboard transactions={filteredTransactions} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
             <div className="space-y-10 animate-in fade-in duration-500 no-print">
                <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-200">
                   <div className="flex items-center justify-between mb-12">
                      <div>
                         <h2 className="text-3xl font-black text-slate-900">Importação Automática</h2>
                         <p className="text-slate-400 font-bold text-lg mt-1">Sincronize arquivos bancários para o fluxo FlowFin.</p>
                      </div>
                      <button 
                         onClick={loadStrategy}
                         disabled={filteredTransactions.length === 0 || isProcessingStrategy}
                         className="bg-gradient-to-r from-blue-600 to-emerald-500 text-white px-10 py-5 rounded-2xl font-black shadow-xl hover:shadow-2xl transition-all flex items-center disabled:opacity-30"
                       >
                         {isProcessingStrategy ? <Loader2 className="animate-spin mr-3" /> : <Sparkles className="mr-3" />}
                         Gerar Análise FlowFin
                       </button>
                   </div>
                   
                   <div 
                     onClick={() => !isProcessingStatements && statementInputRef.current?.click()} 
                     className={`border-4 border-dashed rounded-[3rem] p-24 text-center transition-all cursor-pointer group
                       ${isProcessingStatements ? 'bg-slate-50 border-slate-200 cursor-wait' : 'border-slate-100 hover:border-blue-500 hover:bg-blue-50/50'}`}
                   >
                      <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 transition-all shadow-xl
                         ${isProcessingStatements ? 'bg-blue-100 text-blue-600' : 'bg-white text-slate-400 group-hover:bg-blue-600 group-hover:text-white'}`}>
                         {isProcessingStatements ? <Loader2 className="animate-spin" size={48} /> : <Upload size={48} />}
                      </div>
                      <p className="text-3xl font-black text-slate-800">
                         {isProcessingStatements ? 'Processando Fluxo...' : 'Importar Extratos Bancários'}
                      </p>
                      <p className="text-slate-400 font-bold mt-2">Arraste arquivos ou clique para selecionar</p>
                      <input type="file" ref={statementInputRef} className="hidden" multiple accept=".pdf,.ofx,.csv" onChange={handleStatementUpload} disabled={isProcessingStatements} />
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'banks' && (
             <div className="space-y-8 animate-in fade-in duration-500 no-print">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Contas Sincronizadas</h2>
                  <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-sm font-bold flex items-center hover:bg-slate-800 transition-colors">
                     <CreditCard className="mr-2" size={18} /> Conciliar Nova
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {bankAccounts.length === 0 ? (
                    <div className="col-span-full py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200 text-center text-slate-400 font-bold italic">
                      Nenhuma conta identificada nos extratos.
                    </div>
                  ) : (
                    bankAccounts.map(account => (
                      <div key={account.id} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16"></div>
                        <div className="flex items-start justify-between mb-8 relative z-10">
                          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-lg
                            ${account.bankName.toLowerCase().includes('santander') ? 'bg-red-500' : 
                              account.bankName.toLowerCase().includes('mercado') ? 'bg-blue-600' : 
                              account.bankName.toLowerCase().includes('itau') ? 'bg-orange-500' : 'bg-slate-800'}`}>
                            <Building2 size={32} />
                          </div>
                          <div className="text-right">
                             <h3 className="text-2xl font-black text-slate-900">{account.bankName}</h3>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{account.companyName}</p>
                          </div>
                        </div>
                        <div className="mb-10 space-y-1 relative z-10">
                           <p className="text-slate-500 text-sm font-bold">Status: Ativo e Conciliado</p>
                           <p className="text-slate-400 text-xs font-medium">Conta detectada via Processamento IA</p>
                        </div>
                        <div className="pt-8 border-t border-slate-100 relative z-10">
                           <p className="text-xs font-black text-slate-400 uppercase mb-2">Saldo Projetado</p>
                           <p className="text-4xl font-black text-emerald-600 tracking-tighter">
                             {account.currentBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                           </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
             </div>
          )}

          {activeTab === 'transactions' && (
            <div className="animate-in fade-in duration-500 no-print">
               <div className="flex items-center justify-between mb-10">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Extrato Consolidado Flow</h2>
                  <div className="flex space-x-3">
                     <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all"><Filter size={20}/></button>
                     <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all"><Search size={20}/></button>
                  </div>
               </div>
               <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                             <th className="px-8 py-6">Data</th>
                             <th className="px-8 py-6">Origem/Banco</th>
                             <th className="px-8 py-6">Descrição da Transação</th>
                             <th className="px-8 py-6">Categoria IA</th>
                             <th className="px-8 py-6 text-right">Valor Líquido</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {filteredTransactions.length === 0 ? (
                            <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold italic">Sem lançamentos registrados.</td></tr>
                          ) : (
                            filteredTransactions.map(t => (
                              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                 <td className="px-8 py-8 text-sm font-bold text-slate-500">{new Date(t.date).toLocaleDateString()}</td>
                                 <td className="px-8 py-8">
                                    <span className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase">{t.bankName}</span>
                                 </td>
                                 <td className="px-8 py-8 text-sm font-black text-slate-800 uppercase tracking-tight">{t.description}</td>
                                 <td className="px-8 py-8">
                                    <div className="flex flex-col">
                                      <span className="text-blue-600 font-black text-[10px] uppercase">{t.category}</span>
                                      <span className="text-slate-400 font-bold text-[9px] uppercase">{t.subCategory}</span>
                                    </div>
                                 </td>
                                 <td className={`px-8 py-8 text-right font-black text-lg tracking-tighter ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-900'}`}>
                                    {t.type === TransactionType.INCOME ? '+' : '-'}{Math.abs(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                 </td>
                              </tr>
                            ))
                          )}
                       </tbody>
                    </table>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'crm' && (
            <div className="animate-in fade-in duration-500 no-print">
              <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tighter uppercase">Gestão de Clientes FlowFin</h2>
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-8 py-6">Empresa Cliente</th>
                        <th className="px-8 py-6">CNPJ / Cadastro</th>
                        <th className="px-8 py-6">Data Onboarding</th>
                        <th className="px-8 py-6 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {crm.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-8 py-20 text-center text-slate-300 font-bold text-xl italic">Inicie o onboarding para cadastrar clientes.</td>
                        </tr>
                      ) : (
                        crm.map(client => (
                          <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-8 py-8">
                              <p className="font-black text-slate-900 text-lg uppercase tracking-tight">{client.name}</p>
                              <p className="text-xs font-bold text-emerald-500 uppercase">{client.industry || 'Ramo Corporativo'}</p>
                            </td>
                            <td className="px-8 py-8 font-mono text-sm font-bold text-slate-500">{client.cnpj}</td>
                            <td className="px-8 py-8 text-sm font-bold text-slate-500">{client.onboardingDate}</td>
                            <td className="px-8 py-8 text-right">
                              <button 
                                onClick={() => { 
                                  setCompany(client); 
                                  setSelectedClientId(client.cnpj);
                                  setActiveTab('dashboard'); 
                                }} 
                                className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-6 py-3 rounded-2xl transition-all shadow-sm active:scale-95 font-bold flex items-center ml-auto"
                              >
                                Gerenciar <ArrowUpRight size={18} className="ml-2" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && <div className="no-print animate-in fade-in duration-500"><Dashboard transactions={filteredTransactions} /></div>}
          {activeTab === 'dre' && <div className="no-print animate-in fade-in duration-500"><DRE transactions={filteredTransactions} /></div>}
          {activeTab === 'dfc' && <div className="no-print animate-in fade-in duration-500"><DFC transactions={filteredTransactions} /></div>}
          
          {activeTab === 'strategy' && aiAdvice && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 no-print">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-1 bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-10">Score de Liquidez</p>
                    <div className="relative w-56 h-56 flex items-center justify-center aspect-square">
                       <svg viewBox="0 0 256 256" className="w-full h-full transform -rotate-90">
                          <circle cx="128" cy="128" r="115" stroke="currentColor" strokeWidth="20" fill="transparent" className="text-slate-100" />
                          <circle cx="128" cy="128" r="115" stroke="currentColor" strokeWidth="20" fill="transparent" 
                                  strokeDasharray={722} strokeDashoffset={722 - (722 * aiAdvice.healthScore) / 100}
                                  className="text-emerald-500 transition-all duration-1000" strokeLinecap="round" />
                       </svg>
                       <span className="absolute text-7xl font-black tracking-tighter text-slate-900">{aiAdvice.healthScore}</span>
                    </div>
                  </div>
                  <div className="lg:col-span-2 bg-white p-16 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-center">
                    <h3 className="text-3xl font-black mb-8 flex items-center text-slate-900">
                      <Sparkles className="mr-3 text-blue-600" /> Consultoria FlowFin
                    </h3>
                    <p className="text-slate-600 leading-relaxed text-2xl font-medium italic border-l-[12px] border-emerald-100 pl-12 py-4">
                      "{aiAdvice.summary}"
                    </p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-emerald-50/50 p-10 rounded-[2.5rem] border border-emerald-100">
                     <h4 className="text-emerald-900 font-black mb-8 uppercase text-xs tracking-widest flex items-center">
                        <CheckCircle size={20} className="mr-2" /> Pontos de Eficiência
                     </h4>
                     <ul className="space-y-5">
                        {aiAdvice.strengths.map((s, i) => (
                           <li key={i} className="text-emerald-800 font-bold text-xl flex items-start">
                             <span className="mr-3 text-emerald-400 text-2xl">•</span> {s}
                           </li>
                        ))}
                     </ul>
                  </div>
                  <div className="bg-blue-50/50 p-10 rounded-[2.5rem] border border-blue-100">
                     <h4 className="text-blue-900 font-black mb-8 uppercase text-xs tracking-widest flex items-center">
                        <TrendingUp size={20} className="mr-2" /> Oportunidades Flow
                     </h4>
                     <ul className="space-y-5">
                        {aiAdvice.recommendations.map((r, i) => (
                           <li key={i} className="text-blue-800 font-bold text-xl flex items-start">
                             <span className="mr-3 text-blue-400 text-2xl">•</span> {r}
                           </li>
                        ))}
                     </ul>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
