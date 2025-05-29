import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus, User, LogOut, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onShowCreateModal: () => void;
  onShowSettings: () => void;
}

const Layout = ({ children, activeTab, onTabChange, onShowCreateModal, onShowSettings }: LayoutProps) => {
  const { profile, logout } = useAuth();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'accounts', label: 'Accounts' },
    { id: 'projects', label: 'Projects' },
    { id: 'updates', label: 'Updates' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-gray-800 font-fustat" style={{ letterSpacing: '-0.02em' }}>Iris AI</h1>
              <nav className="flex space-x-1">
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'default' : 'ghost'}
                    className={`${
                      activeTab === tab.id
                        ? 'flex items-center justify-center text-white px-4 py-2'
                        : 'flex items-center justify-center text-gray-600 hover:text-black hover:bg-gray-100 px-4 py-2'
                    }`}
                    style={activeTab === tab.id ? { background: 'linear-gradient(85.21deg, #79685D 1.57%, #2B2521 94.2%)' } : {}}
                    onClick={() => onTabChange(tab.id)}
                  >
                    {tab.label}
                  </Button>
                ))}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={onShowCreateModal}
                className="flex items-center justify-center text-white px-4 py-2" style={{ background: 'linear-gradient(85.21deg, #79685D 1.57%, #2B2521 94.2%)' }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Quick Create
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center justify-center text-white px-4 py-2" style={{ background: 'linear-gradient(85.21deg, #79685D 1.57%, #2B2521 94.2%)' }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    {profile?.name || 'User'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={onShowSettings}>
                    <Settings className="h-4 w-4 mr-2" />
                    API Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
