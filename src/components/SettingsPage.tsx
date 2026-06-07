import { useState } from 'react';

export function SettingsPage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [currency, setCurrency] = useState('USD');

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          System Configuration Settings
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage pipeline structure thresholds, API credentials telemetry configuration parameters, and account criteria preferences.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm max-w-3xl dark:bg-gray-800 dark:border-gray-700">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/40">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Profile Registry & Configuration Preferences</h3>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                Corporate Organization Platform Token
              </label>
              <input
                type="text"
                readOnly
                value="ORG-SALESTRACK-8921X-2026"
                className="w-full border border-gray-200 bg-gray-50 text-gray-400 rounded-lg px-3 py-2 text-sm outline-none dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 dark:text-gray-400">
                Default Valuation Currency Unit
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="USD">USD ($) United States Dollar</option>
                <option value="VND">VND (₫) Vietnam Dong</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <input
              type="checkbox"
              id="sett-noti-toggle"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="sett-noti-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable automated real-time priority slack warning notifications thresholds
            </label>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end dark:border-gray-700">
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition">
              Apply Configurations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
