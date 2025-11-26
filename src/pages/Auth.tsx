import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Sun, User, Shield, Loader2, ArrowLeft } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = loginSchema.extend({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  region: z.string().optional(),
});

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup');
  const [role, setRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, signUp, user, userProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && userProfile) {
      navigate(userProfile.role === 'officer' ? '/officer-dashboard' : '/dashboard');
    }
  }, [user, userProfile, navigate]);

  const validateForm = () => {
    try {
      if (isLogin) {
        loginSchema.parse({ email, password });
      } else {
        signupSchema.parse({ email, password, name, region });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        toast({
          title: 'Welcome back!',
          description: 'Successfully logged in.',
        });
      } else {
        await signUp(email, password, name, role, region);
        toast({
          title: 'Account created!',
          description: 'Welcome to TopRoof Solar Verification.',
        });
      }
    } catch (error: any) {
      let message = 'An error occurred. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please login instead.';
      } else if (error.code === 'auth/invalid-credential') {
        message = 'Invalid email or password.';
      } else if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password.';
      }

      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const regions = [
    'Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat',
    'Rajasthan', 'Uttar Pradesh', 'Madhya Pradesh', 'West Bengal', 'Other'
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 hero-gradient opacity-10" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-solar-gold/20 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-eco-green/20 rounded-full blur-3xl" />

      <Card className="w-full max-w-md relative animate-slide-up">
        <CardHeader className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 justify-center mb-4 group">
            <div className="p-2 rounded-lg solar-gradient shadow-solar group-hover:shadow-hover transition-all">
              <Sun className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">TopRoof Solar</span>
          </Link>
          
          <CardTitle className="text-2xl">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? 'Sign in to access your dashboard' 
              : 'Register to apply for solar verification'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!isLogin && (
            <div className="flex gap-2 mb-6">
              <Button
                type="button"
                variant={role === 'user' ? 'default' : 'outline'}
                className="flex-1 gap-2"
                onClick={() => setRole('user')}
              >
                <User className="h-4 w-4" />
                User
              </Button>
              <Button
                type="button"
                variant={role === 'officer' ? 'default' : 'outline'}
                className="flex-1 gap-2"
                onClick={() => setRole('officer')}
              >
                <Shield className="h-4 w-4" />
                Officer
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="region">Region / State</Label>
                <select
                  id="region"
                  className="flex h-11 w-full rounded-lg border-2 border-input bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                >
                  <option value="">Select your region</option>
                  {regions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            )}

            <Button 
              type="submit" 
              variant="hero" 
              className="w-full" 
              size="lg"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'}
            </button>
          </div>

          <div className="mt-4 text-center">
            <Link 
              to="/" 
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
