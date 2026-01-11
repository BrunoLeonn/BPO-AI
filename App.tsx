
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, FileText, Upload, Settings, TrendingUp, ChevronRight, 
  Loader2, Sparkles, Building2, FileCheck, AlertCircle, X, Trash2, 
  Users, ShieldCheck, HeartPulse, Landmark, ArrowUpRight,
  CheckCircle, Clock, Calendar, BarChart3, CreditCard, Search, 
  ArrowDownUp, Filter, Printer, Download, AlertTriangle, LogOut, Mail, Key, User
} from 'lucide-react';
import { CompanyProfile, Transaction, CRMClient, AIAdvice, BankAccount, TransactionType } from './types';
import { Dashboard } from './components/Dashboard';
import { DRE, DFC } from './components/FinancialReports';
import { processStatementFile, analyzeCNPJCard, generateAIStrategy } from './geminiService';

const FlowFinLogo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <div className={`relative flex items-center ${className}`}>
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d="M20 20C20 20 45 20 65 20C75 20 80 25 80 35C80 40 75 45 65 45H35L20 80" stroke="#2563EB" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M35 55H70C80 55 85 60 85 70C85 75 80 80 70 80H40L25 55" stroke="#10B981" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"/>
    </svg>
  </div>
);

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'cliente' | 'gestor' | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'dre' | 'dfc' | 'upload' | 'setup' | 'crm' | 'strategy' | 'transactions' | 'banks' | 'full-report'>('setup');

  const [company, setCompany] = useState<CompanyProfile>(() => {
    const saved = localStorage.getItem('flowfin_company');
    return saved ? JSON.parse(saved) : { name: '', cnpj: '', industry: '', fiscalYear: '2024' };
  });

  const [crm, setCRM] = useState<CRMClient[]>(() => {
    const saved = localStorage.getItem('flowfin_crm');
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('flowfin_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isProcessingCNPJ, setIsProcessingCNPJ] = useState(false);
  const [isProcessingStrategy, setIsProcessingStrategy] = useState(false);
  const [isProcessingStatements, setIsProcessingStatements] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [aiAdvice, setAIAdvice] = useState<AIAdvice | null>(null);
  
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
    setSelectedClientId(null);
  };

  const handleCNPJUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsProcessingCNPJ(true);
      // Fix: Cast explicitly to File to resolve TypeScript 'unknown' type and property errors
      const file = e.target.files[0] as File;
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        try {
          const data = await analyzeCNPJCard({ data: base64, mimeType: file.type });
          const updated = { ...company, ...data };
          setCompany(updated);
          if (data.cnpj) setSelectedClientId(data.cnpj);
          const newClient: CRMClient = {
            id: Math.random().toString(36).substr(2, 9),
            ...updated,
            onboardingDate: new Date().toLocaleDateString(),
            fiscalYear: '2024'
          };
          setCRM(prev => [newClient, ...prev]);
          setActiveTab('upload');
        } catch (err) { setErrorToast('Erro ao processar CNPJ.'); }
        finally { setIsProcessingCNPJ(false); }
      };
    }
  };

  const handleStatementUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && selectedClientId) {
      setIsProcessingStatements(true);
      // Fix: Cast explicitly to File[] to resolve TypeScript 'unknown' type and property errors
      const files = Array.from(e.target.files) as File[];
      const allNew: Transaction[] = [];

      for (const file of files) {
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
            } catch (err) { setErrorToast('Erro no processamento do arquivo.'); }
            resolve(true);
          };
        });
      }
      
      const updatedTransactions = [...transactions, ...allNew];
      setTransactions(updatedTransactions);
      
      // Gerar contas bancárias baseadas nos bancos detectados
      const banks = Array.from(new Set(allNew.map(t => t.bankName)));
      const newAccounts = banks.map(b => ({
        id: b,
        bankName: b,
        companyName: company.name,
        currentBalance: allNew.filter(t => t.bankName === b).reduce((acc, t) => acc + (t.type === TransactionType.INCOME ? t.amount : -t.amount), 0),
        lastUpdated: new Date().toLocaleDateString()
      }));
      setBankAccounts(newAccounts);
      
      setIsProcessingStatements(false);
      setActiveTab('dashboard');
    }
  };

  const generateStrategy = async () => {
    if (filteredTransactions.length === 0) return;
    setIsProcessingStrategy(true);
    try {
      const res = await generateAIStrategy(company, filteredTransactions);
      setAIAdvice(res);
      setActiveTab('strategy');
    } catch (err) { setErrorToast('Erro ao gerar consultoria.'); }
    finally { setIsProcessingStrategy(false); }
  };

  const handlePrint = () => {
    setIsExporting(true);
    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 500);
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="mb-12 text-center">
          <FlowFinLogo className="w-24 h-24 bg-white p-4 rounded-[2rem] shadow-2xl mx-auto mb-6" />
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">FLOWFIN</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">BPO Financeiro com IA</p>
        </div>
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
           <button onClick={() => handleLogin('cliente')} className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all text-left group">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all"><Building2 size={32} /></div>
              <h2 className="text-3xl font-black text-slate-900">Empresa Cliente</h2>
              <p className="text-slate-500 mt-2 font-medium">Visualize seus relatórios e envie seus extratos bancários.</p>
           </button>
           <button onClick={() => handleLogin('gestor')} className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all text-left group">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-emerald-500 group-hover:text-white transition-all"><ShieldCheck size={32} /></div>
              <h2 className="text-3xl font-black text-slate-900">Gestor de BPO</h2>
              <p className="text-slate-500 mt-2 font-medium">Gestão de carteira, CRM e consultoria estratégica IA.</p>
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-inter">
      <style>{`@media print { .no-print { display: none !important; } main { width: 100% !important; padding: 0 !important; } }`}</style>
      
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col no-print">
        <div className="p-8">
          <div className="flex items-center space-x-3 mb-10">
            <FlowFinLogo className="w-10 h-10" />
            <span className="text-2xl font-black text-slate-900 tracking-tighter">FLOWFIN</span>
          </div>
          <nav className="space-y-2">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">Visão Geral</div>
            <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard BI" disabled={filteredTransactions.length === 0} />
            <NavItem id="strategy" icon={HeartPulse} label="Consultoria Flow" disabled={filteredTransactions.length === 0} />
            <NavItem id="full-report" icon={FileCheck} label="Relatório Final" disabled={!aiAdvice} />
            
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mt-6 mb-2">Relatórios</div>
            <NavItem id="dre" icon={FileText} label="Relatório DRE" disabled={filteredTransactions.length === 0} />
            <NavItem id="dfc" icon={TrendingUp} label="Fluxo de Caixa" disabled={filteredTransactions.length === 0} />
            <NavItem id="transactions" icon={ArrowDownUp} label="Extrato Consolidado" disabled={filteredTransactions.length === 0} />
            
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mt-6 mb-2">Gestão</div>
            <NavItem id="upload" icon={Upload} label="Importar Dados" />
            <NavItem id="banks" icon={Building2} label="Contas Bancárias" disabled={bankAccounts.length === 0} />
            {userRole === 'gestor' && <NavItem id="crm" icon={Users} label="Clientes CRM" />}
            <NavItem id="setup" icon={Settings} label="Configuração IA" />
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-slate-100">
           <div className="bg-slate-50 p-4 rounded-2xl mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Empresa Ativa</p>
              <p className="text-sm font-bold truncate text-slate-800">{company.name || 'Nenhuma selecionada'}</p>
           </div>
           <button onClick={handleLogout} className="flex items-center space-x-2 text-slate-400 hover:text-red-500 transition-colors px-2">
              <LogOut size={18} /> <span className="font-bold text-sm">Sair</span>
           </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-10 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'setup' && (
            <div className="bg-gradient-to-br from-blue-700 to-emerald-600 p-16 rounded-[3rem] text-white shadow-2xl animate-in fade-in duration-500">
              <h2 className="text-5xl font-black mb-6 tracking-tighter">Onboarding Inteligente</h2>
              <p className="text-blue-50 text-xl opacity-90 max-w-xl">Inicie o fluxo enviando o Cartão CNPJ do cliente. Nossa IA classificará tudo automaticamente.</p>
              <div className="mt-12 flex space-x-4">
                <button onClick={() => cnpjInputRef.current?.click()} className="bg-white text-blue-900 px-10 py-5 rounded-2xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all">
                  {isProcessingCNPJ ? <Loader2 className="animate-spin" /> : 'Upload Cartão CNPJ'}
                </button>
                <input type="file" ref={cnpjInputRef} className="hidden" onChange={handleCNPJUpload} />
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="bg-white p-16 rounded-[3rem] border border-slate-200 text-center animate-in fade-in">
               <h2 className="text-4xl font-black text-slate-900 mb-4">Importação de Extratos</h2>
               <p className="text-slate-400 font-bold mb-12">Arraste seus arquivos PDF ou OFX para conciliação automática.</p>
               <div onClick={() => statementInputRef.current?.click()} className="border-4 border-dashed rounded-[3rem] p-24 cursor-pointer hover:bg-blue-50 hover:border-blue-500 transition-all group">
                  <Upload className="mx-auto mb-6 text-slate-300 group-hover:text-blue-500 transition-colors" size={64} />
                  <p className="text-2xl font-black text-slate-800">Clique para selecionar arquivos</p>
                  <input type="file" multiple ref={statementInputRef} className="hidden" onChange={handleStatementUpload} />
               </div>
               {isProcessingStatements && <div className="mt-10 flex flex-col items-center"><Loader2 className="animate-spin text-blue-600 mb-2" size={32} /> <p className="font-black text-blue-600 uppercase text-xs">IA analisando transações...</p></div>}
               <button onClick={generateStrategy} disabled={filteredTransactions.length === 0} className="mt-12 bg-slate-900 text-white px-12 py-5 rounded-2xl font-black shadow-xl hover:bg-slate-800 disabled:opacity-30">
                 Gerar Estratégia de Consultoria
               </button>
            </div>
          )}

          {activeTab === 'crm' && (
            <div className="space-y-8 animate-in fade-in">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Gestão de Carteira</h2>
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                    <tr><th className="px-8 py-6">Cliente</th><th className="px-8 py-6">CNPJ / CNAE</th><th className="px-8 py-6 text-right">Ação</th></tr>
                  </thead>
                  <tbody>
                    {crm.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50 border-b">
                        <td className="px-8 py-8"><p className="font-black text-lg">{c.name}</p><p className="text-xs text-emerald-600 font-bold uppercase">{c.industry}</p></td>
                        <td className="px-8 py-8 font-mono text-slate-500">{c.cnpj}</td>
                        <td className="px-8 py-8 text-right">
                          <button onClick={() => { setCompany(c); setSelectedClientId(c.cnpj); setActiveTab('dashboard'); }} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-100">Gerenciar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && <Dashboard transactions={filteredTransactions} />}
          {activeTab === 'dre' && <DRE transactions={filteredTransactions} />}
          {activeTab === 'dfc' && <DFC transactions={filteredTransactions} />}
          
          {activeTab === 'strategy' && aiAdvice && (
             <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100 text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Saúde Financeira</p>
                      <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                         <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                            <circle cx="50" cy="50" r="45" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                            <circle cx="50" cy="50" r="45" stroke="#10B981" strokeWidth="8" fill="transparent" strokeDasharray="283" strokeDashoffset={283 - (283 * aiAdvice.healthScore) / 100} strokeLinecap="round" />
                         </svg>
                         <span className="absolute text-5xl font-black">{aiAdvice.healthScore}</span>
                      </div>
                   </div>
                   <div className="lg:col-span-2 bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col justify-center">
                      <h3 className="text-2xl font-black mb-6 flex items-center"><Sparkles className="text-blue-600 mr-2" /> Consultoria FlowFin</h3>
                      <p className="text-slate-600 text-xl italic font-medium leading-relaxed border-l-8 border-blue-50 pl-8">"{aiAdvice.summary}"</p>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="bg-emerald-50 p-10 rounded-[2.5rem]"><h4 className="font-black text-emerald-800 mb-6 uppercase text-xs">Pontos Fortes</h4><ul className="space-y-4">{aiAdvice.strengths.map((s,i) => <li key={i} className="flex items-start font-bold text-emerald-700"><CheckCircle size={18} className="mr-2 mt-1 shrink-0" /> {s}</li>)}</ul></div>
                   <div className="bg-blue-50 p-10 rounded-[2.5rem]"><h4 className="font-black text-blue-800 mb-6 uppercase text-xs">Recomendações</h4><ul className="space-y-4">{aiAdvice.recommendations.map((r,i) => <li key={i} className="flex items-start font-bold text-blue-700"><ArrowUpRight size={18} className="mr-2 mt-1 shrink-0" /> {r}</li>)}</ul></div>
                </div>
             </div>
          )}

          {activeTab === 'full-report' && aiAdvice && (
            <div className="animate-in fade-in">
               <div className="flex items-center justify-between mb-10 no-print">
                  <h2 className="text-3xl font-black">Relatório Estratégico Final</h2>
                  <button onClick={handlePrint} className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold flex items-center shadow-xl">
                    <Printer size={20} className="mr-2" /> Imprimir / PDF
                  </button>
               </div>
               <div className="bg-white p-20 rounded-[4rem] shadow-2xl border border-slate-100 print:shadow-none print:p-10">
                  <div className="flex items-center justify-between mb-16">
                     <div className="flex items-center space-x-3"><FlowFinLogo className="w-12 h-12" /><span className="text-3xl font-black">FLOWFIN</span></div>
                     <div className="text-right"><p className="font-black text-xl uppercase">{company.name}</p><p className="text-slate-400 font-bold">Relatório Executivo {company.fiscalYear}</p></div>
                  </div>
                  <div className="border-t border-b border-slate-100 py-16 mb-16 text-center">
                    <h1 className="text-6xl font-black tracking-tighter mb-4">Análise 360º de Performance</h1>
                    <p className="text-slate-400 text-xl font-medium">Classificação automática via Inteligência Artificial Gemini 1.5</p>
                  </div>
                  <div className="space-y-20">
                    <section>
                       <h3 className="text-2xl font-black mb-8 underline">1. Diagnóstico de Saúde</h3>
                       <p className="text-2xl font-medium leading-relaxed italic text-slate-700">{aiAdvice.summary}</p>
                    </section>
                    <section>
                       <h3 className="text-2xl font-black mb-8 underline">2. Dashboards Financeiros</h3>
                       <Dashboard transactions={filteredTransactions} />
                    </section>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'banks' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in">
              {bankAccounts.map(b => (
                <div key={b.id} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mb-6"><Building2 size={28} /></div>
                  <h3 className="text-2xl font-black">{b.bankName}</h3>
                  <p className="text-slate-400 font-bold text-xs uppercase mb-8">{b.companyName}</p>
                  <div className="pt-8 border-t border-slate-50"><p className="text-xs font-black text-slate-400 uppercase mb-2">Saldo Atual</p><p className="text-3xl font-black text-emerald-600">{b.currentBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      {errorToast && (
        <div className="fixed bottom-10 right-10 bg-slate-900 text-white p-6 rounded-2xl shadow-2xl flex items-center space-x-4 animate-in slide-in-from-right-10">
          <AlertCircle className="text-red-400" /> <span className="font-bold">{errorToast}</span> <button onClick={() => setErrorToast(null)}><X size={18} /></button>
        </div>
      )}
    </div>
  );
};

export default App;
