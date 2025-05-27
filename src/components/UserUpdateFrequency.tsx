
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { Users, TrendingUp, Activity } from 'lucide-react';

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
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-purple-600" />
          <span className="text-purple-800">User Update Frequency</span>
        </CardTitle>
        <CardDescription className="text-purple-600">Activity levels over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={frequencyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorLast7" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorLast30" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="user_name" 
              fontSize={12} 
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
            />
            <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} />
            <Tooltip 
              formatter={(value, name) => [
                `${value} updates`,
                name === 'last_7_days' ? 'Last 7 days' : 'Last 30 days'
              ]}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="last_30_days" 
              stroke="#3b82f6" 
              fillOpacity={1} 
              fill="url(#colorLast30)"
              strokeWidth={2}
            />
            <Area 
              type="monotone" 
              dataKey="last_7_days" 
              stroke="#8b5cf6" 
              fillOpacity={1} 
              fill="url(#colorLast7)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-purple-700 font-medium">Last 7 days</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-blue-700 font-medium">Last 30 days</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserUpdateFrequency;
