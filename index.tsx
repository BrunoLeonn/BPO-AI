

import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
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
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { GoogleGenAI, Type } from "@google/genai";

// --- TYPES & INTERFACES ---

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
  confidence?: number;
}

export interface BankAccount {
  id: string;
  bankName: string;
  companyName: string;
  currentBalance: number;
  lastUpdated: string;
}

export interface CompanyProfile {
  name: string;
  tradingName?: string;
  cnpj: string;
  industry: string;
  fiscalYear: string;
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

// --- GEMINI SERVICES ---

const API_KEY = process.env.API_KEY as string;

const cleanJsonResponse = (text: string) => {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

const analyzeCNPJCard = async (fileData: { data: string; mimeType: string }): Promise<Partial<CompanyProfile>> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [{ inlineData: { data: fileData.data, mimeType: fileData.mimeType } }] },
    config: {
      systemInstruction: "Extraia Razão Social (name), CNPJ e Atividade (industry) do Cartão CNPJ. Retorne apenas JSON.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: { name: { type: Type.STRING }, cnpj: { type: Type.STRING }, industry: { type: Type.STRING } }
      }
    }
  });
  return JSON.parse(cleanJsonResponse(response.text || '{}'));
};

const generateAIStrategy = async (company: CompanyProfile, transactions: Transaction[]): Promise<AIAdvice> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const summaryData = transactions.slice(-50).map(t => ({ desc: t.description, val: t.amount, type: t.type, cat: t.category }));
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Analise: ${JSON.stringify(summaryData)} para ${company.name}`,
    config: {
      systemInstruction: "Atue como consultor BPO Financeiro. Forneça healthScore (0-100), summary, strengths, weaknesses e recommendations.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          healthScore: { type: Type.NUMBER },
          summary: { type: Type.STRING },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });
  return JSON.parse(cleanJsonResponse(response.text || '{}'));
};

const processStatementFile = async (company: CompanyProfile, fileData: { data: string; mimeType: string; fileName: string }): Promise<Transaction[]> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [{ inlineData: { data: fileData.data, mimeType: fileData.mimeType } }] },
    config: {
      systemInstruction: `Extraia transações do extrato ${fileData.fileName} de ${company.name}.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            date: { type: Type.STRING },
            description: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            type: { type: Type.STRING, enum: ["INCOME", "EXPENSE"] },
            category: { type: Type.STRING },
            subCategory: { type: Type.STRING },
            bankName: { type: Type.STRING }
          }
        }
      }
    }
  });
  return JSON.parse(cleanJsonResponse(response.text || '[]'));
};

// --- COMPONENTS ---

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
    </svg>
  </div>
);

const Dashboard: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const COLORS = ['#1A2B4C', '#C5A059', '#4A8C4A', '#2E4C7E', '#E2C288'];
  const summary = transactions.reduce((acc, t) => {
    if (t.type === TransactionType.INCOME) acc.revenue += t.amount;
    else acc.expenses += Math.abs(t.amount);
    return acc;
  }, { revenue: 0, expenses: 0 });

  const catData = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc: any[], t) => {
    const ex = acc.find(i => i.name === t.category);
    if (ex) ex.value += Math.abs(t.amount);
    else acc.push({ name: t.category, value: Math.abs(t.amount) });
    return acc;
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Receita Bruta</p>
          <p className="text-3xl font-black text-[#1A2B4C]">R$ {summary.revenue.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Despesas</p>
          <p className="text-3xl font-black text-[#C5A059]">R$ {summary.expenses.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Lucro Líquido</p>
          <p className={`text-3xl font-black ${(summary.revenue - summary.expenses) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>R$ {(summary.revenue - summary.expenses).toLocaleString('pt-BR')}</p>
        </div>
      </div>
      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={catData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#1A2B4C" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const FAQItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 py-6 last:border-0">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left group">
        <span className="text-lg font-black text-[#1A2B4C] group-hover:text-[#C5A059] transition-colors">{q}</span>
        <ChevronDown className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#C5A059]' : 'text-slate-300'}`} />
      </button>
      <div className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
        <p className="overflow-hidden text-slate-500 font-medium leading-relaxed">{a}</p>
      </div>
    </div>
  );
};

const DemoModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[500] flex items-center justify-center p-8 animate-in fade-in">
    <div className="absolute inset-0 bg-[#1A2B4C]/90 backdrop-blur-md" onClick={onClose}></div>
    <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col lg:flex-row h-[70vh] animate-in zoom-in-95">
      <button onClick={onClose} className="absolute top-6 right-6 z-10 p-2 bg-slate-100 rounded-full hover:bg-red-50 transition-colors"><X/></button>
      <div className="flex-1 bg-slate-900 flex items-center justify-center relative">
        <PlayCircle size={80} className="text-[#C5A059] animate-pulse" />
        <p className="absolute bottom-10 text-white/40 font-black text-[10px] uppercase tracking-widest">Apolo Finance Preview v2.5</p>
      </div>
      <div className="w-full lg:w-80 bg-white p-12 flex flex-col justify-center space-y-8">
        <h3 className="text-2xl font-black text-[#1A2B4C] leading-tight">O futuro da sua <br/>gestão em 1min.</h3>
        <ul className="space-y-4">
          {["Leitura Automática", "DRE em Tempo Real", "Insights com IA"].map(f => (
            <li key={f} className="flex items-center text-xs font-bold text-slate-500"><CheckCircle className="mr-2 text-emerald-500" size={16}/> {f}</li>
          ))}
        </ul>
        <button onClick={onClose} className="bg-[#1A2B4C] text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">Entendido</button>
      </div>
    </div>
  </div>
);

// --- APP MAIN ---

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'upload' | 'setup' | 'crm' | 'strategy'>('setup');
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [company, setCompany] = useState<CompanyProfile>({ name: '', cnpj: '', industry: '', fiscalYear: '2024' });
  const [crm, setCRM] = useState<CRMClient[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [aiAdvice, setAIAdvice] = useState<AIAdvice | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredTransactions = useMemo(() => transactions.filter(t => t.costCenter === company.cnpj), [transactions, company.cnpj]);

  useEffect(() => {
    const saved = localStorage.getItem('apolo_data');
    if (saved) {
      const { c, cl, t } = JSON.parse(saved);
      if (c) setCompany(c);
      if (cl) setCRM(cl);
      if (t) setTransactions(t);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('apolo_data', JSON.stringify({ c: company, cl: crm, t: transactions }));
  }, [company, crm, transactions]);

  // Fix: Added handleLogin function to fix errors on lines 380 and 393
  const handleLogin = () => {
    setView('app');
    setActiveTab('setup');
  };

  const handleProcessCNPJ = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const data = await analyzeCNPJCard({ data: (reader.result as string).split(',')[1], mimeType: file.type });
        const updated = { ...company, ...data };
        setCompany(updated);
        setCRM(p => [{ id: Math.random().toString(), ...updated, onboardingDate: new Date().toLocaleDateString() } as CRMClient, ...p]);
        setActiveTab('dashboard');
      } catch (err) { alert('Erro na leitura.'); } finally { setIsProcessing(false); }
    };
  };

  if (view === 'app') {
    return (
      <div className="flex h-screen bg-slate-50 font-inter">
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col p-8">
          <div className="flex items-center space-x-3 mb-12">
            <ApoloLogo className="w-10 h-10" />
            <div className="leading-none"><p className="text-lg font-black text-[#1A2B4C] tracking-tighter">APOLO</p><p className="text-[8px] font-bold text-[#C5A059] tracking-widest uppercase">FINANCE</p></div>
          </div>
          <nav className="flex-1 space-y-1">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center p-3 rounded-xl font-bold text-xs uppercase tracking-widest ${activeTab === 'dashboard' ? 'bg-[#1A2B4C] text-white shadow-xl shadow-[#1A2B4C]/20' : 'text-slate-400 hover:bg-slate-50'}`}><LayoutDashboard className="mr-3" size={16}/> Dashboard</button>
            <button onClick={() => setActiveTab('strategy')} className={`w-full flex items-center p-3 rounded-xl font-bold text-xs uppercase tracking-widest ${activeTab === 'strategy' ? 'bg-[#1A2B4C] text-white' : 'text-slate-400 hover:bg-slate-50'}`}><Sparkles className="mr-3" size={16}/> Consultoria IA</button>
            <button onClick={() => setActiveTab('upload')} className={`w-full flex items-center p-3 rounded-xl font-bold text-xs uppercase tracking-widest ${activeTab === 'upload' ? 'bg-[#1A2B4C] text-white' : 'text-slate-400 hover:bg-slate-50'}`}><Upload className="mr-3" size={16}/> Importação</button>
            <button onClick={() => setActiveTab('crm')} className={`w-full flex items-center p-3 rounded-xl font-bold text-xs uppercase tracking-widest ${activeTab === 'crm' ? 'bg-[#1A2B4C] text-white' : 'text-slate-400 hover:bg-slate-50'}`}><Users className="mr-3" size={16}/> Clientes</button>
            <button onClick={() => setActiveTab('setup')} className={`w-full flex items-center p-3 rounded-xl font-bold text-xs uppercase tracking-widest ${activeTab === 'setup' ? 'bg-[#1A2B4C] text-white' : 'text-slate-400 hover:bg-slate-50'}`}><Settings className="mr-3" size={16}/> Setup IA</button>
          </nav>
          <button onClick={() => setView('landing')} className="w-full p-4 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase hover:text-red-500 transition-colors">Sair do Sistema</button>
        </aside>
        <main className="flex-1 p-12 overflow-y-auto">
          {activeTab === 'setup' && (
            <div className="max-w-3xl mx-auto bg-white p-20 rounded-[3rem] shadow-2xl border border-slate-100 text-center">
              <Landmark size={48} className="mx-auto mb-6 text-slate-200" />
              <h2 className="text-3xl font-black text-[#1A2B4C] mb-4">Onboarding IA</h2>
              <p className="text-slate-400 font-medium mb-12">Suba o Cartão CNPJ para configurar sua empresa em segundos.</p>
              <input type="file" onChange={handleProcessCNPJ} className="hidden" id="cnpj-upload" />
              <label htmlFor="cnpj-upload" className="bg-[#1A2B4C] text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest cursor-pointer shadow-xl hover:scale-105 transition-all inline-block">Selecionar PDF/JPG</label>
              {isProcessing && <p className="mt-8 text-xs font-black text-slate-400 animate-pulse">Apolo IA Analisando...</p>}
            </div>
          )}
          {activeTab === 'dashboard' && <Dashboard transactions={filteredTransactions} />}
          {activeTab === 'strategy' && (
            <div className="max-w-4xl mx-auto space-y-8">
               <div className="bg-[#1A2B4C] p-16 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute right-[-40px] bottom-[-40px] opacity-10 rotate-12"><ApoloLogo className="w-64 h-64" /></div>
                  <h3 className="text-[#C5A059] font-black text-[10px] uppercase tracking-widest mb-8">Estratégia Apolo Finance</h3>
                  <p className="text-4xl font-medium leading-tight italic border-l-8 border-[#C5A059] pl-10">"{aiAdvice?.summary || 'Gere uma análise para ver os insights da IA.'}"</p>
                  <button 
                    onClick={async () => {
                      setIsProcessing(true);
                      const adv = await generateAIStrategy(company, filteredTransactions);
                      setAIAdvice(adv);
                      setIsProcessing(false);
                    }}
                    disabled={isProcessing || filteredTransactions.length === 0}
                    className="mt-12 bg-[#C5A059] text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all flex items-center disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />} Analisar Performance
                  </button>
               </div>
               {aiAdvice && (
                 <div className="grid grid-cols-2 gap-8 animate-in slide-in-from-bottom-8">
                    <div className="bg-emerald-50 p-10 rounded-[2.5rem] border border-emerald-100">
                       <h4 className="text-emerald-900 font-black mb-6 uppercase text-[10px] tracking-widest">Fortalezas</h4>
                       <ul className="space-y-3">{aiAdvice.strengths.map(s => <li key={s} className="text-sm font-bold text-emerald-800 flex items-start"><Check className="mr-2 shrink-0" size={16}/> {s}</li>)}</ul>
                    </div>
                    <div className="bg-[#C5A059]/10 p-10 rounded-[2.5rem] border border-[#C5A059]/20">
                       <h4 className="text-[#C5A059] font-black mb-6 uppercase text-[10px] tracking-widest">Recomendações</h4>
                       <ul className="space-y-3">{aiAdvice.recommendations.map(r => <li key={r} className="text-sm font-bold text-slate-800 flex items-start"><ArrowUpRight className="mr-2 shrink-0 text-[#C5A059]" size={16}/> {r}</li>)}</ul>
                    </div>
                 </div>
               )}
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-inter scroll-smooth overflow-x-hidden">
      {isDemoOpen && <DemoModal onClose={() => setIsDemoOpen(false)} />}
      <header className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-[100] border-b border-slate-50 h-24 flex items-center px-8">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <ApoloLogo />
            <div className="leading-none"><p className="text-xl font-black text-[#1A2B4C] tracking-tighter">APOLO</p><p className="text-[9px] font-bold text-[#C5A059] tracking-widest uppercase">FINANCE</p></div>
          </div>
          <nav className="hidden md:flex space-x-12 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <a href="#beneficios" className="hover:text-[#1A2B4C] transition-colors">Vantagens</a>
            <a href="#depoimentos" className="hover:text-[#1A2B4C] transition-colors">Cases</a>
            <a href="#faq" className="hover:text-[#1A2B4C] transition-colors">Dúvidas</a>
          </nav>
          <button onClick={handleLogin} className="bg-[#1A2B4C] text-white px-10 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#1A2B4C]/20 hover:scale-105 transition-all">Acesso Restrito</button>
        </div>
      </header>

      <section className="pt-48 pb-32 px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-24">
          <div className="flex-1 space-y-10 animate-in fade-in slide-in-from-left-10 duration-700">
            <div className="inline-flex items-center space-x-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
              <Sparkles size={12}/> <span>BPO Financeiro Escalável</span>
            </div>
            <h1 className="text-7xl lg:text-[6.5rem] font-black text-[#1A2B4C] leading-[0.85] tracking-tighter">Gestão que <br/><span className="text-[#C5A059]">Ilumina o Lucro.</span></h1>
            <p className="text-xl text-slate-500 font-medium max-w-lg leading-relaxed">Automatize 100% da sua conciliação e receba insights estratégicos da IA Apolo para crescer seu negócio.</p>
            <div className="flex flex-wrap gap-6">
              <button onClick={handleLogin} className="bg-[#1A2B4C] text-white px-12 py-7 rounded-[2.5rem] font-black text-lg shadow-2xl flex items-center group">Experimentar Grátis <ArrowUpRight className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"/></button>
              <button onClick={() => setIsDemoOpen(true)} className="bg-white text-[#1A2B4C] border-2 border-[#1A2B4C] px-10 py-7 rounded-[2.5rem] font-black text-lg flex items-center hover:bg-slate-50 transition-all"><PlayCircle className="mr-2" /> Demonstração</button>
            </div>
          </div>
          <div className="flex-1 relative">
             <div className="bg-[#1A2B4C] p-4 rounded-[4rem] shadow-2xl rotate-3 hover:rotate-0 transition-all duration-700">
                <div className="bg-white rounded-[3rem] aspect-video flex items-center justify-center p-8 overflow-hidden">
                   <div className="w-full h-full bg-slate-50 rounded-[2rem] border border-slate-100 p-8 space-y-6">
                      <div className="flex justify-between"><div className="w-32 h-6 bg-slate-200 rounded-full animate-pulse"></div><div className="w-10 h-10 bg-[#C5A059]/20 rounded-xl"></div></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-32 bg-white rounded-2xl shadow-sm border border-slate-100 animate-pulse"></div>
                        <div className="h-32 bg-white rounded-2xl shadow-sm border border-slate-100 animate-pulse [animation-delay:0.2s]"></div>
                      </div>
                   </div>
                </div>
             </div>
             <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-[2rem] shadow-2xl border border-slate-100 hidden lg:block animate-bounce [animation-duration:5s]">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-black"><Check size={24}/></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase">Acurácia IA</p><p className="text-2xl font-black text-[#1A2B4C]">99.9%</p></div>
                </div>
             </div>
          </div>
        </div>
      </section>

      <section id="beneficios" className="py-32 px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-24">
            <h2 className="text-5xl font-black text-[#1A2B4C] tracking-tighter uppercase">Potência Tecnológica</h2>
            <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">O BPO Financeiro que não apenas conta centavos, mas prevê oportunidades.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { i: Zap, t: "Conciliação Automática", d: "Extraia transações de PDF/OFX e classifique em segundos via IA." },
              { i: FileCheck, t: "DRE e DFC Reais", d: "Demonstrativos precisos gerados a cada novo lançamento bancário." },
              { i: HeartPulse, t: "Saúde em Dashboards", d: "BI avançado com margens, EBITDA e projeção de caixa integrados." }
            ].map((b, i) => (
              <div key={i} className="bg-white p-14 rounded-[3.5rem] border border-slate-100 hover:shadow-2xl transition-all group">
                <div className="w-16 h-16 bg-slate-50 text-[#1A2B4C] rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#1A2B4C] group-hover:text-white transition-colors"><b.i size={32}/></div>
                <h3 className="text-2xl font-black text-[#1A2B4C] mb-4 uppercase tracking-tight">{b.t}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-32 px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black text-[#1A2B4C] text-center mb-20 uppercase tracking-tighter">FAQ Corporativo</h2>
          <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm">
            {[
              { q: "O sistema é seguro para meus dados?", a: "Sim. Usamos criptografia AES-256 e o sistema não acessa diretamente sua conta bancária, apenas processa os extratos que você exporta manualmente ou via integração segura." },
              { q: "Como a IA aprende os lançamentos?", a: "Nossa IA Generativa analisa o padrão histórico da sua empresa e o CNAE cadastrado para sugerir as categorias fiscais com 99% de precisão." },
              { q: "Posso cancelar minha conta quando quiser?", a: "A Apolo Finance opera no modelo SaaS sem fidelidade. Você pode exportar todos os seus dados em Excel ou PDF a qualquer momento e encerrar a assinatura." }
            ].map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      <footer className="py-20 px-8 border-t border-slate-100 text-center space-y-8">
        <div className="flex justify-center items-center space-x-3">
          <ApoloLogo className="w-12 h-12" />
          <div className="text-left leading-none"><p className="text-2xl font-black text-[#1A2B4C] tracking-tighter">APOLO FINANCE</p><p className="text-[10px] font-bold text-[#C5A059] tracking-widest uppercase">Tecnologia Bruno Leonn</p></div>
        </div>
        <p className="text-slate-300 font-bold text-[10px] uppercase tracking-[0.4em]">© 2024 - Todos os direitos reservados</p>
      </footer>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><App /></React.StrictMode>);
