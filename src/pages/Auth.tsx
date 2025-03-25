import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Mail, Lock, Loader2, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingScreen from '@/components/LoadingScreen';

const Auth: React.FC = () => {
  const { signIn, signUp, loading, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // If user is already logged in, redirect to homepage
  if (user) {
    return <Navigate to="/" replace />;
  }

  // Show the loading screen if we're authenticating or the auth context is loading
  if (isAuthenticating || loading) {
    return <LoadingScreen />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    try {
      // Don't await here - we want to let the authentication process run
      // without blocking, but keep isAuthenticating true until redirect
      signIn(email, password);
      // Don't reset isAuthenticating - when successful, redirect will unmount this component
    } catch (error) {
      // Only reset if there's an error
      setIsAuthenticating(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    try {
      // Don't await here to allow the loading screen to stay visible
      signUp(email, password, firstName, lastName);
      // Don't reset isAuthenticating - when successful, redirect will unmount this component
    } catch (error) {
      setIsAuthenticating(false);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-4">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
            <CardDescription>Sign in or create an account to continue</CardDescription>
          </CardHeader>
          
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="Email"
                        className="pl-9"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="Password"
                        className="pl-9"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button className="w-full" type="submit" disabled={loading || isAuthenticating}>
                    {loading || isAuthenticating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="First Name"
                          className="pl-9"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Last Name"
                          className="pl-9"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="Email"
                        className="pl-9"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="Password"
                        className="pl-9"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button className="w-full" type="submit" disabled={loading || isAuthenticating}>
                    {loading || isAuthenticating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
