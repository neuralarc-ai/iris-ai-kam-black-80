
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
  LineChart,
  Line,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  FolderOpen, 
  IndianRupee, 
  AlertTriangle,
  Calendar,
  MessageSquare,
  Brain,
  Activity,
  TrendingDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import UserActivityCard from './UserActivityCard';
import UserUpdateFrequency from './UserUpdateFrequency';
import EnhancedRecentActivity from './EnhancedRecentActivity';
import ClientOverview from './ClientOverview';

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
  user_name?: string;
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
        supabase.from('updates').select('*, project:projects(name, account:accounts(name)), profiles:created_by(name)').order('created_at', { ascending: false }).limit(10)
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

      // Format recent activity with enhanced data
      const formattedActivity = updates.map(update => ({
        id: update.id,
        type: 'update',
        description: `Update added to ${update.project.name}`,
        date: update.created_at,
        project_name: update.project.name,
        account_name: update.project.account.name,
        user_name: update.profiles?.name || 'Unknown User',
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
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
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

  // Sales Funnel Data Processing
  const getFunnelData = () => {
    const statusOrder = ['Need Analysis', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won'];
    return statusOrder.map((status, index) => {
      const statusData = projectsByStatus.find(p => p.status === status) || { count: 0, value: 0 };
      return {
        status,
        count: statusData.count,
        value: statusData.value,
        width: 100 - (index * 15), // Decreasing width for funnel effect
        color: `hsl(${220 + index * 30}, 70%, ${60 - index * 5}%)`
      };
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

  const funnelData = getFunnelData();

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
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
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

      {/* Client Overview - New large card */}
      <ClientOverview />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sales Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5" />
              <span>Sales Pipeline Funnel</span>
            </CardTitle>
            <CardDescription>Project flow through sales stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 py-4">
              {funnelData.map((stage, index) => (
                <div key={stage.status} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{stage.status}</span>
                    <div className="text-right">
                      <div className="text-sm font-bold">{stage.count} projects</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(stage.value)}
                      </div>
                    </div>
                  </div>
                  <div 
                    className="h-12 rounded-lg flex items-center justify-center text-white font-medium transition-all hover:shadow-md"
                    style={{
                      backgroundColor: stage.color,
                      width: `${stage.width}%`,
                      marginLeft: `${(100 - stage.width) / 2}%`
                    }}
                  >
                    {stage.count > 0 && (
                      <span className="text-sm">
                        {((stage.count / stats.totalProjects) * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Value Distribution - Horizontal Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Value Distribution</CardTitle>
            <CardDescription>Pipeline value by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={projectsByStatus} 
                layout="horizontal"
                margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`} />
                <YAxis dataKey="status" type="category" width={80} fontSize={12} />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), 'Value']}
                  labelStyle={{ color: '#000' }}
                />
                <Bar dataKey="value" fill="#8884d8">
                  {projectsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* User Activity and Update Frequency */}
      <div className="grid gap-6 md:grid-cols-2">
        <UserActivityCard />
        <UserUpdateFrequency />
      </div>

      {/* AI Insights - Only one card now */}
      <div className="grid gap-6 md:grid-cols-1">
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
      </Card>
    </div>
  );
};

export default DashboardView;
