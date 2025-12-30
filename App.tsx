
import React, { useState, useRef } from 'react';
import { LayoutDashboard, FileText, Upload, Settings, TrendingUp, ChevronRight, Loader2, Sparkles, Building2, FileCheck, AlertCircle, X, Trash2 } from 'lucide-react';
import { CompanyProfile, Transaction } from './types';
import { Dashboard } from './components/Dashboard';
import { DRE, DFC } from './components/FinancialReports';
import { processStatementFile } from './geminiService';

interface FileUploadStatus {
  file: File;
  status: 'idle' | 'processing' | 'completed' | 'error';
  progress: number;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'dre' | 'dfc' | 'upload' | 'setup'>('setup');
  const [company, setCompany] = useState<CompanyProfile>({
    name: '',
    industry: '',
    fiscalYear: '2024'
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isOverallProcessing, setIsOverallProcessing] = useState(false);
  const [files, setFiles] = useState<FileUploadStatus[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(f => ({
        file: f,
        status: 'idle' as const,
        progress: 0
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const processAllFiles = async () => {
    if (files.length === 0) return;
    setIsOverallProcessing(true);
    
    let allNewTransactions: Transaction[] = [];

    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'completed') continue;

      setFiles(prev => {
        const next = [...prev];
        next[i].status = 'processing';
        return next;
      });

      try {
        const base64 = await fileToBase64(files[i].file);
        const results = await processStatementFile(company, {
          data: base64,
          mimeType: files[i].file.type || 'application/octet-stream',
          fileName: files[i].file.name
        });
        
        allNewTransactions = [...allNewTransactions, ...results];

        setFiles(prev => {
          const next = [...prev];
          next[i].status = 'completed';
          return next;
        });
      } catch (error) {
        console.error("Erro ao processar arquivo:", files[i].file.name, error);
        setFiles(prev => {
          const next = [...prev];
          next[i].status = 'error';
          return next;
        });
      }
    }

    // Ordenar transações por data (cronologicamente)
    const combined = [...transactions, ...allNewTransactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    setTransactions(combined);
    setIsOverallProcessing(false);
    
    if (allNewTransactions.length > 0) {
      setActiveTab('dashboard');
    }
  };

  const NavItem = ({ id, icon: Icon, label }: { id: any, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-colors ${
        activeTab === id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6">
          <div className="flex items-center space-x-2 text-blue-600 mb-8">
            <Sparkles className="fill-blue-600" />
            <span className="text-xl font-bold tracking-tight text-slate-900">BPO AI</span>
          </div>

          <nav className="space-y-2">
            <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem id="dre" icon={FileText} label="DRE" />
            <NavItem id="dfc" icon={TrendingUp} label="Fluxo de Caixa" />
            <div className="pt-4 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Operações</div>
            <NavItem id="upload" icon={Upload} label="Processar Extratos" />
            <NavItem id="setup" icon={Settings} label="Configurações" />
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-slate-100">
          <div className="flex items-center space-x-3 p-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
              <Building2 size={16} className="text-slate-500" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{company.name || 'Empresa Nova'}</p>
              <p className="text-xs text-slate-500 truncate">{company.industry || 'Ramo não definido'}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {activeTab === 'dashboard' && 'Visão Geral'}
              {activeTab === 'dre' && 'Demonstrativo de Resultados'}
              {activeTab === 'dfc' && 'Fluxo de Caixa'}
              {activeTab === 'upload' && 'Inteligência Artificial de Extratos'}
              {activeTab === 'setup' && 'Configurações da Empresa'}
            </h1>
            <p className="text-slate-500 mt-1">Gestão inteligente e multibancos</p>
          </div>
          <div className="flex space-x-3">
            {transactions.length > 0 && (
              <button 
                onClick={() => setTransactions([])}
                className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center"
              >
                <Trash2 size={16} className="mr-2" /> Limpar Dados
              </button>
            )}
          </div>
        </header>

        <div className="max-w-6xl mx-auto">
          {activeTab === 'setup' && (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold mb-6">Cadastro da Empresa</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Empresa</label>
                  <input 
                    type="text" 
                    value={company.name}
                    onChange={e => setCompany({...company, name: e.target.value})}
                    placeholder="Ex: Minha Empresa LTDA"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ramo de Atuação</label>
                  <select 
                    value={company.industry}
                    onChange={e => setCompany({...company, industry: e.target.value})}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Selecione...</option>
                    <option value="Serviços de Tecnologia">Serviços de Tecnologia</option>
                    <option value="Comércio Varejista">Comércio Varejista</option>
                    <option value="Indústria">Indústria</option>
                    <option value="Restaurante / Alimentação">Restaurante / Alimentação</option>
                    <option value="Saúde">Saúde</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ano Fiscal</label>
                  <input 
                    type="text" 
                    value={company.fiscalYear}
                    onChange={e => setCompany({...company, fiscalYear: e.target.value})}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button 
                  onClick={() => setActiveTab('upload')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center"
                >
                  Próximo Passo <ChevronRight className="ml-2" size={18} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-start space-x-4 mb-8">
                   <div className="p-3 bg-blue-50 rounded-lg">
                      <Upload className="text-blue-600" />
                   </div>
                   <div>
                      <h2 className="text-xl font-bold">Importação de Extratos</h2>
                      <p className="text-slate-500">Suporte a múltiplos bancos (Santander, Mercado Pago, Itaú, etc) em formatos PDF e OFX.</p>
                   </div>
                </div>
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center hover:bg-slate-50 hover:border-blue-300 cursor-pointer transition-all group"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    multiple 
                    accept=".pdf,.ofx,.txt" 
                    onChange={onFileChange}
                  />
                  <div className="inline-flex p-4 bg-blue-50 rounded-full mb-4 text-blue-600 group-hover:scale-110 transition-transform">
                    <Upload size={32} />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">Selecione ou Arraste seus arquivos</h3>
                  <p className="text-slate-500 text-sm">PDF, OFX ou TXT de qualquer banco</p>
                </div>

                {files.length > 0 && (
                  <div className="mt-8 space-y-3">
                    <h4 className="font-semibold text-sm text-slate-700 uppercase tracking-wider">Fila de Processamento</h4>
                    {files.map((f, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex items-center space-x-3">
                          {f.status === 'completed' ? <FileCheck className="text-emerald-500" /> : 
                           f.status === 'error' ? <AlertCircle className="text-red-500" /> :
                           f.status === 'processing' ? <Loader2 className="text-blue-500 animate-spin" /> :
                           <FileText className="text-slate-400" />}
                          <div>
                            <p className="text-sm font-medium text-slate-800">{f.file.name}</p>
                            <p className="text-xs text-slate-500">{(f.file.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        {f.status === 'idle' && (
                          <button onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="text-slate-400 hover:text-red-500">
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={processAllFiles}
                    disabled={isOverallProcessing || files.length === 0 || files.every(f => f.status === 'completed')}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg transition-all"
                  >
                    {isOverallProcessing ? (
                      <> <Loader2 className="animate-spin mr-2" size={20} /> Processando Lote... </>
                    ) : (
                      <> <Sparkles className="mr-2" size={20} /> Processar Todos os Arquivos </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && transactions.length > 0 && (
            <Dashboard transactions={transactions} />
          )}

          {activeTab === 'dashboard' && transactions.length === 0 && (
            <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-200">
              <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4">
                <LayoutDashboard className="text-slate-400" size={32} />
              </div>
              <h3 className="text-lg font-semibold">Nenhum dado processado</h3>
              <p className="text-slate-500 max-w-sm mx-auto mt-2">Importe os extratos bancários para visualizar os indicadores e relatórios automáticos.</p>
              <button 
                onClick={() => setActiveTab('upload')}
                className="mt-6 text-blue-600 font-bold hover:underline"
              >
                Ir para Importação &rarr;
              </button>
            </div>
          )}

          {activeTab === 'dre' && <DRE transactions={transactions} />}
          {activeTab === 'dfc' && <DFC transactions={transactions} />}
        </div>
      </main>
    </div>
  );
};

export default App;
