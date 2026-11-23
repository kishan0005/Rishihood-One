import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { Sidebar, NavTab } from './components/common/Sidebar';
import { DashboardView } from './views/DashboardView';
import { LandingPageView } from './views/LandingPageView';
import { AcademicsView } from './views/AcademicsView';
import { HousingView } from './views/HousingView';
import { ComplaintsView } from './views/ComplaintsView';
import { FeesView } from './views/FeesView';
import { DiningView } from './views/DiningView';
import { EventsView } from './views/EventsView';
import { AdminHubView } from './views/AdminHubView';

export const App: React.FC = () => {
  const { user, role, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-[#172D45] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-2xl bg-[#5267D8] flex items-center justify-center font-bold text-2xl animate-pulse mb-4 shadow-lg">
          <span className="text-amber-400">R</span>
          <span className="text-white text-sm">1</span>
        </div>
        <p className="text-sm font-semibold tracking-wider text-slate-200">
          Connecting to Rishihood One Portal...
        </p>
        <span className="text-xs text-slate-400 mt-1">Sonipat, Haryana</span>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <LandingPageView onNavigate={(tab) => setActiveTab(tab)} />;
      case 'dashboard':
        return <DashboardView onNavigate={(tab) => setActiveTab(tab)} />;
      case 'academics':
        return <AcademicsView />;
      case 'housing':
        return <HousingView />;
      case 'complaints':
        return <ComplaintsView />;
      case 'fees':
        return <FeesView />;
      case 'dining':
        return <DiningView />;
      case 'events':
        return <EventsView />;
      case 'admin':
        return <AdminHubView />;
      default:
        return <DashboardView onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col antialiased text-[#202938]">
      {/* Top Navigation Bar with Quick Persona Switcher, Notifications, and Profile */}
      <Header
        activeTab={activeTab}
        onNavigate={setActiveTab}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex">
        {/* Reusable Sidebar (Desktop + Mobile Drawer) */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          role={role}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Viewport Content Area */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
