"use client";

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getUserSettings, updateUserSettings } from "@/lib/supabase-db";

export type Session = {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
};

interface SettingsState {
  // Profile
  avatarDataUrl: string | null;
  setAvatarDataUrl: (url: string | null) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  autoAnalysis: boolean;
  setAutoAnalysis: (auto: boolean) => void;

  // Notifications
  emailAnalysisComplete: boolean;
  setEmailAnalysisComplete: (val: boolean) => void;
  emailWeeklySummary: boolean;
  setEmailWeeklySummary: (val: boolean) => void;
  emailSecurityAlerts: boolean;
  setEmailSecurityAlerts: (val: boolean) => void;
  pushDesktop: boolean;
  setPushDesktop: (val: boolean) => void;
  pushMarketing: boolean;
  setPushMarketing: (val: boolean) => void;

  // Security
  twoFactorEnabled: boolean;
  setTwoFactorEnabled: (val: boolean) => void;
  dataPrivacyEnabled: boolean;
  setDataPrivacyEnabled: (val: boolean) => void;
  activeSessions: Session[];
  revokeSession: (id: string) => void;

  // AI Models
  openaiKey: string;
  setOpenaiKey: (key: string) => void;
  anthropicKey: string;
  setAnthropicKey: (key: string) => void;
  apiUsageCount: number;
  incrementApiUsage: () => void;
}

const SettingsContext = createContext<SettingsState | undefined>(undefined);

const defaultSessions: Session[] = [
  { id: "1", device: "Windows PC", browser: "Chrome", location: "San Francisco, CA", lastActive: "Active now", isCurrent: true },
  { id: "2", device: "iPhone 14 Pro", browser: "Safari", location: "San Francisco, CA", lastActive: "Last active 2h ago", isCurrent: false },
];

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('guest');
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [autoAnalysis, setAutoAnalysis] = useState(true);

  const [emailAnalysisComplete, setEmailAnalysisComplete] = useState(true);
  const [emailWeeklySummary, setEmailWeeklySummary] = useState(false);
  const [emailSecurityAlerts, setEmailSecurityAlerts] = useState(true);
  const [pushDesktop, setPushDesktop] = useState(true);
  const [pushMarketing, setPushMarketing] = useState(false);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [dataPrivacyEnabled, setDataPrivacyEnabled] = useState(false);
  const [activeSessions, setActiveSessions] = useState<Session[]>(defaultSessions);

  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [apiUsageCount, setApiUsageCount] = useState(420);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("nexus_user_settings");
      if (stored) {
        const p = JSON.parse(stored);
        if (p.avatarDataUrl !== undefined) setAvatarDataUrl(p.avatarDataUrl);
        if (p.darkMode !== undefined) setDarkMode(p.darkMode);
        if (p.autoAnalysis !== undefined) setAutoAnalysis(p.autoAnalysis);
        
        if (p.emailAnalysisComplete !== undefined) setEmailAnalysisComplete(p.emailAnalysisComplete);
        if (p.emailWeeklySummary !== undefined) setEmailWeeklySummary(p.emailWeeklySummary);
        if (p.emailSecurityAlerts !== undefined) setEmailSecurityAlerts(p.emailSecurityAlerts);
        if (p.pushDesktop !== undefined) setPushDesktop(p.pushDesktop);
        if (p.pushMarketing !== undefined) setPushMarketing(p.pushMarketing);

        if (p.twoFactorEnabled !== undefined) setTwoFactorEnabled(p.twoFactorEnabled);
        if (p.dataPrivacyEnabled !== undefined) setDataPrivacyEnabled(p.dataPrivacyEnabled);
        if (p.activeSessions !== undefined) setActiveSessions(p.activeSessions);

        if (p.openaiKey !== undefined) setOpenaiKey(p.openaiKey);
        if (p.anthropicKey !== undefined) setAnthropicKey(p.anthropicKey);
        if (p.apiUsageCount !== undefined) setApiUsageCount(p.apiUsageCount);
      }
    } catch (e) {
      console.error("Failed to parse settings", e);
    }
    setIsLoaded(true);

    // Try loading from Supabase in background
    if (isSupabaseConfigured()) {
      // Get user email from NextAuth session (check localStorage for guest status)
      const email = 'guest'; // Will be updated by auth context effect
      getUserSettings(email).then((dbSettings) => {
        if (dbSettings) {
          if (dbSettings.dark_mode !== undefined) setDarkMode(dbSettings.dark_mode);
          if (dbSettings.auto_analysis !== undefined) setAutoAnalysis(dbSettings.auto_analysis);
          if (dbSettings.avatar_url) setAvatarDataUrl(dbSettings.avatar_url);
          if (dbSettings.email_analysis_complete !== undefined) setEmailAnalysisComplete(dbSettings.email_analysis_complete);
          if (dbSettings.email_weekly_summary !== undefined) setEmailWeeklySummary(dbSettings.email_weekly_summary);
          if (dbSettings.email_security_alerts !== undefined) setEmailSecurityAlerts(dbSettings.email_security_alerts);
          if (dbSettings.push_desktop !== undefined) setPushDesktop(dbSettings.push_desktop);
          if (dbSettings.push_marketing !== undefined) setPushMarketing(dbSettings.push_marketing);
          if (dbSettings.two_factor_enabled !== undefined) setTwoFactorEnabled(dbSettings.two_factor_enabled);
          if (dbSettings.data_privacy_enabled !== undefined) setDataPrivacyEnabled(dbSettings.data_privacy_enabled);
          if (dbSettings.api_usage_count !== undefined) setApiUsageCount(dbSettings.api_usage_count);
          // Don't load encrypted keys back to client for security
        }
      }).catch((err) => console.warn('Supabase settings load failed:', err));
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (!isLoaded) return;
    const settings = {
      avatarDataUrl, darkMode, autoAnalysis,
      emailAnalysisComplete, emailWeeklySummary, emailSecurityAlerts, pushDesktop, pushMarketing,
      twoFactorEnabled, dataPrivacyEnabled, activeSessions,
      openaiKey, anthropicKey, apiUsageCount
    };
    localStorage.setItem("nexus_user_settings", JSON.stringify(settings));

    // Handle Document dark mode
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Debounced save to Supabase
    if (isSupabaseConfigured()) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        updateUserSettings(userEmail, {
          dark_mode: darkMode,
          auto_analysis: autoAnalysis,
          avatar_url: avatarDataUrl,
          email_analysis_complete: emailAnalysisComplete,
          email_weekly_summary: emailWeeklySummary,
          email_security_alerts: emailSecurityAlerts,
          push_desktop: pushDesktop,
          push_marketing: pushMarketing,
          two_factor_enabled: twoFactorEnabled,
          data_privacy_enabled: dataPrivacyEnabled,
          api_usage_count: apiUsageCount,
        }).catch((err) => console.warn('Supabase settings save failed:', err));
      }, 1000);
    }
  }, [
    isLoaded, avatarDataUrl, darkMode, autoAnalysis,
    emailAnalysisComplete, emailWeeklySummary, emailSecurityAlerts, pushDesktop, pushMarketing,
    twoFactorEnabled, dataPrivacyEnabled, activeSessions,
    openaiKey, anthropicKey, apiUsageCount
  ]);

  const revokeSession = (id: string) => {
    setActiveSessions(prev => prev.filter(s => s.id !== id));
  };

  const incrementApiUsage = () => {
    setApiUsageCount(prev => prev + 1);
  };

  return (
    <SettingsContext.Provider
      value={{
        avatarDataUrl, setAvatarDataUrl,
        darkMode, setDarkMode,
        autoAnalysis, setAutoAnalysis,
        emailAnalysisComplete, setEmailAnalysisComplete,
        emailWeeklySummary, setEmailWeeklySummary,
        emailSecurityAlerts, setEmailSecurityAlerts,
        pushDesktop, setPushDesktop,
        pushMarketing, setPushMarketing,
        twoFactorEnabled, setTwoFactorEnabled,
        dataPrivacyEnabled, setDataPrivacyEnabled,
        activeSessions, revokeSession,
        openaiKey, setOpenaiKey,
        anthropicKey, setAnthropicKey,
        apiUsageCount, incrementApiUsage
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
