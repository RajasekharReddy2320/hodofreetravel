import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Plane } from 'lucide-react';

const signupSchema = z.object({
  fullName: z.string().trim().min(2, { message: 'Name must be at least 2 characters' }).max(100),
  email: z.string().trim().email({ message: 'Invalid email address' }).max(255),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(100)
    .regex(/[A-Z]/, { message: 'Password must contain an uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain a lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain a number' })
});

const phoneSignupSchema = z.object({
  fullName: z.string().trim().min(2, { message: 'Name must be at least 2 characters' }).max(100),
  phone: z.string().regex(/^\+[1-9]\d{10,14}$/, { message: 'Phone must be in format +[country code][number]' })
});

const Signup = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) navigate('/onboarding');
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const getAuthErrorMessage = (error: any): string => {
    console.error('Auth error:', error);
    if (error.message?.toLowerCase().includes('already registered')) {
      return 'This email is already registered. Please sign in instead';
    }
    if (error.message?.toLowerCase().includes('rate limit')) {
      return 'Too many attempts. Please try again later';
    }
    return 'Registration failed. Please try again';
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = signupSchema.safeParse({ fullName, email, password });
    if (!validation.success) {
      toast({
        title: 'Validation Error',
        description: validation.error.issues[0].message,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: validation.data.email,
        password: validation.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`,
          data: {
            full_name: validation.data.fullName,
          },
        },
      });

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Account created successfully. Redirecting to onboarding...',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: getAuthErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = phoneSignupSchema.safeParse({ fullName, phone });
    if (!validation.success) {
      toast({
        title: 'Validation Error',
        description: validation.error.issues[0].message,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: validation.data.phone,
        options: {
          data: {
            full_name: validation.data.fullName,
          },
        },
      });

      if (error) throw error;

      setOtpSent(true);
      toast({
        title: 'OTP Sent',
        description: 'Please check your phone for the verification code',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to send OTP. Please check your phone number',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter a 6-digit OTP code',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms',
      });

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Phone verified successfully. Redirecting to onboarding...',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Invalid OTP code. Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/onboarding`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Social signup temporarily unavailable',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-accent/10 rounded-full">
              <Plane className="h-8 w-8 text-accent" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Join TraviLink</CardTitle>
          <CardDescription>Create your account to start exploring the world</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            onClick={() => handleSocialAuth('google')}
            disabled={loading}
            className="w-full"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="phone">Phone</TabsTrigger>
            </TabsList>
            
            <TabsContent value="email">
              <form onSubmit={handleEmailSignup} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Password (min 8 chars, 1 uppercase, 1 number)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="phone">
              {!otpSent ? (
                <form onSubmit={handlePhoneSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="tel"
                      placeholder="Phone (+1234567890)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: +[country code][number] (e.g., +919876543210)
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      disabled={loading}
                      maxLength={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      OTP sent to {phone}
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Verifying...' : 'Verify OTP & Create Account'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                    }}
                  >
                    Change Phone Number
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
