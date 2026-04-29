"use client";

import { useState, useRef } from "react";
import { SidebarNav } from "@/components/sidebar-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Settings, User, Bell, Shield, Cpu, Zap, LogOut, Key, MonitorSmartphone, Smartphone, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useSettings } from "@/context/settings-context";

import { ProtectedRoute } from "@/components/auth/protected-route";

type TabType = "profile" | "notifications" | "security" | "aimodels";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const { user } = useAuth();
  
  const {
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
    apiUsageCount
  } = useSettings();

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Modals state
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isPwdModalOpen, setIsPwdModalOpen] = useState(false);

  const userName = user?.name || "Krish Patel";
  const userEmail = user?.email || "patelkrish2031@gmail.com";
  const initials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const usagePercent = Math.min((apiUsageCount / 1000) * 100, 100);

  return (
    <ProtectedRoute>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <SidebarNav />

        <main className="flex-1 flex flex-col h-full overflow-y-auto p-4 lg:p-8 dark-scroll">
          <div className="max-w-5xl mx-auto w-full space-y-8 pb-12">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
                <Settings className="w-8 h-8 text-primary" />
                Settings
              </h1>
              <p className="text-muted-foreground text-sm">Manage your account preferences and application configuration.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
              {/* Sidebar Navigation */}
              <div className="w-full md:w-64 space-y-1 shrink-0">
                <Button 
                  variant="ghost" 
                  onClick={() => setActiveTab("profile")}
                  className={`w-full justify-start ${activeTab === "profile" ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
                >
                  <User className="w-4 h-4 mr-2" /> Profile
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setActiveTab("notifications")}
                  className={`w-full justify-start ${activeTab === "notifications" ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
                >
                  <Bell className="w-4 h-4 mr-2" /> Notifications
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setActiveTab("security")}
                  className={`w-full justify-start ${activeTab === "security" ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
                >
                  <Shield className="w-4 h-4 mr-2" /> Security
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setActiveTab("aimodels")}
                  className={`w-full justify-start ${activeTab === "aimodels" ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
                >
                  <Cpu className="w-4 h-4 mr-2" /> AI Models
                </Button>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 space-y-6 min-w-0">
                
                {/* ---------------- PROFILE TAB ---------------- */}
                {activeTab === "profile" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="glass-panel border-border/50 bg-card/20">
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                           <User className="w-5 h-5 text-primary" /> Personal Information
                        </CardTitle>
                        <CardDescription>Update your personal details and public profile.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center gap-6">
                          <Avatar className="w-20 h-20 border-2 border-primary/20">
                            <AvatarImage src={avatarDataUrl || ""} />
                            <AvatarFallback className="text-xl bg-primary/10 text-primary">{initials}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-1.5">
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              onChange={handleAvatarChange} 
                              accept="image/*" 
                              className="hidden" 
                            />
                            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                              Change Avatar
                            </Button>
                            <p className="text-xs text-muted-foreground">JPG, GIF or PNG. Max size 2MB.</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input defaultValue={userName} className="bg-background/50" />
                          </div>
                          <div className="space-y-2">
                            <Label>Email Address</Label>
                            <Input defaultValue={userEmail} disabled className="bg-background/50 opacity-70" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="glass-panel border-border/50 bg-card/20 overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                         <Zap className="w-32 h-32 text-primary" />
                      </div>
                      <CardHeader>
                        <CardTitle className="text-xl">Subscription & Usage</CardTitle>
                        <CardDescription>Manage your plan and monitor API usage.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6 relative z-10">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-background/40 border border-border/50">
                           <div className="space-y-1">
                             <div className="flex items-center gap-2">
                               <span className="font-semibold text-lg">Pro Tier</span>
                               <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-0">Active</Badge>
                             </div>
                             <p className="text-sm text-muted-foreground">Unlimited vision analyses & premium models.</p>
                           </div>
                           <Button variant="outline" onClick={() => setIsSubModalOpen(true)}>Manage Subscription</Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="glass-panel border-border/50 bg-card/20">
                      <CardHeader>
                        <CardTitle className="text-xl">General Preferences</CardTitle>
                        <CardDescription>Configure the basic behavior of the Vision Dashboard.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Dark Mode</Label>
                            <p className="text-xs text-muted-foreground">Switch between light and dark themes.</p>
                          </div>
                          <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Auto-Analysis Action</Label>
                            <p className="text-xs text-muted-foreground">Choose whether to automatically start analysis after upload.</p>
                          </div>
                          <div className="flex gap-2 bg-background/50 p-1 rounded-md border border-border/50">
                            <Button 
                              variant={autoAnalysis ? "default" : "ghost"} 
                              size="sm" 
                              onClick={() => setAutoAnalysis(true)}
                              className={autoAnalysis ? "" : "text-muted-foreground"}
                            >
                              Auto Analyse
                            </Button>
                            <Button 
                              variant={!autoAnalysis ? "default" : "ghost"} 
                              size="sm" 
                              onClick={() => setAutoAnalysis(false)}
                              className={!autoAnalysis ? "" : "text-muted-foreground"}
                            >
                              Manual
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ---------------- NOTIFICATIONS TAB ---------------- */}
                {activeTab === "notifications" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="glass-panel border-border/50 bg-card/20">
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                           <Bell className="w-5 h-5 text-primary" /> Email Notifications
                        </CardTitle>
                        <CardDescription>Control what emails you receive from Nexus.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Analysis Complete</Label>
                            <p className="text-xs text-muted-foreground">Receive an email when a long-running batch analysis finishes.</p>
                          </div>
                          <Switch checked={emailAnalysisComplete} onCheckedChange={setEmailAnalysisComplete} />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Weekly Usage Summary</Label>
                            <p className="text-xs text-muted-foreground">A weekly digest of your API usage and workspace statistics.</p>
                          </div>
                          <Switch checked={emailWeeklySummary} onCheckedChange={setEmailWeeklySummary} />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Security Alerts</Label>
                            <p className="text-xs text-muted-foreground">Get notified about new logins and sensitive account changes.</p>
                          </div>
                          <Switch checked={emailSecurityAlerts} onCheckedChange={setEmailSecurityAlerts} />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="glass-panel border-border/50 bg-card/20">
                      <CardHeader>
                        <CardTitle className="text-xl">Push & Marketing</CardTitle>
                        <CardDescription>Manage desktop alerts and promotional content.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Desktop Notifications</Label>
                            <p className="text-xs text-muted-foreground">Show native browser notifications for real-time alerts.</p>
                          </div>
                          <Switch checked={pushDesktop} onCheckedChange={setPushDesktop} />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Marketing & Features</Label>
                            <p className="text-xs text-muted-foreground">Receive emails about new models, features, and tips.</p>
                          </div>
                          <Switch checked={pushMarketing} onCheckedChange={setPushMarketing} />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ---------------- SECURITY TAB ---------------- */}
                {activeTab === "security" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="glass-panel border-border/50 bg-card/20 border-red-500/20">
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                           <Shield className="w-5 h-5 text-red-400" /> Account Security
                        </CardTitle>
                        <CardDescription>Protect your account with advanced security measures.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <Label className="text-sm font-medium">Two-Factor Authentication (2FA)</Label>
                              {twoFactorEnabled ? (
                                <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10">Enabled</Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">Disabled</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">Add an extra layer of security using an authenticator app.</p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                          >
                            {twoFactorEnabled ? "Disable" : "Enable"}
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Password Reset</Label>
                            <p className="text-xs text-muted-foreground">Change your current password.</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setIsPwdModalOpen(true)}>Update Password</Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="glass-panel border-border/50 bg-card/20">
                      <CardHeader>
                        <CardTitle className="text-xl">Active Sessions</CardTitle>
                        <CardDescription>Manage devices currently logged into your account.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {activeSessions.length === 0 ? (
                           <p className="text-sm text-muted-foreground">No active sessions found.</p>
                        ) : (
                          activeSessions.map((session) => (
                            <div key={session.id} className={`flex items-center justify-between p-4 rounded-lg border ${session.isCurrent ? 'bg-background/50 border-border/50' : 'bg-background/30 border-border/30'}`}>
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${session.isCurrent ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                  {session.device.includes("iPhone") || session.device.includes("Mobile") ? (
                                    <Smartphone className="w-5 h-5" />
                                  ) : (
                                    <MonitorSmartphone className="w-5 h-5" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium flex items-center gap-2">
                                    {session.device} - {session.browser} 
                                    {session.isCurrent && <Badge className="bg-primary/20 text-primary border-0 text-[10px] h-4">Current</Badge>}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{session.location} • {session.lastActive}</p>
                                </div>
                              </div>
                              {!session.isCurrent && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => revokeSession(session.id)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                >
                                  Revoke
                                </Button>
                              )}
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>

                    <Card className="glass-panel border-border/50 bg-card/20">
                      <CardHeader>
                        <CardTitle className="text-xl">Data Privacy</CardTitle>
                        <CardDescription>Control how your data is used within Nexus.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Allow Data for Training</Label>
                            <p className="text-xs text-muted-foreground">Opt-in to allow anonymized images to train future Nexus models.</p>
                          </div>
                          <Switch checked={dataPrivacyEnabled} onCheckedChange={setDataPrivacyEnabled} />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ---------------- AI MODELS TAB ---------------- */}
                {activeTab === "aimodels" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="glass-panel border-border/50 bg-card/20">
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                           <Cpu className="w-5 h-5 text-indigo-400" /> Default Model Selection
                        </CardTitle>
                        <CardDescription>Select the core intelligence engines for different application tasks.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Vision & Analysis Engine</Label>
                            <Select defaultValue="gemini-2.5-flash">
                              <SelectTrigger className="glass-panel border-border/50 bg-background/50">
                                <SelectValue placeholder="Select model" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</SelectItem>
                                <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (Highest Quality)</SelectItem>
                                <SelectItem value="gpt-4o">OpenAI GPT-4o</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">Used for image ingestion and detailed analysis.</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Chat & Reasoning Engine</Label>
                            <Select defaultValue="gemini-2.5-flash">
                              <SelectTrigger className="glass-panel border-border/50 bg-background/50">
                                <SelectValue placeholder="Select model" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</SelectItem>
                                <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                                <SelectItem value="gpt-4o">OpenAI GPT-4o</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">Used for the interactive sidebar chat.</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="glass-panel border-border/50 bg-card/20 overflow-hidden relative">
                       <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                         <Key className="w-32 h-32 text-amber-500" />
                      </div>
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                           <Key className="w-5 h-5 text-amber-500" /> API Key Overrides & Usage
                        </CardTitle>
                        <CardDescription>Provide your own API keys to bypass rate limits.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6 relative z-10">
                        <div className="space-y-2 mb-6">
                           <div className="flex justify-between text-sm">
                             <span>Custom API Key Estimated Usage</span>
                             <span className="text-muted-foreground">{apiUsageCount} / 1000 limit</span>
                           </div>
                           <div className="h-2 w-full bg-background/50 rounded-full overflow-hidden">
                             <div className={`h-full rounded-full ${usagePercent > 90 ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${usagePercent}%` }}></div>
                           </div>
                           {usagePercent > 90 && <p className="text-xs text-red-400 mt-1">Warning: Your custom API usage is approaching your defined budget limit.</p>}
                        </div>

                        <div className="space-y-2">
                          <Label>OpenAI API Key (Optional Override)</Label>
                          <div className="flex gap-2">
                            <Input 
                              type="password" 
                              placeholder="sk-..." 
                              className="bg-background/50 font-mono" 
                              value={openaiKey}
                              onChange={(e) => setOpenaiKey(e.target.value)}
                            />
                            <Button variant="secondary" onClick={() => setOpenaiKey("")}>Clear</Button>
                          </div>
                          {openaiKey && <p className="text-xs text-emerald-400">Custom OpenAI key active.</p>}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <Dialog open={isSubModalOpen} onOpenChange={setIsSubModalOpen}>
        <DialogContent className="glass-panel border-border/50">
          <DialogHeader>
            <DialogTitle>Manage Subscription</DialogTitle>
            <DialogDescription>
              Your Pro Tier is currently active and renews on May 1st, 2026.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-background/50 rounded-lg border border-border/50 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Current Plan</span>
                <Badge>Pro Tier</Badge>
              </div>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Billing Cycle</span>
                <span>Monthly ($49.00)</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubModalOpen(false)}>Close</Button>
            <Button variant="destructive" onClick={() => setIsSubModalOpen(false)}>Cancel Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPwdModalOpen} onOpenChange={setIsPwdModalOpen}>
        <DialogContent className="glass-panel border-border/50">
          <DialogHeader>
            <DialogTitle>Update Password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new secure password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input type="password" />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input type="password" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPwdModalOpen(false)}>Cancel</Button>
            <Button onClick={() => setIsPwdModalOpen(false)}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
