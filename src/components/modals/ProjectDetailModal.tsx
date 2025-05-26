
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
import { FolderOpen, Building2, MessageSquare, Calendar, DollarSign, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  name: string;
  status: string;
  value: number;
  start_date: string;
  end_date: string;
  description: string;
  created_at: string;
  account: {
    name: string;
    type: string;
  };
}

interface Update {
  id: string;
  content: string;
  type: string;
  date: string;
  created_at: string;
}

interface ProjectDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

const ProjectDetailModal = ({ open, onOpenChange, projectId }: ProjectDetailModalProps) => {
  const [project, setProject] = useState<Project | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open && projectId) {
      fetchProjectDetails();
    }
  }, [open, projectId]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);

      // Fetch project details with account info
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          account:accounts(name, type)
        `)
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Fetch all updates for this project
      const { data: updatesData, error: updatesError } = await supabase
        .from('updates')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false });

      if (updatesError) throw updatesError;
      setUpdates(updatesData || []);
    } catch (error) {
      console.error('Error fetching project details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project details',
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
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Need Analysis': 'bg-yellow-100 text-yellow-800',
      'Proposal': 'bg-blue-100 text-blue-800',
      'Negotiation': 'bg-orange-100 text-orange-800',
      'Closed Won': 'bg-green-100 text-green-800',
      'Closed Lost': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getUpdateTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'general': 'bg-gray-100 text-gray-800',
      'call': 'bg-blue-100 text-blue-800',
      'meeting': 'bg-green-100 text-green-800',
      'email': 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FolderOpen className="h-5 w-5" />
            <span>{project.name}</span>
          </DialogTitle>
          <DialogDescription>
            Project details, timeline, and activity history
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Account</label>
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span>{project.account.name}</span>
                    <Badge variant="outline" className="text-xs">{project.account.type}</Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                </div>
                {project.value && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Project Value</label>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-lg font-semibold text-green-600">
                        {formatCurrency(project.value)}
                      </span>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p>{formatDate(project.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Start Date</label>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{formatDate(project.start_date)}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">End Date</label>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{formatDate(project.end_date)}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-700 mt-1">{project.description || 'No description available'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Timeline & Updates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Activity Timeline ({updates.length} updates)</span>
              </CardTitle>
              <CardDescription>
                All updates and activities for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {updates.length > 0 ? (
                <div className="space-y-4">
                  {updates.map((update, index) => (
                    <div key={update.id} className="relative">
                      {index < updates.length - 1 && (
                        <div className="absolute left-4 top-8 w-0.5 h-full bg-gray-200"></div>
                      )}
                      <div className="flex space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <MessageSquare className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Badge className={getUpdateTypeColor(update.type)}>
                                {update.type}
                              </Badge>
                              <span className="text-sm font-medium text-gray-600">
                                {formatDate(update.date)}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">
                              {formatDateTime(update.created_at)}
                            </span>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-gray-700 whitespace-pre-wrap">{update.content}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No updates yet</h3>
                  <p className="text-gray-600">This project doesn't have any updates yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetailModal;
