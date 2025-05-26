
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  name: string | null;
  pin: string;
}

interface UserActivity {
  id: string;
  content: string;
  created_at: string;
  type: string;
  project: {
    name: string;
    account: {
      name: string;
    };
  };
  created_by_profile: {
    name: string | null;
    pin: string;
  } | null;
}

const UserActivityCard = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchUserActivity();
  }, [selectedUserId]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, pin')
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    }
  };

  const fetchUserActivity = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('updates')
        .select(`
          id,
          content,
          created_at,
          type,
          created_by,
          project:projects!inner(
            name,
            account:accounts!inner(name)
          ),
          created_by_profile:profiles!updates_created_by_fkey(
            name,
            pin
          )
        `)
        .order('created_at', { ascending: false })
        .limit(15);

      // Filter by specific user if selected
      if (selectedUserId !== 'all') {
        query = query.eq('created_by', selectedUserId);
      }

      const { data: updatesData, error: updatesError } = await query;

      if (updatesError) throw updatesError;

      setUserActivity(updatesData || []);
    } catch (error) {
      console.error('Error fetching user activity:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user activity',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUserDisplayName = (activity: UserActivity) => {
    if (activity.created_by_profile) {
      return activity.created_by_profile.name || `User ${activity.created_by_profile.pin}`;
    }
    return 'System';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>Latest project updates from the team</CardDescription>
          </div>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name || `User ${user.pin}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : userActivity.length > 0 ? (
          <div className="space-y-4">
            {userActivity.map((activity) => (
              <div key={activity.id} className="border-l-2 border-blue-200 pl-4 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-blue-600">
                        {getUserDisplayName(activity)}
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500 capitalize">
                        {activity.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 mb-2 line-clamp-2">
                      {activity.content}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{activity.project.name}</span>
                      <span>•</span>
                      <span>{activity.project.account.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500 ml-4">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(activity.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No recent activity found</p>
            <p className="text-sm text-gray-400 mt-2">
              {selectedUserId !== 'all' 
                ? 'This user has not created any updates yet.' 
                : 'Create some updates to see activity here.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserActivityCard;
