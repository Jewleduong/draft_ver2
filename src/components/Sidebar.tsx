import {
  LayoutDashboard,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  ShieldCheck,
  TrendingUp,
  X,
} from 'lucide-react';
import type { Page } from '../types';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'leads', label: 'Leads Directory', icon: <Users className="w-5 h-5" /> },
  { id: 'deals', label: 'Pipeline Deals', icon: <DollarSign className="w-5 h-5" /> },
  { id: 'reports', label: 'Analytics Reports', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'settings', label: 'System Settings', icon: <Settings className="w-5 h-5" /> },
];

export function Sidebar({ currentPage, onNavigate, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-indigo-950 text-white flex flex-col flex-shrink-0 border-r border-indigo-900 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="px-6 h-16 flex items-center justify-between border-b border-indigo-900">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-7 h-7 text-indigo-400" />
            <span className="text-xl font-bold tracking-wide text-white">SalesTrack</span>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-lg hover:bg-indigo-900 text-indigo-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                onClose();
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-150 ${
                currentPage === item.id
                  ? 'bg-indigo-900 text-white'
                  : 'text-indigo-200 hover:bg-indigo-900/50 hover:text-white'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}

          {/* Management Section */}
          <div className="pt-6 mt-6 border-t border-indigo-900/60">
            <p className="px-4 text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">
              Management Controls
            </p>
            <button className="w-full flex items-center space-x-3 text-indigo-200 hover:bg-indigo-900/50 hover:text-white px-4 py-3 rounded-lg font-medium text-sm transition-all duration-150">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span>Team Permissions</span>
            </button>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-indigo-900/60 flex items-center justify-between text-xs text-indigo-300 bg-indigo-950/50">
          <span>Terminal Connected</span>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>v3.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
