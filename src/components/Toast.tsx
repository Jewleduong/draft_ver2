import { Info } from 'lucide-react';
import type { ToastState } from '../types';

interface ToastProps {
  toast: ToastState;
}

export function Toast({ toast }: ToastProps) {
  return (
    <div
      className={`fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-3 transition-transform duration-300 z-50 dark:bg-white dark:text-gray-900 no-print ${
        toast.visible ? 'translate-y-0' : 'translate-y-24'
      }`}
    >
      <Info className="w-5 h-5 text-indigo-400 dark:text-indigo-600" />
      <span className="text-sm font-medium">{toast.message}</span>
    </div>
  );
}
