import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Building2, Search, TrendingUp, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    <Card className="w-full relative overflow-hidden rounded-lg">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/images/bg4.png)' }}
      />
      <div className="absolute inset-0 bg-white/50" />
      <div className="relative p-6">
        <CardHeader className="!p-0 mb-6">
          <CardTitle className="text-black font-fustat font-medium text-[32px] leading-[36px]" style={{ letterSpacing: '-0.02em', verticalAlign: 'middle' }}>
            Client Overview
          </CardTitle>
          <CardDescription className="text-gray-600 font-fustat font-normal text-[19.51px] leading-[39.01px]" style={{ letterSpacing: '-0.004em', verticalAlign: 'middle' }}>
            {clients.length} total clients • ₹{formatCurrency(totalStats.totalValue).replace('₹', '')} total value
          </CardDescription>
        </CardHeader>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[#FFFFFF]/20 rounded-lg p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-800">Completed</p>
            </div>
            <div className="flex-shrink-0 bg-[#E3E2DF]/80 text-gray-800 px-4 py-2 rounded-md flex items-center justify-center">
              <p className="text-xl font-bold">{formatCurrency(totalStats.completedValue)}</p>
            </div>
          </div>

          <div className="bg-[#FFFFFF]/20 rounded-lg p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-800 font-medium">Pipeline</p>
            </div>
            <div className="flex-shrink-0 bg-[#E3E2DF]/80 text-gray-800 px-4 py-2 rounded-md flex items-center justify-center">
              <p className="text-xl font-bold">{formatCurrency(totalStats.pipelineValue)}</p>
            </div>
          </div>

          <div className="bg-[#FFFFFF]/20 rounded-lg p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-800 font-medium">Total Value</p>
            </div>
            <div className="flex-shrink-0 bg-[#E3E2DF]/80 text-gray-800 px-4 py-2 rounded-md flex items-center justify-center">
              <p className="text-xl font-bold">{formatCurrency(totalStats.totalValue)}</p>
            </div>
          </div>
        </div>

        <div className="relative mb-6 rounded-lg bg-white border border-gray-200 shadow-sm overflow-hidden py-2.5">
          <div className="absolute right-3 top-[50%] transform -translate-y-[50%] rounded-full bg-gray-200 p-1">
            <div className="w-8 h-8 rounded-full bg-[#2B2521] flex items-center justify-center">
              <Search className="h-5 w-5 text-gray-300" />
            </div>
          </div>
          <Input
            placeholder="Search clients..."
            className="pl-4 pr-16 py-3 w-full border-none focus:ring-0 focus:outline-none bg-transparent text-gray-700 placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredClients.map((client) => (
            <div key={client.id} className="flex items-center justify-between p-4 rounded-lg bg-[#FFFFFF]/20">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-gray-800">{client.name}</h4>
                  <Badge className={`text-xs ${getStatusBadge(client.status)}`}>
                    {client.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{client.type} • {client.total_projects} projects</p>
              </div>
              <div className="flex-shrink-0 text-white px-4 py-6 rounded-full border-4 border-gray-400 flex items-center justify-center" style={{ background: 'linear-gradient(85.21deg, #79685D 1.57%, #2B2521 94.2%)', borderRadius: '111px', paddingLeft: '16px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px' }}>
                <p className="text-xl font-bold">{formatCurrency(client.total_value).replace('₹', '')}</p>
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
      </div>
    </Card>
  );
};

export default ClientOverview;
