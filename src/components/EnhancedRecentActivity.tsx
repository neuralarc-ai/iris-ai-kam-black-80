import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, MessageSquare, Phone, Mail, Calendar } from 'lucide-react';

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  date: string;
  project_name?: string;
  account_name?: string;
  user_name?: string;
}

interface EnhancedRecentActivityProps {
  activities: RecentActivity[];
}

const EnhancedRecentActivity = ({ activities }: EnhancedRecentActivityProps) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      call: 'bg-green-100 text-green-800',
      email: 'bg-blue-100 text-blue-800',
      meeting: 'bg-purple-100 text-purple-800',
      general: 'bg-gray-100 text-gray-800',
    };
    
    return variants[type as keyof typeof variants] || variants.general;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 font-fustat font-medium text-[32px] leading-[36px]" style={{ letterSpacing: '-0.02em', verticalAlign: 'middle' }}>
          <Activity className="h-5 w-5" />
          <span>Recent Activity</span>
        </CardTitle>
        <CardDescription>Latest updates across all projects</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.slice(0, 8).map((activity) => (
              <div key={activity.id} className="group hover:bg-gray-50 p-3 rounded-lg transition-colors duration-200">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      {activity.user_name ? getInitials(activity.user_name) : getTypeIcon(activity.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge className={`text-xs ${getTypeBadge(activity.type)}`}>
                        {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                      </Badge>
                      <span className="text-xs text-gray-500">{formatDate(activity.date)}</span>
                    </div>
                    <p className="text-sm text-gray-900 font-medium">{activity.description}</p>
                    {(activity.project_name || activity.account_name) && (
                      <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                        {activity.project_name && (
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            📋 {activity.project_name}
                          </span>
                        )}
                        {activity.account_name && (
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            🏢 {activity.account_name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No recent activity</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedRecentActivity;
