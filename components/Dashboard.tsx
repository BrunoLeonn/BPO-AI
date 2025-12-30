
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Transaction, TransactionType } from '../types';

interface DashboardProps {
  transactions: Transaction[];
}

// Cores FlowFin (Azul e Verde institucionais)
const COLORS = ['#2563EB', '#10B981', '#3b82f6', '#059669', '#60a5fa', '#34d399'];

export const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const summary = transactions.reduce((acc, t) => {
    if (t.type === TransactionType.INCOME) acc.revenue += t.amount;
    else acc.expenses += Math.abs(t.amount);
    return acc;
  }, { revenue: 0, expenses: 0 });

  const profit = summary.revenue - summary.expenses;

  // Processamento inteligente das categorias para o gráfico de pizza
  const rawCategoryData = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc: any[], t) => {
      const existing = acc.find(i => i.name === t.category);
      if (existing) existing.value += Math.abs(t.amount);
      else acc.push({ name: t.category, value: Math.abs(t.amount) });
      return acc;
    }, [])
    .sort((a, b) => b.value - a.value);

  const totalExpense = rawCategoryData.reduce((sum, item) => sum + item.value, 0);

  // Agrupar categorias irrelevantes (< 5%) ou após as top 5 em "OUTROS"
  const categoryData = rawCategoryData.reduce((acc: any[], item, index) => {
    const percentage = (item.value / totalExpense) * 100;
    if (index < 5 && percentage >= 5) {
      acc.push(item);
    } else {
      const others = acc.find(i => i.name === 'OUTROS');
      if (others) others.value += item.value;
      else acc.push({ name: 'OUTROS', value: item.value });
    }
    return acc;
  }, []);

  const timelineData = transactions.reduce((acc: any[], t) => {
    const month = t.date.substring(0, 7);
    const existing = acc.find(i => i.month === month);
    if (existing) {
      if (t.type === TransactionType.INCOME) existing.inflow += t.amount;
      else existing.outflow += Math.abs(t.amount);
    } else {
      acc.push({ 
        month, 
        inflow: t.type === TransactionType.INCOME ? t.amount : 0,
        outflow: t.type === TransactionType.EXPENSE ? Math.abs(t.amount) : 0
      });
    }
    return acc;
  }, []).sort((a, b) => a.month.localeCompare(b.month));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fluxo de Entrada</p>
          <p className="text-4xl font-black text-slate-900 tracking-tighter">
            {summary.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Saídas Registradas</p>
          <p className="text-4xl font-black text-blue-600 tracking-tighter">
            {summary.expenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 bg-gradient-to-br from-white to-emerald-50">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Saldo Líquido Flow</p>
          <p className={`text-4xl font-black tracking-tighter ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="text-xl font-black mb-8 text-slate-900 uppercase tracking-widest text-[12px]">Performance Mensal Flow</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                <Tooltip 
                   contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                   formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }} />
                <Bar dataKey="inflow" name="Entradas" fill="#2563EB" radius={[8, 8, 0, 0]} />
                <Bar dataKey="outflow" name="Saídas" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="text-xl font-black mb-8 text-slate-900 uppercase tracking-widest text-[12px]">Mix de Categorias (Top 5)</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  paddingAngle={8}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', fontWeight: 'bold' }}
                  formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                />
                <Legend iconType="circle" layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
