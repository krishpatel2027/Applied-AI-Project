"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hexagon, LayoutDashboard, History, Settings, Image as ImageIcon, Globe, LogOut, User, LogIn } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchBar } from "@/components/search-bar";

export function SidebarNav() {
  const pathname = usePathname();
  const { user, isAuthenticated, isGuest, signOut, signInAsGuest } = useAuth();

  const links = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/history", icon: History, label: "Analysis History" },
    { href: "/gallery", icon: ImageIcon, label: "Image Gallery" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="w-20 lg:w-64 h-full glass-panel border-r border-border/50 flex flex-col items-center lg:items-start pt-6 pb-8 transition-all duration-300 z-10 shrink-0">
      <div className="flex items-center gap-3 px-0 lg:px-6 mb-10 text-primary">
        <Hexagon className="w-8 h-8 fill-primary/20 shrink-0" />
        <span className="font-bold text-xl hidden lg:block tracking-wide bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">NEXUS</span>
      </div>

      <div className="w-full px-3 lg:px-4 mb-6">
        <SearchBar />
      </div>

      <nav className="flex-1 w-full px-3 lg:px-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Tooltip key={link.href}>
              <TooltipTrigger>
                <Link 
                  href={link.href}
                  prefetch={true}
                  className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(0,212,255,0.1)]' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="hidden lg:block font-medium text-sm">{link.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="lg:hidden glass-panel border-border/50">
                {link.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div className="mt-auto px-3 lg:px-4 w-full">
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="p-3 rounded-xl bg-card/40 border border-border/50 flex items-center gap-3 w-full cursor-pointer hover:bg-card/60 transition-colors text-left outline-none">
              <Avatar className="w-10 h-10 border border-primary/20">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary/10 text-primary font-mono">
                  {user?.name?.substring(0, 2).toUpperCase() || 'US'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:block overflow-hidden">
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4 text-destructive" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : isGuest ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 w-full cursor-pointer hover:bg-amber-500/20 transition-colors text-left outline-none">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 border border-amber-500/30">
                <Globe className="w-5 h-5" />
              </div>
              <div className="hidden lg:block overflow-hidden">
                <p className="text-sm font-semibold text-amber-500 truncate">Guest Mode</p>
                <p className="text-xs text-amber-500/60 truncate">Limited access</p>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuItem className="cursor-pointer">
                  <Link href="/login" className="flex items-center w-full">
                    <LogIn className="mr-2 h-4 w-4" /> Sign In
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4 text-destructive" /> Exit Guest Mode
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="p-3 rounded-xl bg-card/40 border border-border/50 flex items-center gap-3 w-full opacity-50">
             <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
               <LogIn className="w-5 h-5 text-muted-foreground" />
             </div>
             <div className="hidden lg:block overflow-hidden">
               <p className="text-sm font-semibold truncate">Not Signed In</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
