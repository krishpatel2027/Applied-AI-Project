"use client";

import Link from "next/link";
import { Hexagon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  const lastUpdated = "April 25, 2026";

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30 pb-20">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-md">
              <Hexagon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold tracking-tight">NEXUS</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="hidden sm:flex">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-primary hover:bg-primary/90">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-16">
        <div className="mb-12">
          <div className="inline-flex items-center justify-center px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary mb-4 border border-primary/20">
            Legal
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Terms of <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Service</span>
          </h1>
          <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>

        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-primary/20 bg-primary/5 mb-8 text-sm leading-relaxed">
          Welcome to Nexus. By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the Service.
        </div>

        <div className="space-y-6">
          <section className="glass-panel p-6 sm:p-8 rounded-2xl border border-border/50 bg-card/40">
            <h2 className="text-xl font-bold mb-4">1. Use of Service</h2>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                Nexus provides an AI-powered visual analysis and semantic search platform. You agree to use the Service only for lawful purposes and in accordance with these Terms.
              </p>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </p>
            </div>
          </section>

          <section className="glass-panel p-6 sm:p-8 rounded-2xl border border-border/50 bg-card/40">
            <h2 className="text-xl font-bold mb-4">2. User Content</h2>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                Our Service allows you to upload, link, store, and share visual assets. You retain all of your ownership rights in your User Content.
              </p>
              <p>
                By uploading content, you grant Nexus a license to process and analyze that content using our AI infrastructure solely for the purpose of providing the Service back to you. We do not claim ownership of your data.
              </p>
            </div>
          </section>

          <section className="glass-panel p-6 sm:p-8 rounded-2xl border border-border/50 bg-card/40">
            <h2 className="text-xl font-bold mb-4">3. Acceptable Use Policy</h2>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                You must not upload visual assets that contain illegal content, non-consensual explicit imagery, or intellectual property that you do not have the right to use. Nexus reserves the right to terminate accounts that violate this policy without prior notice.
              </p>
            </div>
          </section>

          <section className="glass-panel p-6 sm:p-8 rounded-2xl border border-border/50 bg-card/40">
            <h2 className="text-xl font-bold mb-4">4. Limitation of Liability</h2>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                In no event shall Nexus, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
              </p>
            </div>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-border/50 flex justify-between items-center text-sm text-muted-foreground">
          <p>© 2026 Nexus AI. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
