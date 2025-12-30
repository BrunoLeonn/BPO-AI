
import React from 'react';
import { Transaction, TransactionType } from '../types';

interface ReportProps {
  transactions: Transaction[];
}

export const DRE: React.FC<ReportProps> = ({ transactions }) => {
  const categories = transactions.reduce((acc: any, t) => {
    if (!acc[t.category]) acc[t.category] = { total: 0, items: {} };
    if (!acc[t.category].items[t.subCategory]) acc[t.category].items[t.subCategory] = 0;
    
    const val = t.type === TransactionType.INCOME ? t.amount : -Math.abs(t.amount);
    acc[t.category].total += val;
    acc[t.category].items[t.subCategory] += val;
    return acc;
  }, {});

  const totalRevenue = Object.entries(categories)
    .filter(([name]) => name.toLowerCase().includes('receita'))
    .reduce((sum, [_, data]: any) => sum + data.total, 0);

  const totalExpenses = Object.entries(categories)
    .filter(([name]) => !name.toLowerCase().includes('receita'))
    .reduce((sum, [_, data]: any) => sum + data.total, 0);

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">DRE - Demonstrativo de Resultados do Exercício</h2>
      <div className="space-y-4">
        <div className="flex justify-between font-bold text-lg border-b pb-2">
          <span>Receita Bruta</span>
          <span className="text-emerald-600">{totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </div>
        
        {Object.entries(categories).map(([catName, data]: any) => (
          <div key={catName} className="pl-4">
            <div className="flex justify-between font-semibold text-slate-700 py-1">
              <span>{catName}</span>
              <span>{data.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            {Object.entries(data.items).map(([sub, val]: any) => (
              <div key={sub} className="flex justify-between text-sm text-slate-500 pl-4 py-0.5">
                <span>{sub}</span>
                <span>{val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            ))}
          </div>
        ))}

        <div className="flex justify-between font-bold text-xl border-t pt-4 mt-6">
          <span>Resultado Líquido</span>
          <span className={(totalRevenue + totalExpenses) >= 0 ? 'text-emerald-600' : 'text-red-600'}>
            {(totalRevenue + totalExpenses).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export const DFC: React.FC<ReportProps> = ({ transactions }) => {
  const inflow = transactions.filter(t => t.type === TransactionType.INCOME);
  const outflow = transactions.filter(t => t.type === TransactionType.EXPENSE);

  const sumInflow = inflow.reduce((s, t) => s + t.amount, 0);
  const sumOutflow = outflow.reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">DFC - Demonstrativo de Fluxo de Caixa</h2>
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-emerald-700 mb-3 border-b-2 border-emerald-100">Entradas de Caixa</h3>
          {inflow.map(t => (
            <div key={t.id} className="flex justify-between py-2 border-b border-slate-50 text-sm">
              <span>{t.date} - {t.description}</span>
              <span className="font-medium">{t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
          ))}
          <div className="flex justify-between mt-2 font-bold text-emerald-800">
            <span>Total Entradas</span>
            <span>{sumInflow.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-red-700 mb-3 border-b-2 border-red-100">Saídas de Caixa</h3>
          {outflow.map(t => (
            <div key={t.id} className="flex justify-between py-2 border-b border-slate-50 text-sm">
              <span>{t.date} - {t.description}</span>
              <span className="font-medium">({Math.abs(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})</span>
            </div>
          ))}
          <div className="flex justify-between mt-2 font-bold text-red-800">
            <span>Total Saídas</span>
            <span>({sumOutflow.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})</span>
          </div>
        </div>

        <div className="pt-4 border-t-2 border-slate-900 flex justify-between text-2xl font-black">
          <span>Saldo Final</span>
          <span className={(sumInflow - sumOutflow) >= 0 ? 'text-emerald-600' : 'text-red-600'}>
            {(sumInflow - sumOutflow).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      </div>
    </div>
  );
};
