
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MessageSquare, Search, Calendar, Plus, Trash2, Edit, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CreateUpdateModal from './modals/CreateUpdateModal';

interface Update {
  id: string;
  date: string;
  content: string;
  type: string;
  project: {
    name: string;
    account: {
      name: string;
    };
  };
}

const UpdatesView = () => {
  const { profile } = useAuth();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [createUpdateModalOpen, setCreateUpdateModalOpen] = useState(false);
  const { toast } = useToast();

  const typeColors: Record<string, string> = {
    'general': 'bg-gray-100 text-gray-800',
    'call': 'bg-blue-100 text-blue-800',
    'meeting': 'bg-green-100 text-green-800',
    'email': 'bg-purple-100 text-purple-800',
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('updates')
        .select(`
          *,
          project:projects(
            name,
            account:accounts(name)
          )
        `)
        .order('date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setUpdates(data || []);
    } catch (error) {
      console.error('Error fetching updates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load updates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUpdates = updates.filter(update => 
    update.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    update.project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    update.project.account.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
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
          <h2 className="text-3xl font-bold text-black">Updates</h2>
          <div className="flex items-center space-x-4">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search updates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-black"
              />
            </div>
            <Button
              onClick={() => setCreateUpdateModalOpen(true)}
              className="bg-black hover:bg-gray-800 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Update
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredUpdates.map((update) => (
            <Card key={update.id} className="border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5 text-gray-600" />
                    <div>
                      <CardTitle className="text-lg text-black">{update.project.name}</CardTitle>
                      <CardDescription className="text-gray-600">
                        {update.project.account.name}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={typeColors[update.type] || 'bg-gray-100 text-gray-800'}>
                      {update.type}
                    </Badge>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(update.date)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-700 whitespace-pre-wrap mb-4">{update.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUpdates.length === 0 && !loading && (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No updates found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms.' 
                : 'Updates will appear here as they are added to projects.'}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setCreateUpdateModalOpen(true)}
                className="bg-black hover:bg-gray-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Update
              </Button>
            )}
          </div>
        )}
      </div>

      <CreateUpdateModal
        open={createUpdateModalOpen}
        onOpenChange={setCreateUpdateModalOpen}
        onUpdateCreated={fetchUpdates}
      />
    </>
  );
};

export default UpdatesView;
