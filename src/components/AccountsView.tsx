
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Building2, Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CreateProjectModal from './modals/CreateProjectModal';
import CreateAccountModal from './modals/CreateAccountModal';
import AccountDetailModal from './modals/AccountDetailModal';

interface Account {
  id: string;
  name: string;
  type: string;
  status: string;
  description: string;
  project_count?: number;
}

const AccountsView = ({ onCreateProject }: { onCreateProject: (accountId: string) => void }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [createAccountModalOpen, setCreateAccountModalOpen] = useState(false);
  const [accountDetailModalOpen, setAccountDetailModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .order('name');

      if (accountsError) throw accountsError;

      // Get project counts for each account
      const accountsWithCounts = await Promise.all(
        accountsData.map(async (account) => {
          const { count } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('account_id', account.id);
          
          return { ...account, project_count: count || 0 };
        })
      );

      setAccounts(accountsWithCounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load accounts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = (accountId: string) => {
    setSelectedAccountId(accountId);
    setCreateProjectModalOpen(true);
  };

  const handleViewAccount = (accountId: string) => {
    setSelectedAccountId(accountId);
    setAccountDetailModalOpen(true);
  };

  const handleDeleteAccount = async (accountId: string, accountName: string) => {
    if (!confirm(`Are you sure you want to delete "${accountName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Account deleted successfully',
      });

      fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete account',
        variant: 'destructive',
      });
    }
  };

  const filteredAccounts = accounts.filter(account =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-black">Accounts</h2>
          <div className="flex items-center space-x-4">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-black"
              />
            </div>
            <Button
              onClick={() => setCreateAccountModalOpen(true)}
              className="bg-black hover:bg-gray-800 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Account
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAccounts.map((account) => (
            <Card key={account.id} className="border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-gray-600" />
                    <CardTitle className="text-lg text-black">{account.name}</CardTitle>
                  </div>
                  <Badge 
                    variant={account.status === 'Active' ? 'default' : 'secondary'}
                    className={account.status === 'Active' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'}
                  >
                    {account.status}
                  </Badge>
                </div>
                <CardDescription className="text-gray-600">
                  {account.type} • {account.project_count} project{account.project_count !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                  {account.description || 'No description available'}
                </p>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 border-gray-300 hover:border-black"
                    onClick={() => handleViewAccount(account.id)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-black hover:bg-gray-800 text-white"
                    onClick={() => handleCreateProject(account.id)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Project
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteAccount(account.id, account.name)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredAccounts.length === 0 && !loading && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first account.'}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setCreateAccountModalOpen(true)}
                className="bg-black hover:bg-gray-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Account
              </Button>
            )}
          </div>
        )}
      </div>

      <CreateProjectModal
        open={createProjectModalOpen}
        onOpenChange={setCreateProjectModalOpen}
        onProjectCreated={fetchAccounts}
        preselectedAccountId={selectedAccountId}
      />

      <CreateAccountModal
        open={createAccountModalOpen}
        onOpenChange={setCreateAccountModalOpen}
        onAccountCreated={fetchAccounts}
      />

      <AccountDetailModal
        open={accountDetailModalOpen}
        onOpenChange={setAccountDetailModalOpen}
        accountId={selectedAccountId}
      />
    </>
  );
};

export default AccountsView;
