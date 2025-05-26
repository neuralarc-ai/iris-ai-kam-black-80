
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, FolderOpen, MessageSquare, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Account {
  id: string;
  name: string;
  type: string;
  status: string;
  description: string;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
  value: number;
  start_date: string;
  end_date: string;
}

interface Update {
  id: string;
  content: string;
  type: string;
  date: string;
  project: {
    name: string;
  };
}

interface AccountDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
}

const AccountDetailModal = ({ open, onOpenChange, accountId }: AccountDetailModalProps) => {
  const [account, setAccount] = useState<Account | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open && accountId) {
      fetchAccountDetails();
    }
  }, [open, accountId]);

  const fetchAccountDetails = async () => {
    try {
      setLoading(true);

      // Fetch account details
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (accountError) throw accountError;
      setAccount(accountData);

      // Fetch related projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      // Fetch recent updates from projects
      if (projectsData && projectsData.length > 0) {
        const projectIds = projectsData.map(p => p.id);
        const { data: updatesData, error: updatesError } = await supabase
          .from('updates')
          .select(`
            *,
            project:projects(name)
          `)
          .in('project_id', projectIds)
          .order('date', { ascending: false })
          .limit(5);

        if (updatesError) throw updatesError;
        setRecentUpdates(updatesData || []);
      }
    } catch (error) {
      console.error('Error fetching account details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load account details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const totalPipelineValue = projects.reduce((sum, project) => sum + (project.value || 0), 0);

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!account) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>{account.name}</span>
          </DialogTitle>
          <DialogDescription>
            Account details and related information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <p>{account.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div>
                    <Badge variant={account.status === 'Active' ? 'default' : 'secondary'}>
                      {account.status}
                    </Badge>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-700">{account.description || 'No description available'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p>{formatDate(account.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Pipeline Value</label>
                  <p className="text-lg font-semibold text-green-600">{formatCurrency(totalPipelineValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FolderOpen className="h-4 w-4" />
                <span>Projects ({projects.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projects.length > 0 ? (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div key={project.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{project.name}</h4>
                        <Badge variant="secondary">{project.status}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
                        {project.value && (
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-3 w-3" />
                            <span>{formatCurrency(project.value)}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{project.start_date ? formatDate(project.start_date) : 'Not set'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{project.end_date ? formatDate(project.end_date) : 'Not set'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No projects found for this account.</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Updates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Recent Updates</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentUpdates.length > 0 ? (
                <div className="space-y-3">
                  {recentUpdates.map((update) => (
                    <div key={update.id} className="border-l-2 border-gray-200 pl-3">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium">{update.project.name}</span>
                        <span className="text-xs text-gray-500">{formatDate(update.date)}</span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{update.content}</p>
                      <Badge variant="outline" className="mt-1 text-xs">{update.type}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No recent updates found.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccountDetailModal;
