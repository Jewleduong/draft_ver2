import { useState, useRef } from 'react';
import { DollarSign } from 'lucide-react';
import type { Deal, DealStage } from '../../lib/supabase';
import { DEAL_STAGES } from '../../lib/supabase';

const COLUMN_COLORS: Record<DealStage, string> = {
  Prospecting: 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
  Qualification: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50',
  Proposal: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50',
  Negotiation: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50',
  'Closed Won': 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50',
  'Closed Lost': 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50',
};

const COLUMN_HEADER_COLORS: Record<DealStage, string> = {
  Prospecting: 'text-gray-600 dark:text-gray-300',
  Qualification: 'text-blue-700 dark:text-blue-400',
  Proposal: 'text-amber-700 dark:text-amber-400',
  Negotiation: 'text-orange-700 dark:text-orange-400',
  'Closed Won': 'text-emerald-700 dark:text-emerald-400',
  'Closed Lost': 'text-red-600 dark:text-red-400',
};

function fmtCurrency(n: number) {
  if (!n) return '$0';
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return '$' + (n / 1000).toFixed(0) + 'k';
  return '$' + n.toLocaleString('en-US');
}

interface KanbanBoardProps {
  deals: Deal[];
  onStageChange: (dealId: string, newStage: DealStage) => Promise<void>;
  onViewDeal: (deal: Deal) => void;
}

export function KanbanBoard({ deals, onStageChange, onViewDeal }: KanbanBoardProps) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<DealStage | null>(null);
  const dragDeal = useRef<Deal | null>(null);

  const dealsByStage = DEAL_STAGES.reduce((acc, stage) => {
    acc[stage] = deals.filter(d => d.stage === stage);
    return acc;
  }, {} as Record<DealStage, Deal[]>);

  function handleDragStart(e: React.DragEvent, deal: Deal) {
    setDragId(deal.id);
    dragDeal.current = deal;
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent, stage: DealStage) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(stage);
  }

  function handleDrop(e: React.DragEvent, stage: DealStage) {
    e.preventDefault();
    setDragOver(null);
    setDragId(null);
    if (dragDeal.current && dragDeal.current.stage !== stage) {
      onStageChange(dragDeal.current.id, stage);
    }
    dragDeal.current = null;
  }

  function handleDragEnd() {
    setDragId(null);
    setDragOver(null);
    dragDeal.current = null;
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
        {DEAL_STAGES.map(stage => {
          const stageDeals = dealsByStage[stage] ?? [];
          const total = stageDeals.reduce((s, d) => s + (d.value ?? 0), 0);
          const isDragTarget = dragOver === stage;

          return (
            <div
              key={stage}
              className={`w-60 flex flex-col rounded-xl border transition-all duration-150 ${COLUMN_COLORS[stage]} ${isDragTarget ? 'ring-2 ring-indigo-400 ring-offset-1 scale-[1.01]' : ''}`}
              onDragOver={e => handleDragOver(e, stage)}
              onDrop={e => handleDrop(e, stage)}
              onDragLeave={() => setDragOver(null)}
            >
              {/* Column Header */}
              <div className="px-3 pt-3 pb-2 flex items-center justify-between">
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${COLUMN_HEADER_COLORS[stage]}`}>{stage}</span>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{fmtCurrency(total)}</div>
                </div>
                <span className="w-6 h-6 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 shadow-sm">
                  {stageDeals.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 px-2 pb-2 space-y-2 min-h-[100px]">
                {stageDeals.map(deal => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={e => handleDragStart(e, deal)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onViewDeal(deal)}
                    className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3 cursor-pointer hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-150 select-none ${dragId === deal.id ? 'opacity-40 scale-95' : ''}`}
                  >
                    <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-tight mb-1">{deal.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2.5">{deal.company}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                        <DollarSign className="w-3 h-3" />
                        <span className="text-xs font-bold">{fmtCurrency(deal.value)}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">{deal.probability}%</span>
                    </div>
                    {deal.owner_name && (
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{deal.owner_name}</p>
                      </div>
                    )}
                  </div>
                ))}

                {stageDeals.length === 0 && (
                  <div className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${isDragTarget ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30' : 'border-gray-200 dark:border-gray-700'}`}>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Drop here</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
