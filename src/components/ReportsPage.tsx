import { Download, Info, Target, Activity, Phone, Mail, Users } from 'lucide-react';
import type { ReportMetrics, ActivityMetrics } from '../types';

interface ReportsPageProps {
  reports: ReportMetrics;
  activities: ActivityMetrics;
}

export function ReportsPage({ reports, activities }: ReportsPageProps) {
  const conversionPercentage = 78;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Performance Analytics Reports
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track conversions benchmarks, activity pipelines velocities, and target quotas metrics.
          </p>
        </div>
        <button className="w-fit px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition no-print flex items-center">
          <Download className="w-4 h-4 mr-1.5" />
          Export Analytics Sheet
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start space-x-3 dark:bg-indigo-950/30 dark:border-indigo-900/60 no-print">
        <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">
            Dynamic Hierarchy Scoping Enabled
          </p>
          <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-0.5">{reports.scopeDescription}</p>
        </div>
      </div>

      {/* Pipeline Metrics */}
      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center">
        <Target className="w-4 h-4 mr-2 text-indigo-500" />
        Pipeline Results Performance Metrics
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Leads Analyzed</p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">{reports.leads}</p>
          <span className="text-xs text-emerald-500 font-semibold flex items-center mt-1">+ 14.2% MoM pacing</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Deals In Pipeline</p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">{reports.deals}</p>
          <span className="text-xs text-indigo-500 font-semibold mt-1 block">Avg velocity: 18 days</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Closed Won Conversion</p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">{reports.conversion}</p>
          <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 dark:bg-gray-700 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${conversionPercentage}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pipeline Contract Value</p>
          <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">{reports.value}</p>
          <span className="text-xs text-gray-400 block mt-1">Target quota milestone: 88%</span>
        </div>
      </div>

      {/* Activity Metrics */}
      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center pt-2">
        <Activity className="w-4 h-4 mr-2 text-indigo-500" />
        Operation Activity Interaction Logs Counter
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between dark:bg-gray-800 dark:border-gray-700">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Outbound Call Volume</p>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{activities.calls}</p>
            <p className="text-[11px] text-gray-400 mt-1">Connected duration ratio: 64%</p>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Phone className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between dark:bg-gray-800 dark:border-gray-700">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Sequences Dispatched</p>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{activities.emails}</p>
            <p className="text-[11px] text-emerald-500 font-semibold mt-1">Avg open speed rate: 42.1%</p>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <Mail className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between dark:bg-gray-800 dark:border-gray-700">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Commercial Meetings Logged</p>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{activities.meetings}</p>
            <p className="text-[11px] text-gray-400 mt-1">Discovery to Demo pacing: 78%</p>
          </div>
          <div className="p-3.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
