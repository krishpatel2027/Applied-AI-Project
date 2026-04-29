"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isGuest, isLoading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for NextAuth session to finish loading
    if (isLoading) return;

    const timer = setTimeout(() => {
      if (!isAuthenticated && !isGuest) {
        router.push("/login");
      } else {
        setIsChecking(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isGuest, isLoading, router]);

  if (isLoading || isChecking || (!isAuthenticated && !isGuest)) {
    return (
      <div className="flex h-screen w-full bg-background items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
          <p className="text-muted-foreground text-xs font-mono animate-pulse uppercase tracking-widest">Verifying Access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
