
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  name: string;
  account: { name: string };
}

interface CreateUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateCreated: () => void;
  preselectedProjectId?: string;
}

const CreateUpdateModal = ({ open, onOpenChange, onUpdateCreated, preselectedProjectId }: CreateUpdateModalProps) => {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    project_id: preselectedProjectId || '',
    content: '',
    type: 'general',
    date: new Date().toISOString().split('T')[0],
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchProjects();
    }
  }, [open]);

  useEffect(() => {
    if (preselectedProjectId) {
      setFormData(prev => ({ ...prev, project_id: preselectedProjectId }));
    }
  }, [preselectedProjectId]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          account:accounts(name)
        `)
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_id || !formData.content || !profile?.id) {
      toast({
        title: 'Error',
        description: 'Project, content, and user profile are required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    console.log('Creating update with data:', {
      ...formData,
      created_by: profile.id
    });
    
    try {
      const updateData = {
        project_id: formData.project_id,
        content: formData.content,
        type: formData.type,
        date: formData.date,
        created_by: profile.id
      };

      const { data, error } = await supabase
        .from('updates')
        .insert([updateData])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Update created successfully:', data);

      toast({
        title: 'Success',
        description: 'Update created successfully',
      });

      setFormData({
        project_id: preselectedProjectId || '',
        content: '',
        type: 'general',
        date: new Date().toISOString().split('T')[0],
      });
      onOpenChange(false);
      onUpdateCreated();
    } catch (error) {
      console.error('Error creating update:', error);
      toast({
        title: 'Error',
        description: 'Failed to create update. Please check the console for details.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Update</DialogTitle>
          <DialogDescription>
            Add a new update to track project progress.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project">Project *</Label>
            <Select value={formData.project_id} onValueChange={(value) => setFormData({ ...formData, project_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name} ({project.account.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Update Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Update Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Enter update details..."
              rows={5}
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-black hover:bg-gray-800">
              {loading ? 'Creating...' : 'Create Update'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUpdateModal;
