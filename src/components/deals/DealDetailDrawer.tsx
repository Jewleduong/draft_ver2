import { useState, useEffect, useCallback } from 'react';
import { X, Phone, Mail, Building2, DollarSign, CircleUser as UserCircle, Calendar, PhoneCall, Send, Users, Settings, Plus, FileText, Clock, ChevronRight, TrendingUp, Percent } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Deal, DealActivity, ActivityType, DealStage } from '../../lib/supabase';
import { DEAL_STAGES, STAGE_PROBABILITIES } from '../../lib/supabase';
import { StageBadge } from './StageBadge';

const ACTIVITY_ICONS: Record<ActivityType, React.ReactNode> = {
  Call: <PhoneCall className="w-3.5 h-3.5" />,
  Email: <Send className="w-3.5 h-3.5" />,
  Meeting: <Users className="w-3.5 h-3.5" />,
  WhatsApp: <Send className="w-3.5 h-3.5" />,
  'System Update': <Settings className="w-3.5 h-3.5" />,
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  Call: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  Email: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  Meeting: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
  WhatsApp: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
  'System Update': 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
};

const LOG_TYPES: ActivityType[] = ['Call', 'Email', 'Meeting', 'System Update'];

function fmtRelTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtCurrency(n: number) {
  return '$' + Number(n).toLocaleString('en-US');
}

interface DealDetailDrawerProps {
  deal: Deal;
  onClose: () => void;
  currentUserName: string;
  isManager: boolean;
  onDealUpdated: (updated: Deal) => void;
}

export function DealDetailDrawer({ deal: initialDeal, onClose, currentUserName, onDealUpdated }: DealDetailDrawerProps) {
  const [deal, setDeal] = useState(initialDeal);
  const [activities, setActivities] = useState<DealActivity[]>([]);
  const [loadingActs, setLoadingActs] = useState(true);
  const [activityType, setActivityType] = useState<ActivityType>('Call');
  const [activityNote, setActivityNote] = useState('');
  const [savingAct, setSavingAct] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'notes'>('details');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const isActive = deal.stage !== 'Closed Won' && deal.stage !== 'Closed Lost';

  const fetchActivities = useCallback(async () => {
    setLoadingActs(true);
    const { data } = await supabase.from('deal_activities').select('*').eq('deal_id', deal.id).order('created_at', { ascending: false });
    if (data) setActivities(data as DealActivity[]);
    setLoadingActs(false);
  }, [deal.id]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  async function updateField(field: string, value: string | number) {
    const update: Partial<Deal> = { [field]: value };
    if (field === 'stage') {
      update.probability = STAGE_PROBABILITIES[value as DealStage];
    }
    const { error } = await supabase.from('deals').update(update).eq('id', deal.id);
    if (!error) {
      const updated = { ...deal, ...update };
      setDeal(updated);
      onDealUpdated(updated);
      if (field === 'stage') {
        await supabase.from('deal_activities').insert({ deal_id: deal.id, type: 'System Update', note: `Stage changed to ${value} (probability: ${update.probability}%)`, logged_by: currentUserName });
        await fetchActivities();
      }
    }
    setEditingField(null);
  }

  async function handleLogActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!activityNote.trim()) return;
    setSavingAct(true);
    await supabase.from('deal_activities').insert({ deal_id: deal.id, type: activityType, note: activityNote.trim(), logged_by: currentUserName });
    setActivityNote(''); await fetchActivities();
    setSavingAct(false);
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSavingNote(true);
    await supabase.from('deal_activities').insert({ deal_id: deal.id, type: 'System Update', note: noteText.trim(), logged_by: currentUserName });
    setNoteText(''); await fetchActivities();
    setSavingNote(false);
  }

  const forecastValue = (deal.value * deal.probability) / 100;
  const noteActivities = activities.filter(a => a.type === 'System Update');

  function startEdit(field: string, value: string) {
    setEditingField(field);
    setEditValue(value);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-[480px] bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col border-l border-gray-200 dark:border-gray-700 animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              {deal.company.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">{deal.name}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{deal.company}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors ml-2 flex-shrink-0"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0 px-6">
          {(['details', 'timeline', 'notes'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 mr-5 text-sm font-semibold border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* DETAILS TAB */}
          {activeTab === 'details' && (
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-2"><StageBadge stage={deal.stage} /></div>

              {/* Forecast Summary */}
              <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-4 border border-indigo-100 dark:border-indigo-900/50 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold uppercase tracking-wider mb-1">Deal Value</p>
                  <p className="text-lg font-extrabold text-indigo-700 dark:text-indigo-300">{fmtCurrency(deal.value)}</p>
                </div>
                <div className="text-center border-x border-indigo-200 dark:border-indigo-800">
                  <p className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold uppercase tracking-wider mb-1">Probability</p>
                  <p className="text-lg font-extrabold text-indigo-700 dark:text-indigo-300">{deal.probability}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold uppercase tracking-wider mb-1">Forecast</p>
                  <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{fmtCurrency(forecastValue)}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Customer Information</h3>
                <InfoRow icon={<Building2 className="w-4 h-4" />} label="Company" value={deal.company} />
                <InfoRow icon={<Users className="w-4 h-4" />} label="Contact" value={deal.contact_person || '—'} />
                <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={deal.contact_email || '—'} />
                <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={deal.contact_phone || '—'} />
              </div>

              {/* Deal Specs — editable */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Deal Specifications</h3>

                <EditableRow
                  icon={<DollarSign className="w-4 h-4" />} label="Value"
                  value={fmtCurrency(deal.value)} editing={editingField === 'value'}
                  onEdit={() => startEdit('value', String(deal.value))}
                  editInput={<input type="number" value={editValue} onChange={e => setEditValue(e.target.value)} className="w-32 px-2 py-1 text-sm rounded border border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" autoFocus />}
                  onSave={() => updateField('value', parseFloat(editValue))}
                  onCancel={() => setEditingField(null)}
                />

                <EditableRow
                  icon={<Calendar className="w-4 h-4" />} label="Close Date"
                  value={deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  editing={editingField === 'expected_close_date'}
                  onEdit={() => startEdit('expected_close_date', deal.expected_close_date ?? '')}
                  editInput={<input type="date" value={editValue} onChange={e => setEditValue(e.target.value)} className="w-40 px-2 py-1 text-sm rounded border border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" autoFocus />}
                  onSave={() => updateField('expected_close_date', editValue)}
                  onCancel={() => setEditingField(null)}
                />

                <EditableRow
                  icon={<TrendingUp className="w-4 h-4" />} label="Stage"
                  value={deal.stage}
                  editing={editingField === 'stage'}
                  onEdit={() => startEdit('stage', deal.stage)}
                  editInput={
                    <select value={editValue} onChange={e => setEditValue(e.target.value)} className="w-36 px-2 py-1 text-sm rounded border border-indigo-400 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white" autoFocus>
                      {DEAL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  }
                  onSave={() => updateField('stage', editValue)}
                  onCancel={() => setEditingField(null)}
                />

                <EditableRow
                  icon={<Percent className="w-4 h-4" />} label="Probability"
                  value={`${deal.probability}%`}
                  editing={editingField === 'probability'}
                  onEdit={() => startEdit('probability', String(deal.probability))}
                  editInput={<input type="number" value={editValue} onChange={e => setEditValue(e.target.value)} min="0" max="100" className="w-24 px-2 py-1 text-sm rounded border border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" autoFocus />}
                  onSave={() => updateField('probability', parseFloat(editValue))}
                  onCancel={() => setEditingField(null)}
                />

                <InfoRow icon={<UserCircle className="w-4 h-4" />} label="Owner" value={deal.owner_name} />
              </div>
            </div>
          )}

          {/* TIMELINE TAB */}
          {activeTab === 'timeline' && (
            <div className="p-6 space-y-6">
              {isActive && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />Log Activity</h3>
                  <form onSubmit={handleLogActivity} className="space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      {LOG_TYPES.filter(t => t !== 'System Update').map(t => (
                        <button key={t} type="button" onClick={() => setActivityType(t)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${activityType === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-400'}`}>
                          {ACTIVITY_ICONS[t]}{t}
                        </button>
                      ))}
                    </div>
                    <textarea value={activityNote} onChange={e => setActivityNote(e.target.value)} placeholder={`Notes for ${activityType}...`} rows={2}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none" />
                    <button type="submit" disabled={savingAct || !activityNote.trim()}
                      className="w-full py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
                      {savingAct ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : <><Plus className="w-4 h-4" />Save Activity</>}
                    </button>
                  </form>
                </div>
              )}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Activity Timeline</h3>
                {loadingActs ? (
                  <div className="flex items-center justify-center py-8"><span className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-8 text-gray-400"><Clock className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-sm">No activities yet</p></div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
                    <div className="space-y-4">
                      {activities.map(act => (
                        <div key={act.id} className="relative flex gap-3 pl-10">
                          <div className={`absolute left-2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center ${ACTIVITY_COLORS[act.type as ActivityType]}`}>
                            {ACTIVITY_ICONS[act.type as ActivityType]}
                          </div>
                          <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{act.type}</span>
                              <span className="text-[11px] text-gray-400">{fmtRelTime(act.created_at)}</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{act.note}</p>
                            <p className="text-[11px] text-gray-400 mt-1.5">By {act.logged_by}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NOTES TAB */}
          {activeTab === 'notes' && (
            <div className="p-6 space-y-5">
              <form onSubmit={handleAddNote} className="space-y-3">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Add Note</label>
                <div className="relative"><FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Write a note..." rows={3}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none" />
                </div>
                <button type="submit" disabled={savingNote || !noteText.trim()}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50 flex items-center gap-2">
                  {savingNote ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : <><Plus className="w-3.5 h-3.5" />Add Note</>}
                </button>
              </form>
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Notes History</h3>
                {loadingActs ? (
                  <div className="flex items-center justify-center py-8"><span className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>
                ) : noteActivities.length === 0 ? (
                  <div className="text-center py-8 text-gray-400"><FileText className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-sm">No notes yet</p></div>
                ) : (
                  <div className="space-y-3">
                    {noteActivities.map(n => (
                      <div key={n.id} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{n.note}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[11px] text-gray-400">By {n.logged_by}</span>
                          <ChevronRight className="w-2.5 h-2.5 text-gray-300" />
                          <span className="text-[11px] text-gray-400">{fmtRelTime(n.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
      <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">{icon}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400 w-20 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{value}</span>
    </div>
  );
}

function EditableRow({ icon, label, value, editing, onEdit, editInput, onSave, onCancel }: {
  icon: React.ReactNode; label: string; value: string; editing: boolean;
  onEdit: () => void; editInput: React.ReactNode; onSave: () => void; onCancel: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
      <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">{icon}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400 w-20 flex-shrink-0">{label}</span>
      {editing ? (
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          {editInput}
          <button onClick={onSave} className="px-2 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">Save</button>
          <button onClick={onCancel} className="px-2 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition">Cancel</button>
        </div>
      ) : (
        <button onClick={onEdit} className="flex-1 text-left text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group">
          {value}
          <span className="ml-2 text-[11px] text-gray-300 dark:text-gray-600 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">click to edit</span>
        </button>
      )}
    </div>
  );
}
