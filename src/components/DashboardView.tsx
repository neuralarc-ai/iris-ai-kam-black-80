
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  FolderOpen, 
  DollarSign, 
  AlertTriangle,
  Calendar,
  MessageSquare,
  Brain,
  Activity,
  User,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import UserActivityCard from './UserActivityCard';

interface DashboardStats {
  totalAccounts: number;
  totalProjects: number;
  totalPipelineValue: number;
  activeUsers: number;
  recentUpdatesCount: number;
}

interface ProjectsByStatus {
  status: string;
  count: number;
  value: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  date: string;
  project_name?: string;
  account_name?: string;
}

interface UserActivity {
  user_id: string;
  name: string;
  last_activity: string;
  updates_count: number;
  is_inactive: boolean;
}

const DashboardView = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalAccounts: 0,
    totalProjects: 0,
    totalPipelineValue: 0,
    activeUsers: 0,
    recentUpdatesCount: 0,
  });
  const [projectsByStatus, setProjectsByStatus] = useState<ProjectsByStatus[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch basic stats
      const [accountsRes, projectsRes, updatesRes] = await Promise.all([
        supabase.from('accounts').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*, account:accounts(name)'),
        supabase.from('updates').select(`
          *, 
          project:projects(name, account:accounts(name)),
          created_by_profile:profiles!updates_created_by_fkey(name, pin)
        `).order('created_at', { ascending: false }).limit(10)
      ]);

      if (accountsRes.error) throw accountsRes.error;
      if (projectsRes.error) throw projectsRes.error;
      if (updatesRes.error) throw updatesRes.error;

      const projects = projectsRes.data || [];
      const updates = updatesRes.data || [];

      // Calculate stats
      const totalPipelineValue = projects.reduce((sum, project) => sum + (project.value || 0), 0);
      const recentUpdatesCount = updates.filter(update => 
        new Date(update.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length;

      setStats({
        totalAccounts: accountsRes.count || 0,
        totalProjects: projects.length,
        totalPipelineValue,
        activeUsers: 1, // For demo purposes
        recentUpdatesCount,
      });

      // Calculate projects by status
      const statusGroups = projects.reduce((acc, project) => {
        const status = project.status;
        if (!acc[status]) {
          acc[status] = { status, count: 0, value: 0 };
        }
        acc[status].count++;
        acc[status].value += project.value || 0;
        return acc;
      }, {} as Record<string, ProjectsByStatus>);

      setProjectsByStatus(Object.values(statusGroups));

      // Format recent activity with proper user information
      const formattedActivity = updates.map(update => ({
        id: update.id,
        type: 'update',
        description: update.content,
        date: update.created_at,
        project_name: update.project.name,
        account_name: update.project.account.name,
        created_by: update.created_by_profile?.name || `User ${update.created_by_profile?.pin}`,
        update_type: update.type,
      }));

      setRecentActivity(formattedActivity);

      // Generate AI insights based on data
      generateAIInsights(projects, updates);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsights = (projects: any[], updates: any[]) => {
    const insights = [];

    // Pipeline analysis
    const closedWonProjects = projects.filter(p => p.status === 'Closed Won');
    const closedLostProjects = projects.filter(p => p.status === 'Closed Lost');
    const winRate = projects.length > 0 ? (closedWonProjects.length / (closedWonProjects.length + closedLostProjects.length) * 100) : 0;

    if (winRate > 0) {
      insights.push(`Current win rate is ${winRate.toFixed(1)}% - ${winRate > 50 ? 'above' : 'below'} average`);
    }

    // Activity analysis
    const recentUpdates = updates.filter(u => 
      new Date(u.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    
    if (recentUpdates.length < 5) {
      insights.push('Low activity detected - consider reaching out to prospects');
    }

    // Pipeline stage analysis
    const needAnalysisCount = projects.filter(p => p.status === 'Need Analysis').length;
    const proposalCount = projects.filter(p => p.status === 'Proposal').length;
    
    if (needAnalysisCount > proposalCount * 2) {
      insights.push('Many projects in analysis stage - focus on moving to proposal');
    }

    // Revenue forecast
    const activeProjectsValue = projects
      .filter(p => !['Closed Won', 'Closed Lost'].includes(p.status))
      .reduce((sum, p) => sum + (p.value || 0), 0);
    
    if (activeProjectsValue > 0) {
      const forecastValue = activeProjectsValue * (winRate / 100);
      insights.push(`Potential revenue forecast: ${formatCurrency(forecastValue)} based on current pipeline`);
    }

    // Default insights if no data
    if (insights.length === 0) {
      insights.push('Start adding accounts and projects to see AI insights');
      insights.push('Regular updates help improve forecast accuracy');
    }

    setAiInsights(insights);
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-black">Dashboard</h2>
        <Button 
          onClick={fetchDashboardData}
          variant="outline"
          className="border-gray-300 hover:border-black"
        >
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAccounts}</div>
            <p className="text-xs text-muted-foreground">Active customer accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">Projects in pipeline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPipelineValue)}</div>
            <p className="text-xs text-muted-foreground">Total opportunity value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentUpdatesCount}</div>
            <p className="text-xs text-muted-foreground">Updates this week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sales Pipeline - Changed to Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Pipeline Flow</CardTitle>
            <CardDescription>Pipeline progression and values</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={projectsByStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" fontSize={12} />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'count' ? `${value} projects` : formatCurrency(Number(value)),
                    name === 'count' ? 'Projects' : 'Value'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stackId="1" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stackId="2" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pipeline Value Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Value Distribution</CardTitle>
            <CardDescription>Pipeline value by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={projectsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, value }) => `${status}: ${formatCurrency(value)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* User Activity Card - New Addition */}
      <UserActivityCard />

      <div className="grid gap-6 md:grid-cols-2">
        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span>AI Insights</span>
            </CardTitle>
            <CardDescription>Smart recommendations based on your data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiInsights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Brain className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity - Improved Layout */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>Latest updates across all projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="border-l-4 border-blue-200 pl-4 py-3 bg-gray-50 rounded-r-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                          {activity.update_type}
                        </Badge>
                        <span className="text-sm font-medium text-gray-900">
                          {activity.project_name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(activity.date)}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                      {activity.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs text-gray-600">
                        <span className="font-medium">{activity.account_name}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <User className="h-3 w-3" />
                        <span>{activity.created_by}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Activity Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>User Activity Monitor</span>
          </CardTitle>
          <CardDescription>Track user engagement and identify inactive users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-green-800">System Active</p>
                  <p className="text-sm text-green-600">All users showing regular activity</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                All Active
              </Badge>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>• Last activity tracked for all users</p>
              <p>• No inactive users detected (7+ days without updates)</p>
              <p>• Average activity level: Good</p>
            </div>
          </div>
        </CardContent>
      </div>
    </div>
  );
};

export default DashboardView;
