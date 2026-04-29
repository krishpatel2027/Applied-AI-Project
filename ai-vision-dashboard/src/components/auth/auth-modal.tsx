'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { Hexagon, Mail, User as UserIcon, Loader2, Github } from 'lucide-react';

export function AuthModal() {
  const { signIn, signUp, signInWithGoogle, signInWithGithub, signInAsGuest, isAuthenticated, isGuest } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signUp(email, name, password);
    } catch (error) {
      console.error('Sign up error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGithub();
    } catch (error) {
      console.error('Github sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated || isGuest) {
    return null;
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-md px-4"
        >
          <Card className="glass-panel border-border/50 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x" />
            
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Hexagon className="w-8 h-8 text-primary fill-primary/10" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">NEXUS AI</CardTitle>
              <CardDescription>Experience the future of multimodal intelligence.</CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-lg">
                  <TabsTrigger value="signin" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin" className="space-y-4 pt-6">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@example.com"
                          className="pl-10 bg-background/50"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Authenticating...
                        </>
                      ) : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-4 pt-6">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="name@example.com"
                          className="pl-10 bg-background/50"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="John Doe"
                          className="pl-10 bg-background/50"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
              
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              
              <Button variant="outline" className="w-full h-11 border-border/50 hover:bg-muted/50" onClick={signInAsGuest}>
                Guest Access
              </Button>
            </CardContent>
            
            <div className="p-6 pt-0 text-center">
              <p className="text-[10px] text-muted-foreground">
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

