'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
}

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  signIn: (email: string, password?: string) => Promise<void>;
  signUp: (email: string, name: string, password?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signOut: () => Promise<void>;
  signInAsGuest: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const storedGuest = localStorage.getItem('nexus_is_guest');
    if (storedGuest === 'true' && status === 'unauthenticated') {
      setIsGuest(true);
    }
    if (status !== 'loading') {
      setIsInitialized(true);
    }
  }, [status]);

  useEffect(() => {
    if (isInitialized) {
      if (status === 'authenticated') {
        setIsGuest(false);
        localStorage.removeItem('nexus_is_guest');
      } else if (isGuest) {
        localStorage.setItem('nexus_is_guest', 'true');
      } else {
        localStorage.removeItem('nexus_is_guest');
      }
    }
  }, [status, isGuest, isInitialized]);

  const user: User | null = session?.user ? {
    id: (session.user as any).id || session.user.email || '',
    email: session.user.email || '',
    name: session.user.name || '',
  } : null;

  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';

  const signIn = async (email: string, password?: string) => {
    const result = await nextAuthSignIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      throw new Error(result.error);
    }

    // Force a page refresh to pick up the new session
    router.push('/');
    router.refresh();
  };

  const signUp = async (email: string, name: string, password?: string) => {
    // Sign up uses the same credentials provider - creates session immediately
    const result = await nextAuthSignIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      throw new Error(result.error);
    }

    router.push('/');
    router.refresh();
  };

  const signInWithGoogle = async () => {
    await nextAuthSignIn('google', { callbackUrl: '/' });
  };

  const signInWithGithub = async () => {
    await nextAuthSignIn('github', { callbackUrl: '/' });
  };

  const signOut = async () => {
    const wasGuest = isGuest; // capture guest status before clearing
    setIsGuest(false);
    localStorage.removeItem('nexus_is_guest');
    // If we are signing out from a guest session, clear any local history and gallery data
    if (wasGuest) {
      try {
        const historyKey = `nexus_analysis_history_guest`;
        localStorage.removeItem(historyKey);
        localStorage.removeItem('nexus_image_gallery');
      } catch (e) {
        console.warn('Failed to clear guest data on sign out:', e);
      }
    }
    if (isAuthenticated) {
      await nextAuthSignOut({ callbackUrl: '/login' });
    } else {
      router.push('/login');
    }
  };

  const signInAsGuest = () => {
    setIsGuest(true);
    router.push('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isGuest,
        isLoading,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithGithub,
        signOut,
        signInAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
