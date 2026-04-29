"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Hexagon, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsSent(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 font-sans selection:bg-primary/30 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vh] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

      <Link href="/" className="flex items-center gap-3 mb-10 hover:opacity-80 transition-opacity z-10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
          <Hexagon className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-foreground">NEXUS</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md glass-panel p-8 sm:p-10 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-2xl relative z-10"
      >
        {!isSent ? (
          <>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Forgot password?</h2>
            <p className="text-sm text-muted-foreground mb-8">
              Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={handleReset} className="space-y-6">
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

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-medium text-base shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                disabled={isLoading || !email}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send reset link"}
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Check your email</h2>
            <p className="text-sm text-muted-foreground mb-8">
              We sent a password reset link to <br />
              <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center transition-colors">
            {isSent ? "Back to sign in" : (
              <>
                <span className="mr-1 opacity-70">Remembered it?</span> Back to sign in
              </>
            )}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
