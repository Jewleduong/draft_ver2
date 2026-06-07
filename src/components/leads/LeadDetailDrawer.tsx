import { useState, useEffect, useCallback } from 'react';
import { X, Phone, Mail, Building2, Globe, DollarSign, CircleUser as UserCircle, Calendar, PhoneCall, Send, Users, MessageCircle, Settings, Plus, FileText, Clock, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Lead, LeadActivity, ActivityType } from '../../lib/supabase';

const ACTIVITY_TYPES: ActivityType[] = ['Call', 'Email', 'Meeting', 'WhatsApp', 'System Update'];

const ACTIVITY_ICONS: Record<ActivityType, React.ReactNode> = {
  Call: <PhoneCall className="w-3.5 h-3.5" />,
  Email: <Send className="w-3.5 h-3.5" />,
  Meeting: <Users className="w-3.5 h-3.5" />,
  WhatsApp: <MessageCircle className="w-3.5 h-3.5" />,
  'System Update': <Settings className="w-3.5 h-3.5" />,
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  Call: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  Email: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  Meeting: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
  WhatsApp: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
  'System Update': 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
};

function formatRelativeTime(dateStr: string) {
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

function formatCurrency(n: number) {
  return '$' + Number(n).toLocaleString('en-US');
}

interface LeadDetailDrawerProps {
  lead: Lead;
  onClose: () => void;
  currentUserName: string;
  onLeadUpdated: () => void;
}

export function LeadDetailDrawer({ lead, onClose, currentUserName, onLeadUpdated }: LeadDetailDrawerProps) {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('Call');
  const [activityNote, setActivityNote] = useState('');
  const [savingActivity, setSavingActivity] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'timeline' | 'notes'>('profile');

  const isActive = lead.status !== 'Converted' && lead.status !== 'Rejected';

  const fetchActivities = useCallback(async () => {
    setLoadingActivities(true);
    const { data, error } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false });
    if (!error && data) setActivities(data as LeadActivity[]);
    setLoadingActivities(false);
  }, [lead.id]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSavingNote(true);
    const { error: actErr } = await supabase.from('lead_activities').insert({
      lead_id: lead.id,
      type: 'System Update',
      note: newNote.trim(),
      logged_by: currentUserName,
    });
    if (!actErr) {
      setNewNote('');
      await fetchActivities();
    }
    setSavingNote(false);
  }

  async function handleLogActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!activityNote.trim()) return;
    setSavingActivity(true);
    const { error } = await supabase.from('lead_activities').insert({
      lead_id: lead.id,
      type: activityType,
      note: activityNote.trim(),
      logged_by: currentUserName,
    });
    if (!error) {
      setActivityNote('');
      await fetchActivities();
      onLeadUpdated();
    }
    setSavingActivity(false);
  }

  const noteActivities = activities.filter(a => a.type === 'System Update');
  const timelineActivities = activities;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-[480px] bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col border-l border-gray-200 dark:border-gray-700 animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              {lead.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">{lead.name}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{lead.company}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors ml-2 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0 px-6">
          {(['profile', 'timeline', 'notes'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 mr-5 text-sm font-semibold border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="p-6 space-y-6">
              {/* Status badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={lead.status} />
                <SourceBadge source={lead.source} />
              </div>

              {/* Contact info */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Information</h3>
                <div className="space-y-2">
                  <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={lead.email} />
                  <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={lead.phone || '—'} />
                  <InfoRow icon={<Building2 className="w-4 h-4" />} label="Company" value={lead.company} />
                  <InfoRow icon={<Globe className="w-4 h-4" />} label="Source" value={lead.source} />
                </div>
              </div>

              {/* Deal info */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Opportunity Details</h3>
                <div className="space-y-2">
                  <InfoRow icon={<DollarSign className="w-4 h-4" />} label="Est. Value" value={formatCurrency(lead.estimated_value)} highlight />
                  <InfoRow icon={<UserCircle className="w-4 h-4" />} label="Owner" value={lead.owner_name} />
                  <InfoRow icon={<Calendar className="w-4 h-4" />} label="Created" value={new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} />
                  <InfoRow icon={<Clock className="w-4 h-4" />} label="Last Updated" value={formatRelativeTime(lead.updated_at)} />
                </div>
              </div>

              {/* Notes */}
              {lead.notes && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lead Notes</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{lead.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TIMELINE TAB */}
          {activeTab === 'timeline' && (
            <div className="p-6 space-y-6">
              {/* Activity Logger */}
              {isActive && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    Log Activity
                  </h3>
                  <form onSubmit={handleLogActivity} className="space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      {ACTIVITY_TYPES.filter(t => t !== 'System Update').map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setActivityType(t)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            activityType === t
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-400'
                          }`}
                        >
                          {ACTIVITY_ICONS[t]}
                          {t}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={activityNote}
                      onChange={e => setActivityNote(e.target.value)}
                      placeholder={`Add notes for this ${activityType}...`}
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
                    />
                    <button
                      type="submit"
                      disabled={savingActivity || !activityNote.trim()}
                      className="w-full py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {savingActivity ? (
                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
                      ) : (
                        <><Plus className="w-4 h-4" />Save Activity</>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Activity Timeline</h3>
                {loadingActivities ? (
                  <div className="flex items-center justify-center py-8">
                    <span className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  </div>
                ) : timelineActivities.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No activities logged yet</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
                    <div className="space-y-4">
                      {timelineActivities.map((activity) => (
                        <div key={activity.id} className="relative flex gap-3 pl-10">
                          <div className={`absolute left-2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${ACTIVITY_COLORS[activity.type as ActivityType]}`}>
                            {ACTIVITY_ICONS[activity.type as ActivityType]}
                          </div>
                          <div className="flex-1 min-w-0 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{activity.type}</span>
                              <span className="text-[11px] text-gray-400 dark:text-gray-500">{formatRelativeTime(activity.created_at)}</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{activity.note}</p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">By {activity.logged_by}</p>
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
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Add Note
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Write a note about this lead..."
                    rows={3}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingNote || !newNote.trim()}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {savingNote ? (
                    <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
                  ) : (
                    <><Plus className="w-3.5 h-3.5" />Add Note</>
                  )}
                </button>
              </form>

              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Note History</h3>
                {loadingActivities ? (
                  <div className="flex items-center justify-center py-8">
                    <span className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  </div>
                ) : noteActivities.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No notes added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {noteActivities.map(n => (
                      <div key={n.id} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{n.note}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[11px] text-gray-400 dark:text-gray-500">By {n.logged_by}</span>
                          <ChevronRight className="w-2.5 h-2.5 text-gray-300 dark:text-gray-600" />
                          <span className="text-[11px] text-gray-400 dark:text-gray-500">{formatRelativeTime(n.created_at)}</span>
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

function InfoRow({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
      <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">{icon}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400 w-20 flex-shrink-0">{label}</span>
      <span className={`text-sm font-medium truncate ${highlight ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-gray-800 dark:text-gray-200'}`}>
        {value}
      </span>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    New: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    Contacted: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    Qualified: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
    Converted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    Rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

export function SourceBadge({ source }: { source: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
      {source}
    </span>
  );
}
