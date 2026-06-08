import { useState, useEffect, useCallback } from 'react';
import { Plus, Download, Search, Filter, Import as SortAsc, Users, TrendingUp, CheckCircle, XCircle, Eye, CreditCard as Edit2, ArrowRightCircle, Trash2, Phone, Mail, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Lead, LeadStatus, LeadSource } from '../../lib/supabase';
import { CreateLeadModal } from './CreateLeadModal';
import { EditLeadModal } from './EditLeadModal';
import { ConvertLeadModal } from './ConvertLeadModal';
import { LeadDetailDrawer, StatusBadge } from './LeadDetailDrawer';

const STATUS_OPTIONS: Array<'All' | LeadStatus> = ['All', 'New', 'Contacted', 'Qualified', 'Converted', 'Rejected'];
const SOURCE_OPTIONS: Array<'All' | LeadSource> = ['All', 'Website', 'LinkedIn', 'Referral', 'Event', 'Cold Outreach'];
const SORT_OPTIONS = [
  { value: 'updated_desc', label: 'Recently Updated' },
  { value: 'updated_asc', label: 'Oldest Updated' },
  { value: 'value_desc', label: 'Highest Value' },
  { value: 'value_asc', label: 'Lowest Value' },
];
const OWNERS = ['All', 'Anna Nguyen', 'Duy Nguyen', 'Linh Tran', 'Nam Le', 'Hoa Pham'];

function formatCurrency(n: number) {
  if (!n) return '$0';
  if (n >= 1000) return '$' + (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return '$' + n.toLocaleString('en-US');
}

function formatDaysAgo(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

interface LeadsPageProps {
  role: 'manager' | 'member';
  userName: string;
  onToast: (msg: string) => void;
}

type Modal = 'create' | 'edit' | 'convert' | null;

export function LeadsPage({ role, userName, onToast }: LeadsPageProps) {
  const isManager = role === 'manager';
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<Record<string, { type: string; created_at: string }[]>>({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | LeadStatus>('All');
  const [sourceFilter, setSourceFilter] = useState<'All' | LeadSource>('All');
  const [ownerFilter, setOwnerFilter] = useState('All');
  const [sort, setSort] = useState('updated_desc');

  const [modal, setModal] = useState<Modal>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [drawerLead, setDrawerLead] = useState<Lead | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('leads').select('*');
    if (!isManager) query = query.eq('owner_name', userName);
    const { data, error } = await query;
    if (error) { onToast('Failed to load leads'); setLoading(false); return; }
    const leadsData = (data as Lead[]) ?? [];
    setLeads(leadsData);
    if (leadsData.length > 0) {
      const ids = leadsData.map(l => l.id);
      const { data: actData } = await supabase
        .from('lead_activities')
        .select('lead_id, type, created_at')
        .in('lead_id', ids)
        .order('created_at', { ascending: false });
      if (actData) {
        const grouped: Record<string, { type: string; created_at: string }[]> = {};
        for (const act of actData) {
          if (!grouped[act.lead_id]) grouped[act.lead_id] = [];
          grouped[act.lead_id].push({ type: act.type, created_at: act.created_at });
        }
        setActivities(grouped);
      }
    }
    setLoading(false);
  }, [isManager, userName, onToast]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const total = leads.length;
  const newLeads = leads.filter(l => l.status === 'New').length;
  const converted = leads.filter(l => l.status === 'Converted').length;
  const convRate = total > 0 ? ((converted / total) * 100).toFixed(1) + '%' : '0%';

  const filtered = leads
    .filter(l => {
      if (search) {
        const q = search.toLowerCase();
        if (!l.name.toLowerCase().includes(q) && !l.company.toLowerCase().includes(q) && !l.email.toLowerCase().includes(q)) return false;
      }
      if (statusFilter !== 'All' && l.status !== statusFilter) return false;
      if (sourceFilter !== 'All' && l.source !== sourceFilter) return false;
      if (ownerFilter !== 'All' && l.owner_name !== ownerFilter) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sort) {
        case 'updated_asc': return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        case 'value_desc': return (b.estimated_value ?? 0) - (a.estimated_value ?? 0);
        case 'value_asc': return (a.estimated_value ?? 0) - (b.estimated_value ?? 0);
        default: return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

  async function handleCreateLead(data: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) {
    const { error } = await supabase.from('leads').insert(data);
    if (error) { onToast('Failed to create lead'); return; }
    setModal(null);
    onToast('Lead created successfully');
    await fetchLeads();
  }

  async function handleEditLead(id: string, data: Partial<Lead>) {
    const { error } = await supabase.from('leads').update(data).eq('id', id);
    if (error) { onToast('Failed to update lead'); return; }
    setModal(null);
    setSelectedLead(null);
    onToast('Lead updated successfully');
    if (drawerLead?.id === id) setDrawerLead(prev => prev ? { ...prev, ...data } : null);
    await fetchLeads();
  }

  async function handleConvertLead(dealData: { name: string; value: number; stage: string; expected_close_date: string }) {
    if (!selectedLead) return;
    const { error: dealErr } = await supabase.from('deals').insert({
      lead_id: selectedLead.id,
      name: dealData.name,
      value: dealData.value,
      stage: dealData.stage,
      expected_close_date: dealData.expected_close_date,
      company: selectedLead.company,
      contact_person: selectedLead.name,
      contact_email: selectedLead.email,
      contact_phone: selectedLead.phone,
      owner_name: selectedLead.owner_name,
      probability: 25,
    });
    if (dealErr) { onToast('Failed to create deal'); return; }
    await supabase.from('leads').update({ status: 'Converted' }).eq('id', selectedLead.id);
    await supabase.from('lead_activities').insert({
      lead_id: selectedLead.id,
      type: 'System Update',
      note: `Lead converted to deal: "${dealData.name}" (${dealData.stage}) — $${dealData.value.toLocaleString()}`,
      logged_by: userName,
    });
    setModal(null);
    setSelectedLead(null);
    onToast(`Lead converted to deal: ${dealData.name}`);
    await fetchLeads();
  }

  async function handleRejectLead(lead: Lead) {
    if (lead.status === 'Converted' || lead.status === 'Rejected') return;
    const { error } = await supabase.from('leads').update({ status: 'Rejected' }).eq('id', lead.id);
    if (error) { onToast('Failed to reject lead'); return; }
    await supabase.from('lead_activities').insert({
      lead_id: lead.id,
      type: 'System Update',
      note: 'Lead marked as Rejected',
      logged_by: userName,
    });
    onToast('Lead rejected');
    await fetchLeads();
  }

  async function handleDeleteLead(id: string) {
    if (!confirm('Delete this lead permanently? This cannot be undone.')) return;
    setDeletingId(id);
    const { error } = await supabase.from('leads').delete().eq('id', id);
    setDeletingId(null);
    if (error) { onToast('Failed to delete lead'); return; }
    onToast('Lead deleted');
    if (drawerLead?.id === id) setDrawerLead(null);
    await fetchLeads();
  }

  function exportLeads() {
    const csv = [
      ['Name', 'Company', 'Email', 'Phone', 'Source', 'Status', 'Value', 'Owner', 'Created'].join(','),
      ...filtered.map(l => [l.name, l.company, l.email, l.phone, l.source, l.status, l.estimated_value, l.owner_name, l.created_at].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    onToast('Leads exported to CSV');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Lead Directory</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage incoming prospects, qualify opportunities, and track engagement history.</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {isManager && (
            <button onClick={exportLeads} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm">
              <Download className="w-4 h-4" />Export
            </button>
          )}
          <button onClick={() => setModal('create')} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition">
            <Plus className="w-4 h-4" />Create Lead
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Leads', value: total, icon: <Users className="w-5 h-5" />, bg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400', sub: 'All pipeline leads' },
          { title: 'New Leads', value: newLeads, icon: <TrendingUp className="w-5 h-5" />, bg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400', sub: 'Awaiting contact', color: 'text-blue-600 dark:text-blue-400' },
          { title: 'Converted', value: converted, icon: <CheckCircle className="w-5 h-5" />, bg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400', sub: 'Deals created', color: 'text-emerald-600 dark:text-emerald-400' },
          { title: 'Conversion Rate', value: convRate, icon: <ArrowRightCircle className="w-5 h-5" />, bg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400', sub: 'Converted vs total', color: 'text-purple-600 dark:text-purple-400' },
        ].map(card => (
          <div key={card.title} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{card.title}</p>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.bg}`}>{card.icon}</div>
            </div>
            <p className={`text-3xl font-extrabold ${card.color ?? 'text-gray-900 dark:text-white'}`}>{card.value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as 'All' | LeadStatus)}
              className="pl-8 pr-8 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none">
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>)}
            </select>
          </div>
          <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value as 'All' | LeadSource)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none">
            {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Sources' : s}</option>)}
          </select>
          {isManager && (
            <select value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none">
              {OWNERS.map(o => <option key={o} value={o}>{o === 'All' ? 'All Owners' : o}</option>)}
            </select>
          )}
          <div className="relative">
            <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="pl-8 pr-8 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none">
              {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <button onClick={fetchLeads} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-indigo-600 hover:border-indigo-400 bg-gray-50 dark:bg-gray-900 transition" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
            <Users className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-base font-medium">No leads found</p>
            <p className="text-sm mt-1">Try adjusting your filters or create a new lead</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lead</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Source</th>
                  {isManager && <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Owner</th>}
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Value</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden xl:table-cell">Last Activity</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden xl:table-cell">Contacted</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map(lead => {
                  const lastActs = activities[lead.id] ?? [];
                  const lastAct = lastActs[0];
                  const isActive = lead.status !== 'Converted' && lead.status !== 'Rejected';
                  return (
                    <tr key={lead.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors group">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {lead.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate max-w-[140px]">{lead.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[140px]">{lead.company}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <p className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1.5"><Mail className="w-3 h-3 text-gray-400" /><span className="truncate max-w-[160px]">{lead.email}</span></p>
                        {lead.phone && <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5"><Phone className="w-3 h-3" />{lead.phone}</p>}
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell"><span className="text-xs text-gray-600 dark:text-gray-400">{lead.source}</span></td>
                      {isManager && <td className="px-4 py-3.5 hidden lg:table-cell"><span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[100px] block">{lead.owner_name}</span></td>}
                      <td className="px-4 py-3.5 text-right hidden sm:table-cell"><span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(lead.estimated_value)}</span></td>
                      <td className="px-4 py-3.5"><StatusBadge status={lead.status} /></td>
                      <td className="px-4 py-3.5 hidden xl:table-cell"><span className="text-xs text-gray-500 dark:text-gray-400">{lastAct?.type ?? '—'}</span></td>
                      <td className="px-4 py-3.5 hidden xl:table-cell"><span className="text-xs text-gray-500 dark:text-gray-400">{lastAct ? formatDaysAgo(lastAct.created_at) : '—'}</span></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                          <ActionBtn onClick={() => setDrawerLead(lead)} title="View Details" className="hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"><Eye className="w-3.5 h-3.5" /></ActionBtn>
                          <ActionBtn onClick={() => { setSelectedLead(lead); setModal('edit'); }} title="Edit Lead" className="hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"><Edit2 className="w-3.5 h-3.5" /></ActionBtn>
                          {isActive && <ActionBtn onClick={() => { setSelectedLead(lead); setModal('convert'); }} title="Convert to Deal" className="hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"><ArrowRightCircle className="w-3.5 h-3.5" /></ActionBtn>}
                          {isActive && <ActionBtn onClick={() => handleRejectLead(lead)} title="Reject Lead" className="hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"><XCircle className="w-3.5 h-3.5" /></ActionBtn>}
                          {isManager && <ActionBtn onClick={() => handleDeleteLead(lead.id)} title="Delete Lead" className="hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40" disabled={deletingId === lead.id}>{deletingId === lead.id ? <span className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}</ActionBtn>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
              <p className="text-xs text-gray-400">Showing <span className="font-semibold text-gray-600 dark:text-gray-300">{filtered.length}</span> of <span className="font-semibold text-gray-600 dark:text-gray-300">{total}</span> leads</p>
            </div>
          </div>
        )}
      </div>

      {modal === 'create' && <CreateLeadModal onClose={() => setModal(null)} onSave={handleCreateLead} currentUserName={userName} isManager={isManager} />}
      {modal === 'edit' && selectedLead && <EditLeadModal lead={selectedLead} onClose={() => { setModal(null); setSelectedLead(null); }} onSave={handleEditLead} isManager={isManager} />}
      {modal === 'convert' && selectedLead && <ConvertLeadModal lead={selectedLead} onClose={() => { setModal(null); setSelectedLead(null); }} onConvert={handleConvertLead} />}
      {drawerLead && <LeadDetailDrawer lead={drawerLead} onClose={() => setDrawerLead(null)} currentUserName={userName} onLeadUpdated={fetchLeads} />}
    </div>
  );
}

function ActionBtn({ children, onClick, title, className, disabled }: { children: React.ReactNode; onClick: () => void; title: string; className?: string; disabled?: boolean }) {
  return <button onClick={onClick} title={title} disabled={disabled} className={`p-1.5 rounded-lg text-gray-400 transition-colors ${className} disabled:opacity-50`}>{children}</button>;
}
