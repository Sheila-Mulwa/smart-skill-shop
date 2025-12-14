import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2, Phone } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { signUpSchema, signInSchema, resetPasswordSchema } from '@/lib/validations';
import { Alert, AlertDescription } from '@/components/ui/alert';

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'update-password';
type AuthMethod = 'email' | 'phone';

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const isResetMode = searchParams.get('mode') === 'reset';
  
  const [mode, setMode] = useState<AuthMode>(isResetMode ? 'update-password' : 'login');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resetSent, setResetSent] = useState(false);
  
  const navigate = useNavigate();
  const { user, signUp, signIn, signInWithGoogle, signInWithPhone, verifyPhoneOtp, resetPassword, updatePassword } = useAuth();

  // Redirect if already logged in (except for password update mode)
  useEffect(() => {
    if (user && mode !== 'update-password') {
      navigate('/');
    }
  }, [user, navigate, mode]);

  const validateForm = () => {
    setErrors({});
    try {
      if (mode === 'update-password') {
        if (!password || password.length < 8) {
          setErrors({ password: 'Password must be at least 8 characters' });
          return false;
        }
        if (password !== confirmPassword) {
          setErrors({ confirmPassword: 'Passwords do not match' });
          return false;
        }
        return true;
      }
      if (authMethod === 'email') {
        if (mode === 'signup') {
          signUpSchema.parse({ email, password, name });
        } else if (mode === 'login') {
          signInSchema.parse({ email, password });
        } else if (mode === 'forgot-password') {
          resetPasswordSchema.parse({ email });
        }
      }
      return true;
    } catch (error: any) {
      const fieldErrors: Record<string, string> = {};
      error.errors?.forEach((err: any) => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: 'Google sign-in failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (otpSent) {
        const { error } = await verifyPhoneOtp(phone, otp);
        if (error) {
          toast({
            title: 'Verification failed',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Success!',
            description: 'You have been signed in successfully.',
          });
          navigate('/');
        }
      } else {
        const { error } = await signInWithPhone(phone);
        if (error) {
          toast({
            title: 'Failed to send OTP',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          setOtpSent(true);
          toast({
            title: 'OTP sent!',
            description: 'Check your phone for the verification code.',
          });
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password, name);
        
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Account exists',
              description: 'This email is already registered. Please sign in instead.',
              variant: 'destructive',
            });
            setMode('login');
          } else {
            toast({
              title: 'Signup failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Account created!',
            description: 'Please check your email to verify your account.',
          });
          setMode('login');
          setPassword('');
        }
      } else if (mode === 'login') {
        const { error } = await signIn(email, password);
        
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: 'Login failed',
              description: 'Invalid email or password. Please try again.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Login failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Welcome back!',
            description: 'You have been logged in successfully.',
          });
          navigate('/');
        }
      } else if (mode === 'forgot-password') {
        const { error } = await resetPassword(email);
        
        if (error) {
          toast({
            title: 'Reset failed',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          setResetSent(true);
          toast({
            title: 'Reset email sent',
            description: 'Check your email for password reset instructions.',
          });
        }
      } else if (mode === 'update-password') {
        const { error } = await updatePassword(password);
        
        if (error) {
          toast({
            title: 'Password update failed',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Password updated!',
            description: 'Your password has been successfully changed.',
          });
          navigate('/');
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container py-16">
        <div className="mx-auto max-w-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-foreground">
              {mode === 'login' && 'Welcome Back'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'forgot-password' && 'Reset Password'}
              {mode === 'update-password' && 'Set New Password'}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'login' && 'Sign in to access your purchases'}
              {mode === 'signup' && 'Join us and start your learning journey'}
              {mode === 'forgot-password' && 'Enter your email to receive reset instructions'}
              {mode === 'update-password' && 'Enter your new password below'}
            </p>
          </div>

          {/* Toggle */}
          {mode !== 'forgot-password' && mode !== 'update-password' && (
            <div className="mb-8 flex rounded-lg bg-secondary p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrors({});
                  setResetSent(false);
                }}
                className={cn(
                  'flex-1 rounded-md py-2 text-sm font-medium transition-all',
                  mode === 'login'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrors({});
                  setResetSent(false);
                }}
                className={cn(
                  'flex-1 rounded-md py-2 text-sm font-medium transition-all',
                  mode === 'signup'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Social & Auth Method Selection (only on login) */}
          {mode === 'login' && (
            <div className="mb-6 space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
              
              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                  or
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={authMethod === 'email' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setAuthMethod('email')}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </Button>
                <Button
                  type="button"
                  variant={authMethod === 'phone' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => {
                    setAuthMethod('phone');
                    setOtpSent(false);
                  }}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Phone
                </Button>
              </div>
            </div>
          )}

          {/* Reset Success Alert */}
          {resetSent && (
            <Alert className="mb-6">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Password reset email sent! Check your inbox and follow the link to reset your password.
              </AlertDescription>
            </Alert>
          )}

          {/* Phone Auth Form */}
          {mode === 'login' && authMethod === 'phone' ? (
            <form onSubmit={handlePhoneAuth} className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    disabled={otpSent || isLoading}
                    className="pl-10"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Include country code (e.g., +1 for US)
                </p>
              </div>

              {otpSent && (
                <div>
                  <Label htmlFor="otp">Verification Code</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      disabled={isLoading}
                      maxLength={6}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="hero"
                size="xl"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    {otpSent ? 'Verifying...' : 'Sending code...'}
                  </>
                ) : (
                  <>
                    {otpSent ? 'Verify Code' : 'Send Code'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              {otpSent && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp('');
                  }}
                  disabled={isLoading}
                >
                  Change Phone Number
                </Button>
              )}
            </form>
          ) : mode === 'update-password' ? (
            /* Update Password Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">New Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors({ ...errors, password: '' });
                    }}
                    className={cn('pl-10', errors.password && 'border-destructive')}
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Must be at least 8 characters
                </p>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrors({ ...errors, confirmPassword: '' });
                    }}
                    className={cn('pl-10', errors.confirmPassword && 'border-destructive')}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="hero"
                size="xl"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Updating...
                  </>
                ) : (
                  <>
                    Update Password
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            /* Email Auth Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setErrors({ ...errors, name: '' });
                      }}
                      className={cn('pl-10', errors.name && 'border-destructive')}
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors({ ...errors, email: '' });
                    }}
                    className={cn('pl-10', errors.email && 'border-destructive')}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              {mode !== 'forgot-password' && (
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot-password');
                          setErrors({});
                        }}
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrors({ ...errors, password: '' });
                      }}
                      className={cn('pl-10', errors.password && 'border-destructive')}
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password}
                    </p>
                  )}
                  {mode === 'signup' && !errors.password && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Must be 8+ characters with uppercase, lowercase, number & special character
                    </p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                variant="hero"
                size="xl"
                className="w-full"
                disabled={isLoading || resetSent}
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    {mode === 'login' && 'Signing in...'}
                    {mode === 'signup' && 'Creating account...'}
                    {mode === 'forgot-password' && 'Sending email...'}
                  </>
                ) : (
                  <>
                    {mode === 'login' && 'Sign In'}
                    {mode === 'signup' && 'Create Account'}
                    {mode === 'forgot-password' && 'Send Reset Email'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === 'forgot-password' ? (
              <>
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrors({});
                    setResetSent(false);
                  }}
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </button>
              </>
            ) : mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrors({});
                  }}
                  className="font-medium text-primary hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrors({});
                  }}
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default AuthPage;
