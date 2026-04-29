"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Hexagon, Sparkles, Zap, BrainCircuit, Eye, EyeOff, Loader2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle, signInAsGuest } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || "Sign in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError("Google Sign-In is not configured yet. Please use email or guest mode.");
      setIsGoogleLoading(false);
    }
  };

  const handleGuestLogin = () => {
    setIsGuestLoading(true);
    signInAsGuest();
  };

  return (
    <div className="flex min-h-screen w-full bg-background font-sans selection:bg-primary/30">
      {/* Left Panel - Features & Branding */}
      <div className="hidden lg:flex w-[45%] flex-col justify-between p-12 bg-card/30 border-r border-border/50 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[40%] rounded-full bg-secondary/20 blur-[120px] pointer-events-none" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 mb-16 hover:opacity-80 transition-opacity w-fit">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <Hexagon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">NEXUS</span>
          </Link>

          <h1 className="text-4xl font-bold tracking-tight mb-3 text-foreground">
            Welcome back, <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
              keep analyzing.
            </span>
          </h1>
          <p className="text-muted-foreground mb-12">Your visual workspace and semantic libraries are waiting for you.</p>

          <div className="grid grid-cols-3 gap-4 mb-12">
            <div className="glass-panel p-4 rounded-xl flex flex-col items-center justify-center text-center border border-primary/20 bg-primary/5">
              <span className="text-xl font-bold text-foreground">12k+</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Active Users</span>
            </div>
            <div className="glass-panel p-4 rounded-xl flex flex-col items-center justify-center text-center border border-border/50 bg-background/50">
              <span className="text-xl font-bold text-foreground">99%</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Accuracy Rate</span>
            </div>
            <div className="glass-panel p-4 rounded-xl flex flex-col items-center justify-center text-center border border-border/50 bg-background/50">
              <span className="text-xl font-bold text-foreground">5 hrs</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Saved Weekly</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </div>
              <p className="text-sm text-foreground/80">Real-time multimodal analysis using state-of-the-art vision models.</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-3.5 h-3.5 text-primary" />
              </div>
              <p className="text-sm text-foreground/80">Instant semantic search across all your uploaded visual assets.</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <BrainCircuit className="w-3.5 h-3.5 text-primary" />
              </div>
              <p className="text-sm text-foreground/80">Chat directly with your image library to uncover hidden insights.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 glass-panel p-6 rounded-2xl border border-primary/10 bg-gradient-to-br from-background/80 to-card/40 mt-12">
          <p className="text-sm text-foreground/90 italic mb-4">
            "Nexus turned my messy pile of lecture slides and handwritten notes into a structured study guide in seconds. It's the ultimate hack for exam season."
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 font-bold border border-purple-500/30">
              AC
            </div>
            <div>
              <p className="text-sm font-semibold">Alex Chen</p>
              <p className="text-xs text-muted-foreground">Computer Science Student</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        {/* Mobile Header */}
        <div className="lg:hidden absolute top-8 left-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Hexagon className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">NEXUS</span>
          </Link>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[400px] space-y-8"
        >
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight mb-2">Sign in to your account</h2>
            <p className="text-sm text-muted-foreground">
              Don't have an account? <Link href="/signup" className="text-primary hover:underline font-medium">Sign up free</Link>
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <Button 
            variant="outline" 
            className="w-full h-12 glass-panel border-border/50 bg-card/30 hover:bg-card/50 transition-all font-medium text-foreground"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground tracking-wider">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="sarah@company.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 glass-panel border-border/50 bg-background/50 focus-visible:ring-primary focus-visible:border-primary" 
                required 
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 glass-panel border-border/50 bg-background/50 focus-visible:ring-primary focus-visible:border-primary pr-10" 
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="remember" className="border-border/50 data-[state=checked]:bg-primary" />
              <label
                htmlFor="remember"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground"
              >
                Remember me for 30 days
              </label>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-medium text-base shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
              disabled={isLoading || isGoogleLoading || !email || !password}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign in"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground tracking-wider">Or</span>
            </div>
          </div>

          {/* Continue as Guest */}
          <Button 
            variant="ghost" 
            className="w-full h-11 border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 hover:text-amber-300 font-medium transition-all"
            onClick={handleGuestLogin}
            disabled={isGuestLoading}
          >
            {isGuestLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Globe className="w-4 h-4 mr-2" />
            )}
            Continue as Guest
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-8">
            By signing in you agree to our <Link href="/terms" className="underline hover:text-foreground">Terms</Link> & <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
