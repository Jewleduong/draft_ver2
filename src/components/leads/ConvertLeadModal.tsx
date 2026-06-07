import { useState } from 'react';
import { X, DollarSign, Tag, Calendar, Briefcase } from 'lucide-react';
import type { Lead } from '../../lib/supabase';

const PIPELINE_STAGES = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won'];

interface ConvertLeadModalProps {
  lead: Lead;
  onClose: () => void;
  onConvert: (dealData: { name: string; value: number; stage: string; expected_close_date: string }) => Promise<void>;
}

export function ConvertLeadModal({ lead, onClose, onConvert }: ConvertLeadModalProps) {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: `${lead.company} — Deal`,
    value: String(lead.estimated_value ?? 0),
    stage: 'Qualification',
    expected_close_date: '',
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Deal name is required';
    if (!form.value || isNaN(parseFloat(form.value))) e.value = 'Valid deal value required';
    if (!form.expected_close_date) e.expected_close_date = 'Close date is required';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      await onConvert({ name: form.name.trim(), value: parseFloat(form.value), stage: form.stage, expected_close_date: form.expected_close_date });
    } finally { setSaving(false); }
      await onConvert({
        name: form.name.trim(),
        value: parseFloat(form.value),
        stage: form.stage,
        expected_close_date: form.expected_close_date,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div><h2 className="text-lg font-bold text-gray-900 dark:text-white">Convert to Deal</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Creating deal from: {lead.name}</p></div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Deal Name <span className="text-red-500">*</span></label>
              <div className="relative"><Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: '' })); }}
                  className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${errors.name ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`} />
              </div>
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Deal Value <span className="text-red-500">*</span></label>
                <div className="relative"><DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="number" value={form.value} onChange={e => { setForm(f => ({ ...f, value: e.target.value })); setErrors(er => ({ ...er, value: '' })); }} min="0"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${errors.value ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`} />
                </div>
                {errors.value && <p className="text-xs text-red-500 mt-1">{errors.value}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Pipeline Stage</label>
                <div className="relative"><Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Convert to Deal</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Creating deal from lead: {lead.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lead summary */}
        <div className="mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
              {lead.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">{lead.name}</p>
            <p className="text-xs text-emerald-700 dark:text-emerald-500">{lead.company}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Deal Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={form.name}
                  onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: '' })); }}
                  className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${errors.name ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
                />
              </div>
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Deal Value <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={form.value}
                    onChange={e => { setForm(f => ({ ...f, value: e.target.value })); setErrors(er => ({ ...er, value: '' })); }}
                    min="0"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${errors.value ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
                  />
                </div>
                {errors.value && <p className="text-xs text-red-500 mt-1">{errors.value}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Pipeline Stage</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={form.stage}
                    onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none"
                  >
                    {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Expected Close Date <span className="text-red-500">*</span></label>
              <div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="date" value={form.expected_close_date} onChange={e => { setForm(f => ({ ...f, expected_close_date: e.target.value })); setErrors(er => ({ ...er, expected_close_date: '' })); }}
                  className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${errors.expected_close_date ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`} />

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Expected Close Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={form.expected_close_date}
                  onChange={e => { setForm(f => ({ ...f, expected_close_date: e.target.value })); setErrors(er => ({ ...er, expected_close_date: '' })); }}
                  className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${errors.expected_close_date ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
                />
              </div>
              {errors.expected_close_date && <p className="text-xs text-red-500 mt-1">{errors.expected_close_date}</p>}
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 rounded-b-2xl">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition disabled:opacity-60 flex items-center gap-2">
              {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Converting...</> : 'Convert to Deal'}

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 rounded-b-2xl">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Converting...</>
              ) : 'Convert to Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
