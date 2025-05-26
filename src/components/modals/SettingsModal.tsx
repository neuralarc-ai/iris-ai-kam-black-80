
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Key, User, Shield } from 'lucide-react';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const { profile } = useAuth();
  const [apiKeys, setApiKeys] = useState({
    openrouter_api_key: '',
    deepseek_api_key: '',
  });
  const [profileData, setProfileData] = useState({
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (profile && open) {
      setApiKeys({
        openrouter_api_key: profile.openrouter_api_key || '',
        deepseek_api_key: profile.deepseek_api_key || '',
      });
      setProfileData({
        name: profile.name || '',
      });
    }
  }, [profile, open]);

  const handleSaveApiKeys = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(apiKeys)
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'API keys updated successfully',
      });
    } catch (error) {
      console.error('Error updating API keys:', error);
      toast({
        title: 'Error',
        description: 'Failed to update API keys',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your account settings and API configurations.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="api">API Keys</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Profile Information</span>
                </CardTitle>
                <CardDescription>
                  Update your personal information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pin">PIN</Label>
                  <Input
                    id="pin"
                    value={profile?.pin || ''}
                    disabled
                    placeholder="Your PIN (read-only)"
                  />
                </div>
                <Button 
                  onClick={handleSaveProfile} 
                  disabled={loading}
                  className="bg-black hover:bg-gray-800"
                >
                  {loading ? 'Saving...' : 'Save Profile'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>API Configuration</span>
                </CardTitle>
                <CardDescription>
                  Configure your API keys for external services.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="openrouter">OpenRouter API Key</Label>
                  <Input
                    id="openrouter"
                    type="password"
                    value={apiKeys.openrouter_api_key}
                    onChange={(e) => setApiKeys({ ...apiKeys, openrouter_api_key: e.target.value })}
                    placeholder="Enter OpenRouter API key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deepseek">DeepSeek API Key</Label>
                  <Input
                    id="deepseek"
                    type="password"
                    value={apiKeys.deepseek_api_key}
                    onChange={(e) => setApiKeys({ ...apiKeys, deepseek_api_key: e.target.value })}
                    placeholder="Enter DeepSeek API key"
                  />
                </div>
                <Button 
                  onClick={handleSaveApiKeys} 
                  disabled={loading}
                  className="bg-black hover:bg-gray-800"
                >
                  {loading ? 'Saving...' : 'Save API Keys'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Security Settings</span>
                </CardTitle>
                <CardDescription>
                  Manage your security preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p>PIN-based authentication is currently active.</p>
                  <p className="mt-2">For PIN changes or security issues, please contact your administrator.</p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium">Account ID: {profile?.id}</p>
                  <p className="text-sm text-gray-500">Created: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
