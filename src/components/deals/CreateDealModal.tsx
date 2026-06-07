import { useState } from 'react';
import { X, Briefcase, Building2, User, Mail, Phone, DollarSign, Calendar, Tag, Percent, CircleUser as UserCircle } from 'lucide-react';
import type { Deal, DealStage } from '../../lib/supabase';
import { DEAL_STAGES, STAGE_PROBABILITIES } from '../../lib/supabase';

const OWNERS = ['Anna Nguyen', 'Duy Nguyen', 'Linh Tran', 'Nam Le', 'Hoa Pham'];

interface CreateDealModalProps {
  onClose: () => void;
  onSave: (data: Omit<Deal, 'id' | 'created_at' | 'updated_at' | 'lead_id'>) => Promise<void>;
  currentUserName: string;
  isManager: boolean;
}

export function CreateDealModal({ onClose, onSave, currentUserName, isManager }: CreateDealModalProps) {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: '',
    company: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    value: '',
    stage: 'Qualification' as DealStage,
    probability: String(STAGE_PROBABILITIES['Qualification']),
    expected_close_date: '',
    owner_name: currentUserName,
    notes: '',
  });

  function handleStageChange(stage: DealStage) {
    setForm(f => ({ ...f, stage, probability: String(STAGE_PROBABILITIES[stage]) }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Deal name is required';
    if (!form.company.trim()) e.company = 'Company is required';
    if (!form.value || isNaN(parseFloat(form.value))) e.value = 'Valid value required';
    if (!form.expected_close_date) e.expected_close_date = 'Close date required';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      await onSave({
        name: form.name.trim(),
        company: form.company.trim(),
        contact_person: form.contact_person.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim(),
        value: parseFloat(form.value),
        stage: form.stage,
        probability: parseFloat(form.probability) || STAGE_PROBABILITIES[form.stage],
        expected_close_date: form.expected_close_date || null,
        owner_name: form.owner_name,
        notes: form.notes.trim(),
      });
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create New Deal</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Add a deal to the commercial pipeline</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Deal Name <span className="text-red-500">*</span></label>
                <div className="relative"><Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: '' })); }}
                    placeholder="e.g. TechCorp — Enterprise License"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${errors.name ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`} />
                </div>
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Company <span className="text-red-500">*</span></label>
                <div className="relative"><Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={form.company} onChange={e => { setForm(f => ({ ...f, company: e.target.value })); setErrors(er => ({ ...er, company: '' })); }}
                    placeholder="Company name"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${errors.company ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`} />
                </div>
                {errors.company && <p className="text-xs text-red-500 mt-1">{errors.company}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Contact Person</label>
                <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} placeholder="Full name"
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Contact Email</label>
                <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} placeholder="email@company.com"
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Deal Value <span className="text-red-500">*</span></label>
                <div className="relative"><DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="number" value={form.value} onChange={e => { setForm(f => ({ ...f, value: e.target.value })); setErrors(er => ({ ...er, value: '' })); }} min="0" placeholder="0"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${errors.value ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`} />
                </div>
                {errors.value && <p className="text-xs text-red-500 mt-1">{errors.value}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Close Date <span className="text-red-500">*</span></label>
                <div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="date" value={form.expected_close_date} onChange={e => { setForm(f => ({ ...f, expected_close_date: e.target.value })); setErrors(er => ({ ...er, expected_close_date: '' })); }}
                    className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${errors.expected_close_date ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`} />
                </div>
                {errors.expected_close_date && <p className="text-xs text-red-500 mt-1">{errors.expected_close_date}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Pipeline Stage</label>
                <div className="relative"><Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select value={form.stage} onChange={e => handleStageChange(e.target.value as DealStage)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none">
                    {DEAL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Probability %</label>
                <div className="relative"><Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="number" value={form.probability} onChange={e => setForm(f => ({ ...f, probability: e.target.value }))} min="0" max="100"
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
                </div>
              </div>

              {isManager && (
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Assign Owner</label>
                  <div className="relative"><UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select value={form.owner_name} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))}
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none">
                      {OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Phone</label>
                <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="tel" value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} placeholder="+84 ..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-50/50 dark:bg-gray-900/50">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-60 flex items-center gap-2">
              {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
