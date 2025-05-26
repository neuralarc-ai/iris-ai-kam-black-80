
import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Login from '@/components/Login';
import Layout from '@/components/Layout';
import AccountsView from '@/components/AccountsView';
import ProjectsView from '@/components/ProjectsView';
import UpdatesView from '@/components/UpdatesView';

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('accounts');

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
    // TODO: Implement create modal
    console.log('Show create modal');
  };

  const handleShowSettings = () => {
    // TODO: Implement settings modal
    console.log('Show settings modal');
  };

  const handleCreateProject = (accountId: string) => {
    // TODO: Implement create project for account
    console.log('Create project for account:', accountId);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'accounts':
        return <AccountsView onCreateProject={handleCreateProject} />;
      case 'projects':
        return <ProjectsView />;
      case 'updates':
        return <UpdatesView />;
      default:
        return <AccountsView onCreateProject={handleCreateProject} />;
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onShowCreateModal={handleShowCreateModal}
      onShowSettings={handleShowSettings}
    >
      {renderActiveView()}
    </Layout>
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
