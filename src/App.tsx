import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ReportsPage } from './components/ReportsPage';
import { SettingsPage } from './components/SettingsPage';
import { PlaceholderPage } from './components/PlaceholderPage';
import { LeadsPage } from './components/leads/LeadsPage';
import { DealsPage } from './components/deals/DealsPage';
import { Toast } from './components/Toast';
import type { Page, Role, UserData, ReportMetrics, ActivityMetrics, ToastState } from './types';

const MANAGER_USER: UserData = { name: 'Anna Nguyen', initials: 'AN', roleTitle: 'Sales Manager' };
const MEMBER_USER: UserData = { name: 'Duy Nguyen', initials: 'DN', roleTitle: 'Sales Member' };

const MANAGER_REPORTS: ReportMetrics = {
  leads: '4,812', deals: '124', conversion: '28.4%', value: '$642,500',
  scopeDescription: 'Currently displaying macro-level department telemetry records across entire team pipelines structures.',
};
const MEMBER_REPORTS: ReportMetrics = {
  leads: '614', deals: '18', conversion: '28.4%', value: '$84,200',
  scopeDescription: 'Currently displaying isolated personal scope metrics. Management level aggregate values are locked under permissions criteria parameters.',
};
const MANAGER_ACTIVITIES: ActivityMetrics = { calls: '1,420', emails: '3,892', meetings: '412' };
const MEMBER_ACTIVITIES: ActivityMetrics = { calls: '340', emails: '912', meetings: '84' };

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('reports');
  const [role, setRole] = useState<Role>('manager');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '' });

  const user = role === 'manager' ? MANAGER_USER : MEMBER_USER;
  const reports = role === 'manager' ? MANAGER_REPORTS : MEMBER_REPORTS;
  const activities = role === 'manager' ? MANAGER_ACTIVITIES : MEMBER_ACTIVITIES;

  const showToast = useCallback((message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 2500);
  }, []);

  const handleNavigate = useCallback((page: Page) => {
    setCurrentPage(page);
    setSidebarOpen(false);
  }, []);

  const handleRoleChange = useCallback((newRole: Role) => {
    setRole(newRole);
    showToast(newRole === 'manager'
      ? 'Admin configuration profile assigned. Full corporate reporting scope loaded.'
      : 'Member access limited. Personal quotas report summary isolated.');
  }, [showToast]);

  const handleToggleTheme = useCallback(() => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      showToast(newMode ? 'Dark theme configuration activated.' : 'Light theme mode applied.');
      return newMode;
    });
  }, [showToast]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const renderPage = () => {
    switch (currentPage) {
      case 'leads':
        return <LeadsPage role={role} userName={user.name} onToast={showToast} />;
      case 'deals':
        return <DealsPage role={role} userName={user.name} onToast={showToast} />;
        return (
          <LeadsPage
            role={role}
            userName={user.name}
            onToast={showToast}
          />
        );
      case 'reports':
        return <ReportsPage reports={reports} activities={activities} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <PlaceholderPage page={currentPage} />;
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-gray-50 text-gray-800 font-sans dark:bg-gray-900 dark:text-gray-100 transition-colors duration-200 overflow-hidden">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header user={user} role={role} isDarkMode={isDarkMode} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} onRoleChange={handleRoleChange} onToggleTheme={handleToggleTheme} />
        <main className="flex-1 overflow-y-auto p-6 focus:outline-none">{renderPage()}</main>
      </div>
      <Toast toast={toast} />
    </div>
  );
}

export default App;
