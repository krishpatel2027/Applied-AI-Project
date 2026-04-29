import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/auth-context";
import { AuthModal } from "@/components/auth/auth-modal";
import { NextAuthProvider } from "@/components/auth/next-auth-provider";
import { VisionWorkspaceProvider } from "@/context/vision-workspace-context";
import { SettingsProvider } from "@/context/settings-context";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Vision Dashboard",
  description: "Premium AI Image Analysis & Chat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NextAuthProvider>
          <TooltipProvider>
            <AuthProvider>
              <SettingsProvider>
                <VisionWorkspaceProvider>
                  {children}
                </VisionWorkspaceProvider>
              </SettingsProvider>
            </AuthProvider>
          </TooltipProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
