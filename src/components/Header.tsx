import { Menu, Moon, Sun, Bell } from 'lucide-react';
import type { Role, UserData } from '../types';

interface HeaderProps {
  user: UserData;
  role: Role;
  isDarkMode: boolean;
  onToggleSidebar: () => void;
  onRoleChange: (role: Role) => void;
  onToggleTheme: () => void;
}

export function Header({
  user,
  role,
  isDarkMode,
  onToggleSidebar,
  onRoleChange,
  onToggleTheme,
}: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex justify-between items-center flex-shrink-0 dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200">
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 md:hidden dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
          <span>Account Simulation:</span>
          <select
            value={role}
            onChange={(e) => onRoleChange(e.target.value as Role)}
            className="bg-transparent border-none font-bold text-indigo-600 focus:outline-none dark:text-indigo-400 cursor-pointer"
          >
            <option value="manager">Sales Manager (Admin)</option>
            <option value="member">Sales Member (Rep)</option>
          </select>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleTheme}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Toggle Theme Modes"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 relative"
          title="Notifications Hub"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
        </button>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{user.name}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{user.roleTitle}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            {user.initials}
          </div>
        </div>
      </div>
    </header>
  );
}
