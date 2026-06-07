import type { Page } from '../types';
import { Code2 } from 'lucide-react';

interface PlaceholderPageProps {
  page: Page;
}

export function PlaceholderPage({ page }: PlaceholderPageProps) {
  return (
    <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center text-gray-400 dark:text-gray-500">
      <Code2 className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
      <p className="text-base font-medium text-gray-600 dark:text-gray-400">
        {page.charAt(0).toUpperCase() + page.slice(1)} Workspace Section
      </p>
      <p className="text-xs mt-1 text-gray-400 dark:text-gray-500 max-w-md mx-auto">
        This dashboard interface sector represents the targeted operational subpage module framework placeholder. Inject code tables or lists here.
      </p>
    </div>
  );
}
