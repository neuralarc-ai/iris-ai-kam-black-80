import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Building2, Search, TrendingUp, Users } from 'lucide-react';

interface ClientData {
  id: string;
  name: string;
  type: string;
  status: string;
  total_projects: number;
  completed_value: number;
  pipeline_value: number;
  total_value: number;
}

const ClientOverview = () => {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({
    completedValue: 0,
    pipelineValue: 0,
    totalValue: 0,
  });

  useEffect(() => {
    fetchClientData();
  }, []);

  useEffect(() => {
    const filtered = clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  const fetchClientData = async () => {
    try {
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select(`
          id,
          name,
          type,
          status,
          projects (
            id,
            value,
            status
          )
        `);

      if (accountsError) throw accountsError;

      let completedValue = 0;
      let pipelineValue = 0;

      const clientData = accounts?.map(account => {
        const projects = account.projects || [];
        const completedProjects = projects.filter(p => p.status === 'Closed Won');
        const activeProjects = projects.filter(p => !['Closed Won', 'Closed Lost'].includes(p.status));
        
        const accountCompletedValue = completedProjects.reduce((sum, p) => sum + (p.value || 0), 0);
        const accountPipelineValue = activeProjects.reduce((sum, p) => sum + (p.value || 0), 0);
        
        completedValue += accountCompletedValue;
        pipelineValue += accountPipelineValue;

        return {
          id: account.id,
          name: account.name,
          type: account.type,
          status: account.status,
          total_projects: projects.length,
          completed_value: accountCompletedValue,
          pipeline_value: accountPipelineValue,
          total_value: accountCompletedValue + accountPipelineValue,
        };
      }) || [];

      setClients(clientData);
      setFilteredClients(clientData);
      setTotalStats({
        completedValue,
        pipelineValue,
        totalValue: completedValue + pipelineValue,
      });
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      Active: 'bg-green-100 text-green-800',
      Inactive: 'bg-gray-100 text-gray-800',
      Prospect: 'bg-blue-100 text-blue-800',
    };
    return variants[status as keyof typeof variants] || variants.Prospect;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/images/bg1.png)' }}
      />
      <div className="absolute inset-0 bg-white/50" />
      <div className="relative">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 font-fustat font-medium text-[32px] leading-[36px]" style={{ letterSpacing: '-0.02em', verticalAlign: 'middle' }}>
            <span>Client Overview</span>
          </CardTitle>
          <CardDescription className="font-fustat font-normal text-[19.51px] leading-[39.01px]" style={{ letterSpacing: '-0.004em', verticalAlign: 'middle' }}>
            {clients.length} total clients • ₹{formatCurrency(totalStats.totalValue).replace('₹', '')} total value
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Completed</p>
              <p className="text-lg font-bold text-green-800">{formatCurrency(totalStats.completedValue)}</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Pipeline</p>
              <p className="text-lg font-bold text-blue-800">{formatCurrency(totalStats.pipelineValue)}</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Total Value</p>
              <p className="text-lg font-bold text-purple-800">{formatCurrency(totalStats.totalValue)}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Client List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredClients.map((client) => (
              <div key={client.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{client.name}</h4>
                    <Badge className={`text-xs ${getStatusBadge(client.status)}`}>
                      {client.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">{client.type} • {client.total_projects} projects</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatCurrency(client.total_value)}</p>
                  <p className="text-xs text-gray-500">
                    Pipeline: {formatCurrency(client.pipeline_value)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {filteredClients.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No clients found</p>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
};

export default ClientOverview;
