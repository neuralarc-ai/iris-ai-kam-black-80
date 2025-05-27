
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp } from 'lucide-react';

interface UserFrequencyData {
  user_name: string;
  updates_count: number;
  last_7_days: number;
  last_30_days: number;
}

const UserUpdateFrequency = () => {
  const [frequencyData, setFrequencyData] = useState<UserFrequencyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserFrequency();
  }, []);

  const fetchUserFrequency = async () => {
    try {
      const { data: updates, error } = await supabase
        .from('updates')
        .select(`
          created_by,
          created_at,
          profiles:created_by (name)
        `);

      if (error) throw error;

      const userStats = updates?.reduce((acc, update) => {
        const userName = update.profiles?.name || 'Unknown User';
        const updateDate = new Date(update.created_at);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - updateDate.getTime()) / (1000 * 60 * 60 * 24));

        if (!acc[userName]) {
          acc[userName] = {
            user_name: userName,
            updates_count: 0,
            last_7_days: 0,
            last_30_days: 0,
          };
        }

        acc[userName].updates_count++;
        if (daysDiff <= 7) acc[userName].last_7_days++;
        if (daysDiff <= 30) acc[userName].last_30_days++;

        return acc;
      }, {} as Record<string, UserFrequencyData>) || {};

      setFrequencyData(Object.values(userStats));
    } catch (error) {
      console.error('Error fetching user frequency:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>User Update Frequency</span>
        </CardTitle>
        <CardDescription>Activity levels over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={frequencyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="user_name" fontSize={12} />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [
                `${value} updates`,
                name === 'last_7_days' ? 'Last 7 days' : 'Last 30 days'
              ]}
            />
            <Bar dataKey="last_7_days" fill="#3b82f6" name="last_7_days" />
            <Bar dataKey="last_30_days" fill="#93c5fd" name="last_30_days" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Last 7 days</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-300 rounded"></div>
            <span>Last 30 days</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserUpdateFrequency;
