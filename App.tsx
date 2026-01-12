

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, FileText, Upload, Settings, TrendingUp, ChevronRight, 
  Loader2, Sparkles, Building2, FileCheck, AlertCircle, X, Trash2, 
  Users, ShieldCheck, HeartPulse, Landmark, ArrowUpRight,
  FileSearch, CheckCircle, Clock, ListOrdered, Calendar, BarChart3,
  CreditCard, Search, ArrowDownUp, Filter, Printer, Download, AlertTriangle,
  Lock, LogOut, UserCircle, Mail, Key, User, MessageSquare, Send, Zap,
  Smartphone, Monitor, Globe, ChevronDown, Instagram, Linkedin, Facebook,
  Star, Quote, Check, Menu, PlayCircle, Play
} from 'lucide-react';
import { CompanyProfile, Transaction, CRMClient, AIAdvice, BankAccount, TransactionType } from './types.ts';
import { Dashboard } from './components/Dashboard.tsx';
import { DRE, DFC } from './components/FinancialReports.tsx';
import { processStatementFile, analyzeCNPJCard, generateAIStrategy } from './geminiService.ts';
import { GoogleGenAI } from "@google/genai";

// Logo Apolo Finance
const ApoloLogo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="35" cy="40" r="10" fill="#C5A059" />
      <g stroke="#C5A059" strokeWidth="1.5">
        {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
          <line key={deg} x1="35" y1="40" x2={35 + 15 * Math.cos(deg * Math.PI / 180)} y2={40 + 15 * Math.sin(deg * Math.PI / 180)} />
        ))}
      </g>
      <path d="M20 50C20 45 25 40 30 40M100 50C100 45 95 40 90 40" stroke="#1A2B4C" strokeWidth="8" strokeLinecap="round" />
      <path d="M25 50C25 85 45 105 60 105C75 105 95 85 95 50" stroke="#1A2B4C" strokeWidth="8" strokeLinecap="round" />
      <rect x="42" y="70" width="8" height="25" rx="2" fill="#1A2B4C" />
      <rect x="54" y="60" width="8" height="35" rx="2" fill="#1A2B4C" />
      <rect x="66" y="55" width="8" height="40" rx="2" fill="#1A2B4C" />
      <rect x="78" y="75" width="8" height="20" rx="2" fill="#1A2B4C" />
      <path d="M22 75L45 60L65 70L95 40" stroke="#4A8C4A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M85 40H95V50" stroke="#4A8C4A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

// Atendente Virtual IA
const ApoloChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'bot', text: string}[]>([
    { role: 'bot', text: 'Bem-vindo à Apolo Finance! Sou sua consultora virtual. Como posso iluminar seu financeiro hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: "Você é a Apolo IA, atendente de vendas da Apolo Finance. Seu objetivo é encantar o cliente com as vantagens do nosso BPO Financeiro com IA: Classificação automática, DRE instantânea e Onboarding via CNPJ. Seja sofisticada, prestativa e direta."
        }
      });
      setMessages(prev => [...prev, { role: 'bot', text: response.text || 'Desculpe, pode repetir?' }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Estou em manutenção, mas você pode falar com nosso time comercial!' }]);
    } finally { setIsTyping(false); }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[300] no-print">
      {!isOpen ? (
        <button onClick={() => setIsOpen(true)} className="bg-[#1A2B4C] text-white p-5 rounded-full shadow-2xl border-4 border-[#C5A059] hover:scale-110 transition-all group">
          <MessageSquare className="group-hover:rotate-12 transition-transform"/>
        </button>
      ) : (
        <div className="bg-white w-96 h-[550px] rounded-[2.5rem] shadow-2xl flex flex-col border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-8">
          <div className="bg-[#1A2B4C] p-6 text-white flex justify-between items-center">
             <div className="flex items-center space-x-3">
               <ApoloLogo className="w-8 h-8 bg-white rounded-lg p-1"/>
               <div><p className="font-black text-xs uppercase leading-none">Apolo IA</p><p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">Atendimento Especializado</p></div>
             </div>
             <button onClick={() => setIsOpen(false)}><X size={20}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-[#C5A059] text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-white border-t flex space-x-2">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage()} className="flex-1 text-sm focus:outline-none pl-4 bg-slate-50 rounded-xl py-2" placeholder="Diga olá para a IA..." />
            <button onClick={sendMessage} className="bg-[#1A2B4C] text-white p-3 rounded-xl"><Send size={18}/></button>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente FAQ
// FIX: Explicitly typed as React.FC to resolve the 'key' prop error when mapping over FAQ items.
const FAQItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-200 py-6 last:border-0">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left group">
        <span className="text-lg font-black text-[#1A2B4C] tracking-tight group-hover:text-[#C5A059] transition-colors">{q}</span>
        <div className={`w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center transition-all ${isOpen ? 'bg-[#1A2B4C] text-white rotate-180' : 'bg-white text-slate-400'}`}>
          <ChevronDown size={18} />
        </div>
      </button>
      <div className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <p className="text-slate-500 font-medium leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  );
};

// Modal de Demonstração
const DemoModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[500] flex items-center justify-center p-8 animate-in fade-in duration-300">
    <div className="absolute inset-0 bg-[#1A2B4C]/95 backdrop-blur-xl" onClick={onClose}></div>
    <div className="bg-white w-full max-w-6xl rounded-[4rem] shadow-2xl relative overflow-hidden flex flex-col lg:flex-row h-[80vh] animate-in zoom-in-95 duration-500">
      <button onClick={onClose} className="absolute top-8 right-8 z-10 w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all">
        <X size={24} />
      </button>
      
      <div className="flex-1 bg-slate-900 flex items-center justify-center relative group">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="z-10 text-center space-y-6">
          <div className="w-24 h-24 bg-[#C5A059] rounded-full flex items-center justify-center mx-auto shadow-2xl animate-pulse">
            <Play fill="white" size={40} className="text-white ml-2" />
          </div>
          <p className="text-white font-black text-2xl uppercase tracking-tighter">Demonstração Interativa IA</p>
        </div>
        {/* Simulação de Interface */}
        <div className="absolute inset-10 border-2 border-white/10 rounded-[3rem] overflow-hidden opacity-40 grayscale group-hover:grayscale-0 transition-all duration-1000">
          <div className="w-full h-full bg-white p-12 space-y-12">
            <div className="flex justify-between"><div className="w-40 h-8 bg-slate-100 rounded-full"></div><div className="w-12 h-12 bg-slate-100 rounded-xl"></div></div>
            <div className="grid grid-cols-3 gap-8">
               <div className="h-40 bg-slate-50 rounded-[2rem]"></div>
               <div className="h-40 bg-slate-50 rounded-[2rem]"></div>
               <div className="h-40 bg-slate-50 rounded-[2rem]"></div>
            </div>
            <div className="h-64 bg-slate-50 rounded-[3rem]"></div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-96 bg-white p-16 flex flex-col justify-center space-y-10 border-l border-slate-100">
        <h3 className="text-3xl font-black text-[#1A2B4C] tracking-tighter uppercase leading-none">O que você vai ver:</h3>
        <ul className="space-y-6">
           {[
             { t: "Dashboard BI", d: "Visão 360 do seu caixa em tempo real." },
             { t: "Parecer IA", d: "Insights estratégicos automáticos." },
             { t: "Classificação", d: "Automação 99% precisa de extratos." },
             { t: "Multi-empresa", d: "Gestão de carteira para contadores." }
           ].map((item, i) => (
             <li key={i} className="flex items-start space-x-4">
                <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0 mt-1"><Check size={14}/></div>
                <div><p className="font-black text-[#1A2B4C] text-sm uppercase tracking-tight">{item.t}</p><p className="text-xs text-slate-400 font-medium">{item.d}</p></div>
             </li>
           ))}
        </ul>
        <button onClick={onClose} className="bg-[#1A2B4C] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Começar Onboarding</button>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  // Navegação Principal
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'upload' | 'setup' | 'crm' | 'strategy' | 'banks' | 'full-report' | 'transactions'>('setup');
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  
  // Dados Core
  const [company, setCompany] = useState<CompanyProfile>({ name: '', cnpj: '', industry: '', fiscalYear: '2024' });
  const [crm, setCRM] = useState<CRMClient[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [aiAdvice, setAIAdvice] = useState<AIAdvice | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Estados de Processamento
  const [isProcessingCNPJ, setIsProcessingCNPJ] = useState(false);
  const [isProcessingStrategy, setIsProcessingStrategy] = useState(false);
  const [isProcessingStatements, setIsProcessingStatements] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const cnpjInputRef = useRef<HTMLInputElement>(null);
  const statementInputRef = useRef<HTMLInputElement>(null);

  // Hidratação
  useEffect(() => {
    try {
      const sCompany = localStorage.getItem('apolo_company');
      const sCRM = localStorage.getItem('apolo_crm');
      const sTrans = localStorage.getItem('apolo_transactions');
      if (sCompany) setCompany(JSON.parse(sCompany));
      if (sCRM) setCRM(JSON.parse(sCRM));
      if (sTrans) setTransactions(JSON.parse(sTrans));
    } catch(e) { console.error("Falha ao carregar dados locais", e); }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('apolo_company', JSON.stringify(company));
      localStorage.setItem('apolo_crm', JSON.stringify(crm));
      localStorage.setItem('apolo_transactions', JSON.stringify(transactions));
    }
  }, [company, crm, transactions, isHydrated]);

  const filteredTransactions = useMemo(() => {
    if (!selectedClientId) return [];
    return transactions.filter(t => t.costCenter === selectedClientId);
  }, [transactions, selectedClientId]);

  // Fix: Corrected the logic to filter by costCenter (client ID) and correctly find unique bank names for the client
  const bankAccounts = useMemo(() => {
    if (!selectedClientId) return [];
    const clientTransactions = transactions.filter(t => t.costCenter === selectedClientId);
    const banksFound = Array.from(new Set(clientTransactions.map(t => t.bankName)));
    return banksFound.map(bankName => {
      const bTrans = clientTransactions.filter(t => t.bankName === bankName);
      const balance = bTrans.reduce((acc, t) => acc + (t.type === TransactionType.INCOME ? t.amount : -Math.abs(t.amount)), 0);
      return { id: bankName, bankName: bankName, currentBalance: balance, lastUpdated: new Date().toLocaleDateString() } as BankAccount;
    });
  }, [transactions, selectedClientId]);

  const handleLogin = () => {
    setView('app');
    if (company.cnpj) setSelectedClientId(company.cnpj);
    setActiveTab('setup');
  };

  const handleProcessCNPJ = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingCNPJ(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const data = await analyzeCNPJCard({ data: base64, mimeType: file.type });
        const updated = { ...company, ...data };
        setCompany(updated);
        if (data.cnpj) {
          setSelectedClientId(data.cnpj);
          const newClient: CRMClient = { 
            id: Math.random().toString(36).substr(2,9), 
            ...updated, 
            onboardingDate: new Date().toLocaleDateString() 
          } as CRMClient;
          setCRM(prev => [newClient, ...prev]);
          setActiveTab('dashboard');
        }
      } catch (err) { setErrorToast('Erro ao ler cartão CNPJ.'); } 
      finally { setIsProcessingCNPJ(false); }
    };
  };

  const handleProcessStatements = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // FIX: Cast files to File[] to avoid 'unknown' type errors during iteration.
    const files = e.target.files ? (Array.from(e.target.files) as File[]) : [];
    if (files.length === 0 || !selectedClientId) return;
    setIsProcessingStatements(true);
    const allNewTrans: Transaction[] = [];
    
    for (const f of files) {
      await new Promise(resolve => {
        const reader = new FileReader();
        reader.readAsDataURL(f);
        reader.onload = async () => {
          const b64 = (reader.result as string).split(',')[1];
          try {
            // FIX: Accessing f.type and f.name is safe now because f is typed as File.
            const result = await processStatementFile(company, { data: b64, mimeType: f.type, fileName: f.name });
            allNewTrans.push(...result.map(t => ({...t, costCenter: selectedClientId!})));
          } catch(err) { console.error("Erro no arquivo", f.name, err); }
          resolve(true);
        }
      });
    }
    setTransactions(prev => [...prev, ...allNewTrans]);
    setIsProcessingStatements(false);
    setActiveTab('dashboard');
  };

  const NavItem = ({ id, icon: Icon, label, disabled = false }: { id: any, icon: any, label: string, disabled?: boolean }) => (
    <button
      disabled={disabled}
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-3 w-full p-4 rounded-2xl transition-all ${
        activeTab === id ? 'bg-[#1A2B4C] text-white shadow-xl shadow-[#1A2B4C]/20' : 
        disabled ? 'opacity-30 cursor-not-allowed text-slate-400' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon size={18} />
      <span className="font-bold text-sm tracking-tight">{label}</span>
    </button>
  );

  // VIEW: SISTEMA BPO FINANCEIRO
  if (view === 'app') {
    return (
      <div className="flex h-screen bg-slate-50 overflow-hidden font-inter">
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col no-print shrink-0">
          <div className="p-10 flex flex-col items-center">
            <ApoloLogo className="w-16 h-16 mb-2" />
            <div className="text-center">
              <h1 className="text-xl font-black text-[#1A2B4C] tracking-tighter uppercase leading-none">APOLO</h1>
              <p className="text-[10px] font-bold text-[#C5A059] tracking-widest uppercase">FINANCE</p>
            </div>
            
            <nav className="mt-12 w-full space-y-1.5 overflow-y-auto max-h-[calc(100vh-350px)]">
              <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard BI" disabled={filteredTransactions.length === 0} />
              <NavItem id="strategy" icon={HeartPulse} label="Consultoria Apolo" disabled={filteredTransactions.length === 0} />
              <NavItem id="full-report" icon={FileCheck} label="Relatório Executivo" disabled={filteredTransactions.length === 0 || !aiAdvice} />
              <NavItem id="upload" icon={Upload} label="Importar Extratos" />
              <NavItem id="banks" icon={Building2} label="Contas Bancárias" disabled={bankAccounts.length === 0} />
              <NavItem id="crm" icon={Users} label="Gestão de Clientes" />
              <NavItem id="setup" icon={Settings} label="Configurações IA" />
            </nav>
          </div>
          <div className="mt-auto p-8 border-t space-y-4">
             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Empresa</p>
                <p className="text-xs font-black text-[#1A2B4C] truncate">{company.name || 'Nova Empresa'}</p>
             </div>
             <button onClick={() => setView('landing')} className="w-full flex items-center justify-center space-x-2 p-4 bg-slate-100 text-slate-500 rounded-2xl font-bold text-xs uppercase hover:bg-red-50 hover:text-red-500 transition-all">
               <LogOut size={16}/> <span>Sair</span>
             </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-12 relative bg-slate-50">
          {activeTab === 'setup' && (
            <div className="max-w-4xl mx-auto bg-white p-20 rounded-[4rem] shadow-2xl border border-slate-100 animate-in zoom-in-95">
               <div className="flex items-center space-x-6 mb-12">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-inner"><Landmark size={32}/></div>
                  <div><h2 className="text-4xl font-black text-[#1A2B4C] tracking-tighter">Onboarding Inteligente</h2><p className="text-slate-400 font-medium">Extração de dados via Cartão CNPJ para setup rápido.</p></div>
               </div>
               <div className="border-4 border-dashed rounded-[3.5rem] p-24 text-center hover:border-[#1A2B4C] transition-all cursor-pointer group bg-slate-50/50" onClick={() => cnpjInputRef.current?.click()}>
                  <FileSearch size={64} className="mx-auto mb-8 text-slate-200 group-hover:text-[#1A2B4C] transition-colors" />
                  <p className="text-xl font-bold text-slate-400 uppercase tracking-widest">Clique ou arraste o Cartão CNPJ</p>
                  <input type="file" ref={cnpjInputRef} className="hidden" accept="application/pdf,image/*" onChange={handleProcessCNPJ} />
               </div>
               {isProcessingCNPJ && (
                 <div className="mt-12 flex items-center justify-center space-x-4 text-[#1A2B4C]">
                    <Loader2 className="animate-spin" size={24}/> <span className="font-black uppercase tracking-widest text-xs">IA Apolo Mapeando Empresa...</span>
                 </div>
               )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="max-w-4xl mx-auto bg-white p-20 rounded-[4rem] shadow-2xl border border-slate-100 animate-in fade-in">
               <h3 className="text-3xl font-black text-[#1A2B4C] mb-12 uppercase tracking-tighter">Processamento de Extratos</h3>
               <div className="border-4 border-dashed rounded-[3.5rem] p-24 text-center cursor-pointer hover:bg-slate-50 border-slate-200" onClick={() => statementInputRef.current?.click()}>
                  <Upload size={48} className="mx-auto mb-6 text-slate-200" />
                  <p className="font-black text-slate-400 uppercase tracking-widest">Importar Arquivos PDF / OFX</p>
                  <input type="file" multiple ref={statementInputRef} className="hidden" onChange={handleProcessStatements} />
               </div>
               {isProcessingStatements && (
                 <div className="mt-12 flex items-center justify-center space-x-4 text-[#C5A059]">
                    <Loader2 className="animate-spin" size={24}/> <span className="font-black uppercase tracking-widest text-xs">Classificando Transações com IA...</span>
                 </div>
               )}
               <div className="mt-12 flex justify-center">
                  <button 
                    disabled={filteredTransactions.length === 0 || isProcessingStrategy}
                    onClick={async () => {
                      setIsProcessingStrategy(true);
                      const advice = await generateAIStrategy(company, filteredTransactions);
                      setAIAdvice(advice);
                      setIsProcessingStrategy(false);
                      setActiveTab('strategy');
                    }}
                    className="bg-[#1A2B4C] text-white px-16 py-6 rounded-[2.5rem] font-black uppercase tracking-widest flex items-center shadow-2xl hover:scale-105 disabled:opacity-30 disabled:scale-100 transition-all"
                  >
                    {isProcessingStrategy ? <Loader2 className="animate-spin mr-3"/> : <Sparkles className="mr-3"/>}
                    Gerar Consultoria Estratégica
                  </button>
               </div>
            </div>
          )}

          {activeTab === 'dashboard' && <Dashboard transactions={filteredTransactions} />}
          
          {activeTab === 'strategy' && aiAdvice && (
            <div className="space-y-10 animate-in slide-in-from-bottom-8">
               <div className="bg-[#1A2B4C] p-20 rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
                  <div className="absolute right-[-20px] bottom-[-20px] opacity-10"><ApoloLogo className="w-80 h-80"/></div>
                  <h3 className="text-[#C5A059] font-black text-xs uppercase tracking-[0.4em] mb-10 flex items-center"><Sparkles className="mr-2" size={16}/> Parecer Consultivo Apolo IA</h3>
                  <p className="text-4xl font-medium leading-relaxed italic border-l-[12px] border-[#C5A059] pl-10">"{aiAdvice.summary}"</p>
                  <div className="mt-12 inline-flex items-center space-x-4 bg-white/10 px-6 py-3 rounded-2xl">
                    <div className="w-12 h-12 bg-[#C5A059] rounded-full flex items-center justify-center font-black text-xl">{aiAdvice.healthScore}</div>
                    <span className="font-bold text-sm uppercase tracking-widest">Health Score Financeiro</span>
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-emerald-50 p-12 rounded-[3.5rem] border border-emerald-100 shadow-sm">
                    <h4 className="text-emerald-900 font-black mb-8 uppercase text-xs tracking-widest flex items-center"><CheckCircle className="mr-2" size={16}/> Pontos de Eficiência</h4>
                    <ul className="space-y-4">{aiAdvice.strengths.map((s,i) => <li key={i} className="text-emerald-800 font-bold flex items-start text-sm leading-snug"><Check className="mr-3 text-emerald-500 shrink-0" size={18}/>{s}</li>)}</ul>
                  </div>
                  <div className="bg-[#C5A059]/10 p-12 rounded-[3.5rem] border border-[#C5A059]/20 shadow-sm">
                    <h4 className="text-[#C5A059] font-black mb-8 uppercase text-xs tracking-widest flex items-center"><ArrowUpRight className="mr-2" size={16}/> Recomendações Táticas</h4>
                    <ul className="space-y-4">{aiAdvice.recommendations.map((r,i) => <li key={i} className="text-slate-800 font-bold flex items-start text-sm leading-snug"><TrendingUp className="mr-3 text-[#C5A059] shrink-0" size={18}/>{r}</li>)}</ul>
                  </div>
               </div>
            </div>
          )}
          
          {activeTab === 'crm' && (
             <div className="space-y-10">
               <div className="flex justify-between items-center">
                 <h2 className="text-4xl font-black text-[#1A2B4C] tracking-tighter uppercase">Carteira de Clientes</h2>
                 <button className="bg-[#1A2B4C] text-white px-8 py-4 rounded-2xl font-black flex items-center shadow-lg hover:scale-105 transition-all"><Users className="mr-2"/> Adicionar Manual</button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {crm.length === 0 && <p className="col-span-full text-slate-400 font-bold text-center py-20">Nenhum cliente cadastrado. Use o Onboarding IA para começar.</p>}
                  {crm.map(client => (
                    <button key={client.id} onClick={() => { setCompany(client); setSelectedClientId(client.cnpj); setActiveTab('dashboard'); }} className={`p-10 rounded-[3.5rem] border text-left transition-all ${selectedClientId === client.cnpj ? 'bg-[#1A2B4C] text-white shadow-2xl scale-[1.02]' : 'bg-white border-slate-100 hover:shadow-xl'}`}>
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 ${selectedClientId === client.cnpj ? 'bg-white/10 text-white' : 'bg-slate-50 text-[#1A2B4C]'}`}><Building2 size={32} /></div>
                       <h4 className="text-xl font-black mb-2 uppercase tracking-tight truncate w-full">{client.name}</h4>
                       <p className={`text-[10px] font-black uppercase tracking-widest ${selectedClientId === client.cnpj ? 'text-white/60' : 'text-slate-400'}`}>CNPJ: {client.cnpj}</p>
                       <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-center">
                          <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Desde {client.onboardingDate}</span>
                          <ChevronRight size={16}/>
                       </div>
                    </button>
                  ))}
               </div>
             </div>
          )}
        </main>
      </div>
    );
  }

  // VIEW: LANDING PAGE INSTITUCIONAL
  return (
    <div className="min-h-screen bg-white font-inter text-slate-900 scroll-smooth">
      <ApoloChatbot />
      {isDemoOpen && <DemoModal onClose={() => setIsDemoOpen(false)} />}
      
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md z-[200] border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-8 h-24 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <ApoloLogo className="w-10 h-10" />
             <div className="flex flex-col leading-none">
               <span className="text-xl font-black text-[#1A2B4C] tracking-tighter uppercase">APOLO</span>
               <span className="text-[9px] font-bold text-[#C5A059] tracking-widest uppercase">FINANCE</span>
             </div>
          </div>
          <nav className="hidden md:flex items-center space-x-12 text-sm font-black text-slate-500 uppercase tracking-widest">
            <a href="#beneficios" className="hover:text-[#1A2B4C] transition-colors">Benefícios</a>
            <a href="#gestao" className="hover:text-[#1A2B4C] transition-colors">Facilidade</a>
            <a href="#depoimentos" className="hover:text-[#1A2B4C] transition-colors">Cases</a>
            <a href="#planos" className="hover:text-[#1A2B4C] transition-colors">Planos</a>
            <a href="#faq" className="hover:text-[#1A2B4C] transition-colors">FAQ</a>
          </nav>
          <button onClick={handleLogin} className="bg-[#1A2B4C] text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#1A2B4C]/20 hover:scale-105 active:scale-95 transition-all">Acessar Sistema</button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="pt-48 pb-32 px-8 overflow-hidden relative">
        <div className="absolute top-40 right-[-10%] w-[600px] h-[600px] bg-[#C5A059]/5 rounded-full blur-[120px] -z-10"></div>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-24">
          <div className="flex-1 space-y-10 animate-in fade-in slide-in-from-left-10 duration-1000">
            <div className="inline-flex items-center space-x-2 bg-[#1A2B4C]/5 px-4 py-2 rounded-full border border-[#1A2B4C]/10 text-[#1A2B4C]">
              <Zap size={14} className="fill-current text-[#C5A059]"/> <span className="text-[10px] font-black uppercase tracking-widest">O Futuro do BPO Financeiro com IA</span>
            </div>
            <h1 className="text-[5rem] font-black text-[#1A2B4C] tracking-tighter leading-[0.85] lg:text-[6.5rem]">Gestão que <br/><span className="text-[#C5A059]">Ilumina seu Lucro.</span></h1>
            <p className="text-xl text-slate-500 font-medium max-w-xl leading-relaxed">Automatize 100% da classificação bancária e gere relatórios estratégicos instantâneos com a Inteligência Artificial Apolo.</p>
            <div className="flex flex-wrap items-center gap-6 pt-6">
              <button onClick={handleLogin} className="bg-[#1A2B4C] text-white px-14 py-7 rounded-[2.5rem] font-black text-lg shadow-2xl flex items-center group hover:bg-slate-800 transition-all">Começar Agora <ArrowUpRight className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"/></button>
              <button onClick={() => setIsDemoOpen(true)} className="bg-white text-[#1A2B4C] border-2 border-[#1A2B4C] px-10 py-7 rounded-[2.5rem] font-black text-lg shadow-sm flex items-center group hover:bg-[#1A2B4C] hover:text-white transition-all">
                <PlayCircle className="mr-2 group-hover:scale-110 transition-transform" size={24}/> Veja uma demonstração
              </button>
            </div>
            <div className="flex items-center space-x-2 pt-4">
               <div className="flex -space-x-3">
                  <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=100" className="w-12 h-12 rounded-full border-4 border-white object-cover" />
                  <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100" className="w-12 h-12 rounded-full border-4 border-white object-cover" />
                  <img src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=100" className="w-12 h-12 rounded-full border-4 border-white object-cover" />
               </div>
               <div className="pl-4">
                  <p className="text-xs font-black text-[#1A2B4C] uppercase tracking-widest">+850 Empresas Iluminadas</p>
                  <div className="flex text-[#C5A059]"><Star size={10} fill="currentColor"/><Star size={10} fill="currentColor"/><Star size={10} fill="currentColor"/><Star size={10} fill="currentColor"/><Star size={10} fill="currentColor"/></div>
               </div>
            </div>
          </div>
          <div className="flex-1 relative animate-in fade-in slide-in-from-right-10 duration-1000">
             <div className="bg-slate-900 p-5 rounded-[4.5rem] shadow-[0_50px_100px_-20px_rgba(26,43,76,0.3)] rotate-2 hover:rotate-0 transition-all duration-700">
                <div className="bg-white rounded-[3.5rem] aspect-[16/10] overflow-hidden border-8 border-slate-800 p-10">
                   <div className="w-full h-full bg-slate-50/50 rounded-[2.5rem] p-12 space-y-10 border border-slate-100 shadow-inner">
                      <div className="flex justify-between items-center"><div className="w-40 h-5 bg-slate-200 rounded-full"></div><div className="w-12 h-12 bg-[#1A2B4C] rounded-2xl flex items-center justify-center text-white"><LayoutDashboard size={20}/></div></div>
                      <div className="grid grid-cols-2 gap-8">
                        <div className="h-40 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 flex flex-col justify-end animate-pulse">
                           <div className="w-10 h-2 bg-emerald-100 rounded mb-2"></div>
                           <div className="w-24 h-6 bg-emerald-500/20 rounded"></div>
                        </div>
                        <div className="h-40 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 flex flex-col justify-end animate-pulse [animation-delay:0.2s]">
                           <div className="w-10 h-2 bg-[#C5A059]/20 rounded mb-2"></div>
                           <div className="w-24 h-6 bg-[#C5A059]/40 rounded"></div>
                        </div>
                        <div className="col-span-2 h-44 bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 space-y-4 animate-pulse [animation-delay:0.4s]">
                           <div className="w-1/2 h-3 bg-slate-100 rounded"></div>
                           <div className="w-full h-24 bg-slate-50 rounded-2xl"></div>
                        </div>
                      </div>
                   </div>
                </div>
             </div>
             <div className="absolute -bottom-10 -left-10 bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100 hidden lg:block animate-bounce [animation-duration:6s]">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-black"><Check size={28}/></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conciliação Automática</p><p className="text-2xl font-black text-[#1A2B4C] tracking-tighter">99.9% Precisão</p></div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS SECTION */}
      <section id="beneficios" className="py-32 px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-24">
           <div className="text-center space-y-4 max-w-3xl mx-auto">
             <h2 className="text-5xl font-black text-[#1A2B4C] tracking-tighter uppercase">Tecnologia que Ilumina</h2>
             <p className="text-xl text-slate-500 font-medium leading-relaxed">Desenvolvemos as ferramentas mais poderosas do mercado de BPO para que você nunca mais tome decisões no escuro.</p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
             {[
               { icon: Zap, title: "Classificação Instantânea", desc: "Nossa IA aprende com os seus padrões e automatiza 100% do seu plano de contas em segundos." },
               { icon: FileCheck, title: "Relatórios DRE & DFC", desc: "Esqueça planilhas. Gere demonstrativos contábeis profissionais com um clique, direto da IA." },
               { icon: HeartPulse, title: "Consultoria Estratégica", desc: "A cada mês, a IA Apolo gera um parecer estratégico sobre a saúde e futuro do seu negócio." },
               { icon: Landmark, title: "Onboarding via CNPJ", desc: "Suba o cartão CNPJ e o sistema configura toda a estrutura societária e fiscal automaticamente." },
               { icon: ShieldCheck, title: "Segurança Bancária", desc: "Dados protegidos com criptografia de ponta e backups redundantes em tempo real." },
               { icon: BarChart3, title: "BI em Tempo Real", desc: "Dashboards interativos que mostram o lucro real, margem de contribuição e ponto de equilíbrio." }
             ].map((b, i) => (
               <div key={i} className="bg-white p-16 rounded-[4.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all hover:-translate-y-3 group">
                  <div className="w-20 h-20 bg-slate-50 text-[#1A2B4C] rounded-[2rem] flex items-center justify-center mb-10 group-hover:bg-[#1A2B4C] group-hover:text-white transition-all duration-500"><b.icon size={36}/></div>
                  <h3 className="text-2xl font-black text-[#1A2B4C] mb-4 tracking-tight uppercase">{b.title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">{b.desc}</p>
               </div>
             ))}
           </div>
        </div>
      </section>

      {/* GESTÃO FACILITADA */}
      <section id="gestao" className="py-32 px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
           <div className="flex-1 space-y-12">
              <h2 className="text-5xl font-black text-[#1A2B4C] tracking-tighter uppercase">Gestão Financeira <br/>Totalmente Facilitada</h2>
              <div className="space-y-8">
                 {[
                   { icon: Check, title: "Configuração em 60 Segundos", text: "Com o Onboarding IA, sua empresa sai do zero para o dashboard em um minuto." },
                   { icon: Check, title: "Sem Lançamentos Manuais", text: "Nossa IA lê arquivos bancários e identifica pagamentos a fornecedores e recebimentos." },
                   { icon: Check, title: "Acesso de Qualquer Lugar", text: "Plataforma 100% web otimizada para Desktop, Tablets e Smartphones." }
                 ].map((item, i) => (
                   <div key={i} className="flex items-start space-x-6">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0"><item.icon size={20}/></div>
                      <div><h4 className="text-xl font-black text-[#1A2B4C] uppercase tracking-tight">{item.title}</h4><p className="text-slate-500 font-medium">{item.text}</p></div>
                   </div>
                 ))}
              </div>
           </div>
           <div className="flex-1">
              <div className="bg-[#1A2B4C] rounded-[4rem] p-12 text-white relative shadow-2xl overflow-hidden group">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -z-0"></div>
                 <Quote size={80} className="text-white/10 absolute top-10 right-10" />
                 <h3 className="text-3xl font-black mb-8 leading-tight relative z-10">"A Apolo não é apenas um software, é o consultor financeiro que eu sempre quis mas não podia pagar."</h3>
                 <div className="flex items-center space-x-6 relative z-10">
                    <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=150" className="w-20 h-20 rounded-[2rem] object-cover border-4 border-white/20" />
                    <div><p className="text-xl font-black uppercase tracking-tight">Marina Costa</p><p className="text-[#C5A059] font-bold uppercase tracking-widest text-xs">CEO na CreativeHub</p></div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* SECTION DEPOIMENTOS (Empresários Felizes) */}
      <section id="depoimentos" className="py-32 px-8 bg-[#1A2B4C] text-white">
        <div className="max-w-7xl mx-auto space-y-20">
           <div className="text-center space-y-4">
             <h2 className="text-5xl font-black tracking-tighter uppercase">Empresários com Lucro Iluminado</h2>
             <p className="text-[#C5A059] font-black uppercase tracking-[0.3em] text-xs">Quem usa, recomenda a Apolo Finance</p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {[
                { name: "Sérgio Abreu", comp: "Abreu Logística", img: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=200", text: "Minha empresa cresceu 30% em 6 meses. O controle que a IA me dá sobre cada centavo do fluxo de caixa foi o diferencial." },
                { name: "Luciana Reis", comp: "Reis Advocacia", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200", text: "Relatórios DRE prontos todo dia 1º do mês era um sonho. Com a Apolo virou rotina. Meus sócios estão impressionados." },
                { name: "Bruno Mendes", comp: "Mendes Varejo", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200", text: "Recuperamos R$ 45k em custos desnecessários que a IA identificou no primeiro dashboard. O sistema se pagou no primeiro dia." }
              ].map((d, i) => (
                <div key={i} className="bg-white/5 p-16 rounded-[4rem] border border-white/10 hover:bg-white/10 transition-all group">
                   <div className="flex items-center space-x-6 mb-10">
                      <img src={d.img} className="w-20 h-20 rounded-[2.5rem] object-cover border-4 border-[#C5A059]/30 group-hover:border-[#C5A059] transition-all" />
                      <div><p className="font-black text-xl tracking-tight">{d.name}</p><p className="text-[#C5A059] font-bold text-[10px] uppercase tracking-widest">{d.comp}</p></div>
                   </div>
                   <p className="text-white/70 font-medium italic leading-relaxed text-lg">"{d.text}"</p>
                   <div className="mt-8 flex text-[#C5A059]"><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/></div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* PLANOS SECTION */}
      <section id="planos" className="py-32 px-8">
        <div className="max-w-7xl mx-auto space-y-24">
           <div className="text-center space-y-4">
             <h2 className="text-5xl font-black text-[#1A2B4C] tracking-tighter uppercase">Planos de Performance</h2>
             <p className="text-xl text-slate-500 font-medium">Escolha o nível de iluminação ideal para seu negócio.</p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { name: "Start", price: "297", features: ["Até 3 Empresas", "IA Classificação Básica", "DRE Mensal", "Suporte Individual"], isPopular: false },
                { name: "Professional", price: "597", features: ["Até 15 Empresas", "Consultoria Estratégica IA", "DRE e DFC Tempo Real", "Onboarding CNPJ"], isPopular: true },
                { name: "Escritório BPO", price: "1.297", features: ["Empresas Ilimitadas", "API de Integração", "Gerente de Conta Dedicado", "Treinamento VIP"], isPopular: false }
              ].map((p, i) => (
                <div key={i} className={`p-16 rounded-[4.5rem] border transition-all flex flex-col ${p.isPopular ? 'bg-[#1A2B4C] text-white shadow-2xl scale-105 border-[#1A2B4C]' : 'bg-white border-slate-100'}`}>
                   <p className={`text-[10px] font-black uppercase tracking-widest mb-8 ${p.isPopular ? 'text-[#C5A059]' : 'text-slate-400'}`}>{p.isPopular ? 'Recomendado' : p.name}</p>
                   <div className="flex items-baseline mb-12">
                      <span className="text-sm font-bold opacity-60 mr-2">R$</span>
                      <span className="text-7xl font-black tracking-tighter">{p.price}</span>
                      <span className="text-sm font-bold opacity-60 ml-2">/mês</span>
                   </div>
                   <ul className="space-y-6 mb-16 flex-1">
                      {p.features.map((f, j) => <li key={j} className="flex items-center text-sm font-bold"><CheckCircle size={18} className={`mr-3 ${p.isPopular ? 'text-emerald-400' : 'text-emerald-500'}`} /> {f}</li>)}
                   </ul>
                   <button onClick={handleLogin} className={`w-full py-7 rounded-[2.5rem] font-black uppercase tracking-widest transition-all text-xs ${p.isPopular ? 'bg-[#C5A059] text-white hover:bg-white hover:text-[#1A2B4C]' : 'bg-slate-100 text-[#1A2B4C] hover:bg-[#1A2B4C] hover:text-white'}`}>Selecionar Plano</button>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-32 px-8 bg-slate-50">
        <div className="max-w-4xl mx-auto space-y-20">
           <div className="text-center space-y-4">
             <h2 className="text-5xl font-black text-[#1A2B4C] uppercase tracking-tighter">Perguntas Frequentes</h2>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Tire todas as suas dúvidas antes de começar</p>
           </div>
           <div className="bg-white p-14 rounded-[4.5rem] border border-slate-100 shadow-sm">
              {[
                { q: "O sistema é seguro para meus dados financeiros?", a: "Totalmente seguro. Utilizamos criptografia de nível militar (AES-256) e certificados SSL de alta segurança. Seus dados bancários nunca são acessados diretamente: você sobe apenas o extrato PDF/OFX exportado do seu banco." },
                { q: "Como a IA consegue classificar meus gastos sozinha?", a: "Nossa IA Generativa foi treinada com milhões de padrões de lançamentos bancários brasileiros. Ela identifica fornecedores, impostos e categorias fiscais cruzando o histórico da sua empresa e o CNAE cadastrado no onboarding." },
                { q: "O que é o Relatório Executivo Apolo?", a: "É um dossiê completo gerado mensalmente que inclui DRE, DFC, Balanço e uma análise consultiva escrita pela IA Apolo, sugerindo onde reduzir custos e onde investir mais." },
                { q: "Posso cancelar minha assinatura a qualquer momento?", a: "Sim, trabalhamos no modelo SaaS sem fidelidade. Se decidir sair, você pode exportar todos os seus dados em Excel ou PDF e encerrar a conta sem multas." },
                { q: "O sistema emite notas fiscais?", a: "A Apolo Finance foca na gestão do fluxo de caixa e BPO estratégico. Para emissão de notas, recomendamos integrar o sistema com seu software de faturamento ou ERP atual." },
                { q: "Tenho suporte humano se precisar?", a: "Com certeza. Além da nossa IA Apolo que responde 24/7, nossos clientes nos planos Pro e Escritório têm acesso a consultores humanos via WhatsApp e E-mail em horário comercial." }
              ].map((item, i) => <FAQItem key={i} q={item.q} a={item.a} />)}
           </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-24 px-8 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-16">
           <div className="flex flex-col items-center md:items-start space-y-6">
              <div className="flex items-center space-x-3">
                 <ApoloLogo className="w-10 h-10" />
                 <div className="flex flex-col leading-none">
                   <span className="text-2xl font-black text-[#1A2B4C] uppercase tracking-tighter">APOLO</span>
                   <span className="text-[10px] font-bold text-[#C5A059] tracking-[0.3em] uppercase">FINANCE</span>
                 </div>
              </div>
              <p className="text-slate-400 font-bold text-sm text-center md:text-left max-w-xs leading-relaxed">Iluminando o caminho do sucesso financeiro para empresários em todo o Brasil.</p>
           </div>
           <div className="flex space-x-8 text-slate-300">
              <a href="#" className="hover:text-[#1A2B4C] transition-all hover:scale-110"><Instagram size={28}/></a>
              <a href="#" className="hover:text-[#1A2B4C] transition-all hover:scale-110"><Linkedin size={28}/></a>
              <a href="#" className="hover:text-[#1A2B4C] transition-all hover:scale-110"><Facebook size={28}/></a>
           </div>
           <div className="text-center md:text-right space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plataforma desenvolvida por</p>
              <p className="text-xl font-black text-[#1A2B4C] uppercase tracking-tighter">Bruno Leonn</p>
              <p className="text-[9px] font-bold text-[#C5A059] uppercase tracking-widest">© 2024 - Todos os direitos reservados</p>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
