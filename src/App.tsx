/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Calendar, 
  DollarSign, 
  Percent, 
  BarChart3,
  LayoutDashboard,
  History,
  Settings,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

type Result = 'Win' | 'Loss';

interface Operation {
  id: string;
  date: string;
  value: number;
  payout: number;
  result: Result;
}

// --- Helpers ---

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatPercent = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
};

const getWeekNumber = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const getMonthYear = (date: Date) => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${months[date.getMonth()]} - ${date.getFullYear()}`;
};

// --- Main Component ---

export default function App() {
  // --- State ---
  const [initialCapital, setInitialCapital] = useState<number>(() => {
    const saved = localStorage.getItem('trader_initial_capital');
    return saved ? parseFloat(saved) : 1000;
  });

  const [operations, setOperations] = useState<Operation[]>(() => {
    const saved = localStorage.getItem('trader_operations');
    return saved ? JSON.parse(saved) : [];
  });

  const [newOp, setNewOp] = useState<{
    date: string;
    value: string;
    payout: string;
    result: Result;
  }>({
    date: new Date().toISOString().split('T')[0],
    value: '',
    payout: '85',
    result: 'Win',
  });

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('trader_initial_capital', initialCapital.toString());
  }, [initialCapital]);

  useEffect(() => {
    localStorage.setItem('trader_operations', JSON.stringify(operations));
  }, [operations]);

  // --- Calculations ---
  const stats = useMemo(() => {
    let totalProfitLoss = 0;
    const processedOps = operations
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((op, index) => {
        const profitLoss = op.result === 'Win' 
          ? op.value * (op.payout / 100) 
          : -op.value;
        
        totalProfitLoss += profitLoss;
        
        return {
          ...op,
          profitLoss,
          week: getWeekNumber(new Date(op.date)),
          month: getMonthYear(new Date(op.date)),
        };
      });

    const currentBankroll = initialCapital + totalProfitLoss;
    const growth = initialCapital !== 0 ? (totalProfitLoss / initialCapital) * 100 : 0;

    // Monthly Summary
    const monthlySummary: Record<string, number> = {};
    processedOps.forEach(op => {
      monthlySummary[op.month] = (monthlySummary[op.month] || 0) + op.profitLoss;
    });

    return {
      totalProfitLoss,
      currentBankroll,
      growth,
      processedOps: processedOps.reverse(), // Show newest first in table
      monthlySummary: Object.entries(monthlySummary).sort((a, b) => {
        // Simple sort by date string (not perfect but works for most cases)
        return b[0].localeCompare(a[0]);
      })
    };
  }, [operations, initialCapital]);

  // --- Handlers ---
  const handleAddOperation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOp.value || !newOp.payout) return;

    const operation: Operation = {
      id: crypto.randomUUID(),
      date: newOp.date,
      value: parseFloat(newOp.value),
      payout: parseFloat(newOp.payout),
      result: newOp.result,
    };

    setOperations([...operations, operation]);
    setNewOp({
      ...newOp,
      value: '',
    });
  };

  const handleDeleteOperation = (id: string) => {
    setOperations(operations.filter(op => op.id !== id));
  };

  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os dados?')) {
      setOperations([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <LayoutDashboard className="w-8 h-8 text-indigo-600" />
              Diário de Trader Pro
            </h1>
            <p className="text-slate-500 mt-1">Gerenciamento de banca e registro de operações</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Capital Inicial</label>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">R$</span>
                <input 
                  type="number" 
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(parseFloat(e.target.value) || 0)}
                  className="w-32 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-lg font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
            <button 
              onClick={handleReset}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Limpar tudo"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Dashboard Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard 
            title="Capital Inicial" 
            value={formatCurrency(initialCapital)} 
            icon={<DollarSign className="w-5 h-5 text-indigo-600" />}
            color="indigo"
          />
          <DashboardCard 
            title="Banca Atual" 
            value={formatCurrency(stats.currentBankroll)} 
            icon={<BarChart3 className="w-5 h-5 text-blue-600" />}
            color="blue"
          />
          <DashboardCard 
            title="Lucro/Prejuízo Total" 
            value={formatCurrency(stats.totalProfitLoss)} 
            icon={stats.totalProfitLoss >= 0 ? <TrendingUp className="w-5 h-5 text-emerald-600" /> : <TrendingDown className="w-5 h-5 text-rose-600" />}
            color={stats.totalProfitLoss >= 0 ? "emerald" : "rose"}
            trend={stats.totalProfitLoss >= 0 ? "positive" : "negative"}
          />
          <DashboardCard 
            title="Crescimento (%)" 
            value={formatPercent(stats.growth)} 
            icon={<Percent className="w-5 h-5 text-amber-600" />}
            color="amber"
            trend={stats.growth >= 0 ? "positive" : "negative"}
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Form and Summary */}
          <div className="space-y-8">
            {/* Operation Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Nova Operação
              </h2>
              <form onSubmit={handleAddOperation} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Data</label>
                    <input 
                      type="date" 
                      value={newOp.date}
                      onChange={(e) => setNewOp({...newOp, date: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Resultado</label>
                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setNewOp({...newOp, result: 'Win'})}
                        className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${newOp.result === 'Win' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Win
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewOp({...newOp, result: 'Loss'})}
                        className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${newOp.result === 'Loss' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Loss
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Valor (R$)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="Ex: 50.00"
                      value={newOp.value}
                      onChange={(e) => setNewOp({...newOp, value: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Payout (%)</label>
                    <input 
                      type="number" 
                      placeholder="Ex: 85"
                      value={newOp.payout}
                      onChange={(e) => setNewOp({...newOp, payout: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Registrar Entrada
                </button>
              </form>
            </div>

            {/* Monthly Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                Resumo Mensal
              </h2>
              <div className="space-y-3">
                {stats.monthlySummary.length > 0 ? (
                  stats.monthlySummary.map(([month, value]) => (
                    <div key={month} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="font-medium text-slate-600">{month}</span>
                      <span className={`font-bold ${value >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatCurrency(value)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-400 py-4 text-sm">Nenhum registro mensal ainda.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Operations Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-600" />
                  Histórico de Operações
                </h2>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full uppercase">
                  {operations.length} Operações
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Data</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Valor</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Payout</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Resultado</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Lucro/Prej.</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <AnimatePresence initial={false}>
                      {stats.processedOps.length > 0 ? (
                        stats.processedOps.map((op) => (
                          <motion.tr 
                            key={op.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="hover:bg-slate-50/50 transition-colors group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-700">{new Date(op.date).toLocaleDateString('pt-BR')}</span>
                                <span className="text-[10px] text-slate-400 font-medium uppercase">Semana {op.week} • {op.month}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-600">{formatCurrency(op.value)}</td>
                            <td className="px-6 py-4 font-medium text-slate-600">{op.payout}%</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                op.result === 'Win' 
                                  ? 'bg-emerald-100 text-emerald-700' 
                                  : 'bg-rose-100 text-rose-700'
                              }`}>
                                {op.result}
                              </span>
                            </td>
                            <td className={`px-6 py-4 font-bold ${op.profitLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {formatCurrency(op.profitLoss)}
                            </td>
                            <td className="px-6 py-4">
                              <button 
                                onClick={() => handleDeleteOperation(op.id)}
                                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                            Nenhuma operação registrada ainda. Comece adicionando uma acima!
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Subcomponents ---

interface DashboardCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  trend?: 'positive' | 'negative';
}

function DashboardCard({ title, value, icon, color, trend }: DashboardCardProps) {
  const colorClasses: Record<string, string> = {
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600',
    blue: 'bg-blue-50 border-blue-100 text-blue-600',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600',
    rose: 'bg-rose-50 border-rose-100 text-rose-600',
    amber: 'bg-amber-50 border-amber-100 text-amber-600',
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-xl ${colorClasses[color]}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
            trend === 'positive' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
          }`}>
            {trend === 'positive' ? '+ ' : ''}
            {trend === 'positive' ? 'Lucro' : 'Prejuízo'}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
      </div>
    </div>
  );
}
