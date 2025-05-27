import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
const Login = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const {
    login,
    loading
  } = useAuth();
  const {
    toast
  } = useToast();
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) {
      setError('PIN must be 6 digits');
      return;
    }
    setError('');
    try {
      const success = await login(pin);
      if (!success) {
        setError('Invalid PIN. Please try again.');
        toast({
          title: "Login Failed",
          description: "Invalid PIN. Please check your credentials and try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Welcome!",
          description: "Successfully logged in to Iris AI."
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login. Please try again.');
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };
  return <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-gray-200 shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-black rounded-full">
              <Lock className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-black">IRIS AI</CardTitle>
            <CardDescription className="text-gray-600">
              Key Account Management CRM
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block text-center">
                Enter your 6-digit PIN
              </label>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={pin} onChange={value => setPin(value)} disabled={loading}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
            
            {error && <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>}
            
            <Button type="submit" className="w-full bg-black hover:bg-gray-800 text-white" disabled={loading || pin.length !== 6}>
              {loading ? 'Verifying PIN...' : 'Access System'}
            </Button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-center space-x-4 text-sm text-gray-500">
              <span>a thing by Neural Arc</span>
            </div>
            <div className="flex justify-center space-x-4 text-sm text-gray-500 mt-2">
              <a href="#" className="hover:text-black transition-colors">Help</a>
              <a href="#" className="hover:text-black transition-colors">Privacy</a>
              <a href="#" className="hover:text-black transition-colors">Contact</a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default Login;