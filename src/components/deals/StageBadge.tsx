import type { DealStage } from '../../lib/supabase';

const STAGE_STYLES: Record<DealStage, string> = {
  Prospecting: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  Qualification: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  Proposal: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  Negotiation: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  'Closed Won': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  'Closed Lost': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};

export function StageBadge({ stage }: { stage: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${STAGE_STYLES[stage as DealStage] ?? 'bg-gray-100 text-gray-600'}`}>
      {stage}
    </span>
  );
}
