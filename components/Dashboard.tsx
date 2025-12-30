
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import { Transaction, TransactionType } from '../types';

interface DashboardProps {
  transactions: Transaction[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const summary = transactions.reduce((acc, t) => {
    if (t.type === TransactionType.INCOME) acc.revenue += t.amount;
    else acc.expenses += Math.abs(t.amount);
    return acc;
  }, { revenue: 0, expenses: 0 });

  const profit = summary.revenue - summary.expenses;

  // Prepare Pie Chart data (Spending by Category)
  const categoryData = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc: any[], t) => {
      const existing = acc.find(i => i.name === t.category);
      if (existing) existing.value += Math.abs(t.amount);
      else acc.push({ name: t.category, value: Math.abs(t.amount) });
      return acc;
    }, []);

  // Prepare Line Chart data (Monthly Flow)
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500 uppercase">Receita Total</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">
            {summary.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500 uppercase">Despesa Total</p>
          <p className="text-3xl font-bold text-red-600 mt-1">
            {summary.expenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500 uppercase">Resultado (Lucro/Prejuízo)</p>
          {/* Fix: Added missing className attribute to resolve JSX parsing error */}
          <p className={`text-3xl font-bold mt-1 ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-6">Fluxo de Caixa Mensal</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                   formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                />
                <Legend />
                <Bar dataKey="inflow" name="Entradas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outflow" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-6">Distribuição de Gastos</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};