import { useState, useEffect, useCallback } from 'react';
import { Plus, Download, Search, Filter, Import as SortAsc, DollarSign, TrendingUp, CheckCircle, BarChart2, Eye, CreditCard as Edit2, Trash2, RefreshCw, LayoutGrid, List, Printer } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Deal, DealStage } from '../../lib/supabase';
import { DEAL_STAGES, STAGE_PROBABILITIES } from '../../lib/supabase';
import { CreateDealModal } from './CreateDealModal';
import { DealDetailDrawer } from './DealDetailDrawer';
import { KanbanBoard } from './KanbanBoard';

const SORT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'updated_asc', label: 'Oldest Interacted' },
  { value: 'updated_desc', label: 'Most Recent' },
  { value: 'value_desc', label: 'Highest Value' },
  { value: 'value_asc', label: 'Lowest Value' },
];

function fmtCurrency(n: number) {
  if (!n) return '$0';
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return '$' + (n / 1000).toFixed(0) + 'k';
  return '$' + n.toLocaleString('en-US');
}

function fmtDaysAgo(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

interface DealsPageProps {
  role: 'manager' | 'member';
  userName: string;
  onToast: (msg: string) => void;
}

type ViewMode = 'table' | 'kanban';

export function DealsPage({ role, userName, onToast }: DealsPageProps) {
  const isManager = role === 'manager';
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activities, setActivities] = useState<Record<string, { type: string; created_at: string }[]>>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<'All' | DealStage>('All');
  const [sort, setSort] = useState('default');
  const [showModal, setShowModal] = useState(false);
  const [drawerDeal, setDrawerDeal] = useState<Deal | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('deals').select('*');
    if (!isManager) query = query.eq('owner_name', userName);
    const { data, error } = await query;
    if (error) { onToast('Failed to load deals'); setLoading(false); return; }
    const dealsData = (data as Deal[]) ?? [];
    setDeals(dealsData);

    if (dealsData.length > 0) {
      const ids = dealsData.map(d => d.id);
      const { data: actData } = await supabase.from('deal_activities').select('deal_id, type, created_at').in('deal_id', ids).order('created_at', { ascending: false });
      if (actData) {
        const grouped: Record<string, { type: string; created_at: string }[]> = {};
        for (const act of actData) {
          if (!grouped[act.deal_id]) grouped[act.deal_id] = [];
          grouped[act.deal_id].push({ type: act.type, created_at: act.created_at });
        }
        setActivities(grouped);
      }
    }
    setLoading(false);
  }, [isManager, userName, onToast]);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  // KPIs
  const activeDeals = deals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost');
  const wonDeals = deals.filter(d => d.stage === 'Closed Won');
  const closedDeals = deals.filter(d => d.stage === 'Closed Won' || d.stage === 'Closed Lost');
  const totalPipeline = activeDeals.reduce((s, d) => s + (d.value ?? 0), 0);
  const weightedForecast = activeDeals.reduce((s, d) => s + ((d.value ?? 0) * (d.probability ?? 0)) / 100, 0);
  const winRate = closedDeals.length > 0 ? ((wonDeals.length / closedDeals.length) * 100).toFixed(0) + '%' : '—';

  const filtered = deals
    .filter(d => {
      if (search) { const q = search.toLowerCase(); if (!d.name.toLowerCase().includes(q) && !d.company.toLowerCase().includes(q)) return false; }
      if (stageFilter !== 'All' && d.stage !== stageFilter) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sort) {
        case 'updated_asc': return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        case 'updated_desc': return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'value_desc': return (b.value ?? 0) - (a.value ?? 0);
        case 'value_asc': return (a.value ?? 0) - (b.value ?? 0);
        default: return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

  async function handleCreateDeal(data: Omit<Deal, 'id' | 'created_at' | 'updated_at' | 'lead_id'>) {
    const { data: inserted, error } = await supabase.from('deals').insert({ ...data, lead_id: null }).select().maybeSingle();
    if (error || !inserted) { onToast('Failed to create deal'); return; }
    await supabase.from('deal_activities').insert({ deal_id: inserted.id, type: 'System Update', note: `Deal created at ${data.stage} stage`, logged_by: userName });
    setShowModal(false); onToast('Deal created successfully'); await fetchDeals();
  }

  async function handleStageChange(dealId: string, newStage: DealStage) {
    const newProb = STAGE_PROBABILITIES[newStage];
    const { error } = await supabase.from('deals').update({ stage: newStage, probability: newProb }).eq('id', dealId);
    if (error) { onToast('Failed to update stage'); return; }
    await supabase.from('deal_activities').insert({ deal_id: dealId, type: 'System Update', note: `Stage moved to ${newStage} (probability: ${newProb}%)`, logged_by: userName });
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: newStage, probability: newProb } : d));
    onToast(`Deal moved to ${newStage}`);
    await fetchDeals();
  }

  async function handleInlineStageChange(deal: Deal, newStage: DealStage) {
    if (deal.stage === newStage) return;
    await handleStageChange(deal.id, newStage);
  }

  async function handleDeleteDeal(id: string) {
    if (!confirm('Delete this deal permanently?')) return;
    setDeletingId(id);
    await supabase.from('deals').delete().eq('id', id);
    setDeletingId(null); onToast('Deal deleted');
    if (drawerDeal?.id === id) setDrawerDeal(null);
    await fetchDeals();
  }

  function handleDealUpdated(updated: Deal) {
    setDeals(prev => prev.map(d => d.id === updated.id ? updated : d));
    if (drawerDeal?.id === updated.id) setDrawerDeal(updated);
  }

  function exportDeals() {
    const csv = [
      ['Name', 'Company', 'Value', 'Stage', 'Probability', 'Forecast Value', 'Owner', 'Close Date'].join(','),
      ...filtered.map(d => [d.name, d.company, d.value, d.stage, d.probability + '%', ((d.value * d.probability) / 100).toFixed(0), d.owner_name, d.expected_close_date ?? ''].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `deals_pipeline_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    onToast('Pipeline exported to CSV');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Commercial Deals Pipeline</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track pipeline stages, forecast revenue, and manage commercial deal progress.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isManager && (
            <>
              <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 transition shadow-sm">
                <Printer className="w-4 h-4" />
              </button>
              <button onClick={exportDeals} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 transition shadow-sm">
                <Download className="w-4 h-4" />Export
              </button>
            </>
          )}
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition">
            <Plus className="w-4 h-4" />Create Deal
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Pipeline Value', value: fmtCurrency(totalPipeline), icon: <DollarSign className="w-5 h-5" />, bg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400', color: 'text-indigo-600 dark:text-indigo-400', sub: 'Active deals only' },
          { title: 'Weighted Forecast', value: fmtCurrency(weightedForecast), icon: <TrendingUp className="w-5 h-5" />, bg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400', color: 'text-emerald-600 dark:text-emerald-400', sub: 'Value × probability' },
          { title: 'Active Deals', value: activeDeals.length, icon: <BarChart2 className="w-5 h-5" />, bg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400', color: 'text-blue-600 dark:text-blue-400', sub: 'In pipeline stages' },
          { title: 'Win Rate', value: winRate, icon: <CheckCircle className="w-5 h-5" />, bg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400', color: 'text-purple-600 dark:text-purple-400', sub: 'Won vs closed deals' },
        ].map(card => (
          <div key={card.title} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{card.title}</p>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.bg}`}>{card.icon}</div>
            </div>
            <p className={`text-3xl font-extrabold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Filter Toolbar + View Switcher */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search deals or companies..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <select value={stageFilter} onChange={e => setStageFilter(e.target.value as 'All' | DealStage)}
              className="pl-8 pr-8 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none">
              <option value="All">All Stages</option>
              {DEAL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="relative">
            <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="pl-8 pr-8 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none">
              {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <button onClick={fetchDeals} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-indigo-600 hover:border-indigo-400 bg-gray-50 dark:bg-gray-900 transition"><RefreshCw className="w-4 h-4" /></button>

          {/* View toggle */}
          <div className="ml-auto flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button onClick={() => setViewMode('table')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              <List className="w-3.5 h-3.5" />Table
            </button>
            <button onClick={() => setViewMode('kanban')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              <LayoutGrid className="w-3.5 h-3.5" />Kanban
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center py-20">
          <span className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : viewMode === 'kanban' ? (
        <KanbanBoard deals={filtered} onStageChange={handleStageChange} onViewDeal={setDrawerDeal} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
              <DollarSign className="w-12 h-12 mb-3 opacity-30" /><p className="text-base font-medium">No deals found</p>
              <p className="text-sm mt-1">Try adjusting your filters or create a new deal</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Deal / Account</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Value</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stage</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Probability</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Forecast</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden xl:table-cell">Last Activity</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden xl:table-cell">Last Interacted</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filtered.map(deal => {
                    const lastActs = activities[deal.id] ?? [];
                    const lastAct = lastActs[0];
                    const forecast = (deal.value * deal.probability) / 100;

                    return (
                      <tr key={deal.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors group">
                        {/* Deal / Account */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {deal.company.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 dark:text-white truncate max-w-[160px]">{deal.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[160px]">{deal.company}</p>
                            </div>
                          </div>
                        </td>

                        {/* Value */}
                        <td className="px-4 py-3.5 text-right hidden sm:table-cell">
                          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{fmtCurrency(deal.value)}</span>
                        </td>

                        {/* Stage — inline editable */}
                        <td className="px-4 py-3.5">
                          <select
                            value={deal.stage}
                            onChange={e => handleInlineStageChange(deal, e.target.value as DealStage)}
                            className="text-xs font-semibold bg-transparent border-0 focus:outline-none focus:ring-0 cursor-pointer p-0"
                            onClick={e => e.stopPropagation()}
                          >
                            {DEAL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>

                        {/* Probability */}
                        <td className="px-4 py-3.5 text-right hidden md:table-cell">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${deal.probability}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 w-8 text-right">{deal.probability}%</span>
                          </div>
                        </td>

                        {/* Forecast */}
                        <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{fmtCurrency(forecast)}</span>
                        </td>

                        {/* Last Activity */}
                        <td className="px-4 py-3.5 hidden xl:table-cell">
                          <span className="text-xs text-gray-500 dark:text-gray-400">{lastAct?.type ?? '—'}</span>
                        </td>

                        {/* Last Interacted */}
                        <td className="px-4 py-3.5 hidden xl:table-cell">
                          <span className="text-xs text-gray-500 dark:text-gray-400">{lastAct ? fmtDaysAgo(lastAct.created_at) : '—'}</span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                            <ActionBtn onClick={() => setDrawerDeal(deal)} title="View" className="hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"><Eye className="w-3.5 h-3.5" /></ActionBtn>
                            <ActionBtn onClick={() => setDrawerDeal(deal)} title="Edit" className="hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"><Edit2 className="w-3.5 h-3.5" /></ActionBtn>
                            {isManager && (
                              <ActionBtn onClick={() => handleDeleteDeal(deal.id)} title="Delete" className="hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40" disabled={deletingId === deal.id}>
                                {deletingId === deal.id ? <span className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                              </ActionBtn>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 flex items-center justify-between">
                <p className="text-xs text-gray-400">Showing <span className="font-semibold text-gray-600 dark:text-gray-300">{filtered.length}</span> of <span className="font-semibold text-gray-600 dark:text-gray-300">{deals.length}</span> deals</p>
                <p className="text-xs text-gray-400 hidden sm:block">Total value: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{fmtCurrency(filtered.reduce((s, d) => s + (d.value ?? 0), 0))}</span></p>
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <CreateDealModal
          onClose={() => setShowModal(false)}
          onSave={handleCreateDeal}
          currentUserName={userName}
          isManager={isManager}
        />
      )}

      {drawerDeal && (
        <DealDetailDrawer
          deal={drawerDeal}
          onClose={() => setDrawerDeal(null)}
          currentUserName={userName}
          isManager={isManager}
          onDealUpdated={handleDealUpdated}
        />
      )}
    </div>
  );
}

function ActionBtn({ children, onClick, title, className, disabled }: { children: React.ReactNode; onClick: () => void; title: string; className?: string; disabled?: boolean }) {
  return <button onClick={onClick} title={title} disabled={disabled} className={`p-1.5 rounded-lg text-gray-400 transition-colors ${className} disabled:opacity-50`}>{children}</button>;
}
