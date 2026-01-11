
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

// Componente de Logo institucional
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
  // 1. Estados de Autenticação e Visão
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'cliente' | 'gestor' | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'dre' | 'dfc' | 'upload' | 'setup' | 'crm' | 'strategy' | 'transactions' | 'banks' | 'full-report'>('setup');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // 2. Estados principais
  const [company, setCompany] = useState<CompanyProfile>({ name: '', cnpj: '', industry: '', fiscalYear: '2024' });
  const [crm, setCRM] = useState<CRMClient[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Estados de processamento e UI
  const [isProcessingCNPJ, setIsProcessingCNPJ] = useState(false);
  const [isProcessingStrategy, setIsProcessingStrategy] = useState(false);
  const [isProcessingStatements, setIsProcessingStatements] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [aiAdvice, setAIAdvice] = useState<AIAdvice | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileStatus[]>([]);
  
  const cnpjInputRef = useRef<HTMLInputElement>(null);
  const statementInputRef = useRef<HTMLInputElement>(null);

  // Ponte defensiva para API_KEY
  const checkApiKey = () => {
    return !!(window as any).process?.env?.API_KEY;
  };

  // 3. Fluxo de Inicialização Definitivo
  useEffect(() => {
    const hydrateData = () => {
      try {
        const savedCompany = localStorage.getItem('flowfin_company');
        if (savedCompany) {
          const parsed = JSON.parse(savedCompany);
          if (parsed && typeof parsed === 'object') setCompany(parsed);
        }

        const savedCRM = localStorage.getItem('flowfin_crm');
        if (savedCRM) {
          const parsed = JSON.parse(savedCRM);
          if (Array.isArray(parsed)) setCRM(parsed);
        }

        const savedTransactions = localStorage.getItem('flowfin_transactions');
        if (savedTransactions) {
          const parsed = JSON.parse(savedTransactions);
          if (Array.isArray(parsed)) setTransactions(parsed);
        }
      } catch (e) {
        console.error("Falha na hidratação segura do LocalStorage.", e);
      } finally {
        setIsHydrated(true);
      }
    };

    hydrateData();
  }, []);

  // 4. Persistência Segura
  useEffect(() => {
    if (isHydrated && company.cnpj) {
      localStorage.setItem('flowfin_company', JSON.stringify(company));
    }
  }, [company, isHydrated]);

  useEffect(() => {
    if (isHydrated && crm.length > 0) {
      localStorage.setItem('flowfin_crm', JSON.stringify(crm));
    }
  }, [crm, isHydrated]);

  useEffect(() => {
    if (isHydrated && transactions.length > 0) {
      localStorage.setItem('flowfin_transactions', JSON.stringify(transactions));
    }
  }, [transactions, isHydrated]);

  // Cálculos Memoizados
  const filteredTransactions = useMemo(() => {
    if (!selectedClientId) return [];
    return transactions.filter(t => t.costCenter === selectedClientId);
  }, [transactions, selectedClientId]);

  const bankAccounts = useMemo(() => {
    if (!selectedClientId) return [];
    
    const clientTransactions = transactions.filter(t => t.costCenter === selectedClientId);
    const banksFound = Array.from(new Set(clientTransactions.map(t => t.bankName)));
    
    return banksFound.map(bank => {
      const bankTransactions = clientTransactions.filter(t => t.bankName === bank);
      const balance = bankTransactions.reduce((acc, t) => 
        acc + (t.type === TransactionType.INCOME ? t.amount : -Math.abs(t.amount)), 0);
      
      return {
        id: bank,
        bankName: bank,
        companyName: company.name || 'Empresa Cliente',
        currentBalance: balance,
        accountNumber: 'Sincronizado',
        agency: '---',
        lastUpdated: new Date().toLocaleDateString()
      } as BankAccount;
    });
  }, [transactions, selectedClientId, company.name]);

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

  // Funções de Processamento com Verificação de Infraestrutura IA
  const handleCNPJUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!checkApiKey()) {
      setErrorToast('Sistema indisponível: Chave API não detectada no ambiente.');
      return;
    }

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
          setErrorToast('Erro ao processar CNPJ via IA.');
        } finally {
          setIsProcessingCNPJ(false);
        }
      };
    }
  };

  const handleStatementUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!checkApiKey()) {
      setErrorToast('IA indisponível no momento.');
      return;
    }

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
              setUploadedFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'error', errorMessage: 'Falha na IA' } : f));
            }
            resolve(true);
          };
        });
      }

      setTransactions(prev => {
        const combined = [...prev, ...allNewTransactions];
        return combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      });

      setIsProcessingStatements(false);
    }
  };

  const loadStrategy = async () => {
    if (!checkApiKey()) {
      setErrorToast('Chave API não configurada corretamente.');
      return;
    }
    if (filteredTransactions.length === 0) return;
    setIsProcessingStrategy(true);
    try {
      const advice = await generateAIStrategy(company, filteredTransactions);
      setAIAdvice(advice);
      setActiveTab('strategy');
    } catch (err: any) {
      setErrorToast('Erro ao gerar consultoria estratégica.');
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

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

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
              <button 
                type="submit"
                className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black text-lg shadow-xl hover:bg-slate-800 transition-all active:scale-95 mt-4"
              >
                Cadastrar agora
              </button>
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
            aside, nav, button, .no-print { display: none !important; }
            main { padding: 0 !important; overflow: visible !important; height: auto !important; width: 100% !important; background: white !important; }
            .report-page { page-break-after: always; padding: 2rem; border: none !important; box-shadow: none !important; }
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
            <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard BI" disabled={filteredTransactions.length === 0} />
            <NavItem id="strategy" icon={HeartPulse} label="Consultoria Flow" disabled={filteredTransactions.length === 0} />
            <NavItem id="full-report" icon={FileCheck} label="Relatório Final" disabled={filteredTransactions.length === 0 || !aiAdvice} />
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
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-[10px] bg-blue-600">
                {userRole === 'gestor' ? 'GS' : 'CL'}
              </div>
              <p className="text-xs font-black text-slate-600 uppercase truncate max-w-[80px]">{userRole}</p>
            </div>
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-all"><LogOut size={18} /></button>
          </div>
          <p className="text-center text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2">
            Powered by <span className="text-blue-600 font-bold">Bruno Leonn</span>
          </p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-10">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'setup' && (
            <div className="bg-gradient-to-br from-blue-700 to-emerald-600 p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden animate-in fade-in">
              <h2 className="text-5xl font-black mb-4 tracking-tighter">Onboarding IA</h2>
              <button 
                onClick={() => cnpjInputRef.current?.click()}
                disabled={isProcessingCNPJ}
                className="bg-white text-blue-900 px-10 py-5 rounded-2xl font-black shadow-2xl flex items-center"
              >
                {isProcessingCNPJ ? <Loader2 className="animate-spin mr-3" /> : <Landmark className="mr-3" />}
                {isProcessingCNPJ ? 'Analisando...' : 'Upload Cartão CNPJ'}
              </button>
              <input type="file" ref={cnpjInputRef} className="hidden" accept="application/pdf,image/*" onChange={handleCNPJUpload} />
            </div>
          )}

          {activeTab === 'full-report' && aiAdvice && (
            <div className="report-page bg-white p-16 rounded-[3rem] shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between mb-16 no-print">
                <h1 className="text-4xl font-black text-slate-900">Relatório Executivo</h1>
                <button onClick={handlePrint} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center"><Printer className="mr-2"/> Imprimir PDF</button>
              </div>
              <h2 className="text-7xl font-black mb-12 tracking-tighter text-slate-900 leading-tight">FlowFin Analysis<br/>{company.name}</h2>
              <div className="p-12 bg-slate-900 rounded-[2.5rem] text-white mb-16">
                 <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-4">Parecer do Consultor</h3>
                 <p className="text-3xl font-medium leading-relaxed italic">"{aiAdvice.summary}"</p>
              </div>
              <Dashboard transactions={filteredTransactions} />
              <div className="mt-20 pt-10 border-t border-slate-100 text-center opacity-50">
                <p className="text-[10px] font-black uppercase tracking-widest">
                   Powered by <span className="text-blue-600 font-bold">Bruno Leonn</span>
                </p>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
             <div className="bg-white p-12 rounded-[3rem] border border-slate-200 text-center animate-in fade-in">
                <div 
                  onClick={() => !isProcessingStatements && statementInputRef.current?.click()} 
                  className="border-4 border-dashed rounded-[3rem] p-24 cursor-pointer hover:border-blue-500 transition-all group"
                >
                   <Upload size={48} className="mx-auto mb-8 text-slate-300 group-hover:text-blue-600" />
                   <p className="text-3xl font-black text-slate-800">{isProcessingStatements ? 'Processando...' : 'Importar Extratos Bancários'}</p>
                   <input type="file" ref={statementInputRef} className="hidden" multiple accept=".pdf,.ofx,.csv" onChange={handleStatementUpload} />
                </div>
                <button 
                  onClick={loadStrategy} 
                  disabled={filteredTransactions.length === 0 || isProcessingStrategy}
                  className="mt-10 bg-blue-600 text-white px-10 py-5 rounded-2xl font-black disabled:opacity-30"
                >
                  {isProcessingStrategy ? 'Gerando...' : 'Gerar Consultoria FlowFin'}
                </button>
             </div>
          )}

          {activeTab === 'dashboard' && <Dashboard transactions={filteredTransactions} />}
          {activeTab === 'banks' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in">
                {bankAccounts.map(account => (
                   <div key={account.id} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                      <h3 className="text-2xl font-black mb-10">{account.bankName}</h3>
                      <p className="text-4xl font-black text-emerald-600 tracking-tighter">
                        {account.currentBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                   </div>
                ))}
             </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
