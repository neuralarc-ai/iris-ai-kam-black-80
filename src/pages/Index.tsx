
import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Login from '@/components/Login';
import Layout from '@/components/Layout';
import DashboardView from '@/components/DashboardView';
import AccountsView from '@/components/AccountsView';
import ProjectsView from '@/components/ProjectsView';
import UpdatesView from '@/components/UpdatesView';
import QuickCreateModal from '@/components/QuickCreateModal';
import SettingsModal from '@/components/modals/SettingsModal';

const AppContent = () => {
  const { isAuthenticated, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [quickCreateModalOpen, setQuickCreateModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const handleShowCreateModal = () => {
    setQuickCreateModalOpen(true);
  };

  const handleShowSettings = () => {
    setSettingsModalOpen(true);
  };

  const handleCreateProject = (accountId: string) => {
    console.log('Create project for account:', accountId);
  };

  const handleRefreshData = () => {
    const currentTab = activeTab;
    setActiveTab('');
    setTimeout(() => setActiveTab(currentTab), 100);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'accounts':
        return <AccountsView onCreateProject={handleCreateProject} />;
      case 'projects':
        return <ProjectsView />;
      case 'updates':
        return <UpdatesView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <>
      <Layout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onShowCreateModal={handleShowCreateModal}
        onShowSettings={handleShowSettings}
      >
        {renderActiveView()}
      </Layout>

      <QuickCreateModal
        open={quickCreateModalOpen}
        onOpenChange={setQuickCreateModalOpen}
        onItemCreated={handleRefreshData}
      />

      <SettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
      />
    </>
  );
};

const Index = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;
