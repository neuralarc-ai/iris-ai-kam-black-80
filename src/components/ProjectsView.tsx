
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FolderOpen, Search, DollarSign, Calendar, Plus, Eye, Trash2, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CreateProjectModal from './modals/CreateProjectModal';
import CreateUpdateModal from './modals/CreateUpdateModal';
import ProjectDetailModal from './modals/ProjectDetailModal';

interface Project {
  id: string;
  name: string;
  status: string;
  value: number;
  start_date: string;
  end_date: string;
  description: string;
  account: {
    name: string;
    type: string;
  };
}

const ProjectsView = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [createUpdateModalOpen, setCreateUpdateModalOpen] = useState(false);
  const [projectDetailModalOpen, setProjectDetailModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const { toast } = useToast();

  const statusColors: Record<string, string> = {
    'Need Analysis': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Proposal': 'bg-blue-100 text-blue-800 border-blue-200',
    'Negotiation': 'bg-orange-100 text-orange-800 border-orange-200',
    'Closed Won': 'bg-green-100 text-green-800 border-green-200',
    'Closed Lost': 'bg-red-100 text-red-800 border-red-200',
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          account:accounts(name, type)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Project deleted successfully',
      });

      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete project',
        variant: 'destructive',
      });
    }
  };

  const handleCreateUpdate = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCreateUpdateModalOpen(true);
  };

  const handleViewProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setProjectDetailModalOpen(true);
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.account.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          <h2 className="text-3xl font-bold text-black">Projects</h2>
          <div className="flex space-x-4">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-black"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 border-gray-300 focus:border-black">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Need Analysis">Need Analysis</SelectItem>
                <SelectItem value="Proposal">Proposal</SelectItem>
                <SelectItem value="Negotiation">Negotiation</SelectItem>
                <SelectItem value="Closed Won">Closed Won</SelectItem>
                <SelectItem value="Closed Lost">Closed Lost</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => setCreateProjectModalOpen(true)}
              className="bg-black hover:bg-gray-800 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <FolderOpen className="h-5 w-5 text-gray-600" />
                    <CardTitle className="text-lg text-black">{project.name}</CardTitle>
                  </div>
                  <Badge className={statusColors[project.status] || 'bg-gray-100 text-gray-800'}>
                    {project.status}
                  </Badge>
                </div>
                <CardDescription className="text-gray-600">
                  {project.account.name} • {project.account.type}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {project.value && (
                    <div className="flex items-center space-x-2 text-sm">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-900">{formatCurrency(project.value)}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Start: {formatDate(project.start_date)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">End: {formatDate(project.end_date)}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2 mb-4">
                  {project.description || 'No description available'}
                </p>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-gray-300 hover:border-black"
                    onClick={() => handleViewProject(project.id)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-black hover:bg-gray-800 text-white"
                    onClick={() => handleCreateUpdate(project.id)}
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Add Update
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteProject(project.id, project.name)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProjects.length === 0 && !loading && (
          <div className="text-center py-12">
            <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search terms or filters.' 
                : 'Get started by creating your first project.'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button
                onClick={() => setCreateProjectModalOpen(true)}
                className="bg-black hover:bg-gray-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            )}
          </div>
        )}
      </div>

      <CreateProjectModal
        open={createProjectModalOpen}
        onOpenChange={setCreateProjectModalOpen}
        onProjectCreated={fetchProjects}
      />

      <CreateUpdateModal
        open={createUpdateModalOpen}
        onOpenChange={setCreateUpdateModalOpen}
        onUpdateCreated={() => {}}
        preselectedProjectId={selectedProjectId}
      />

      <ProjectDetailModal
        open={projectDetailModalOpen}
        onOpenChange={setProjectDetailModalOpen}
        projectId={selectedProjectId}
      />
    </>
  );
};

export default ProjectsView;
