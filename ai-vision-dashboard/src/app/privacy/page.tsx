"use client";

import Link from "next/link";
import { Hexagon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
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
            Privacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Policy</span>
          </h1>
          <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>

        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-primary/20 bg-primary/5 mb-8 text-sm leading-relaxed">
          At Nexus, your privacy is important to us. This policy explains what personal information we collect, how we use it, and the choices you have. We are committed to handling your data responsibly and transparently, especially concerning your uploaded visual assets and AI processing.
        </div>

        <div className="space-y-6">
          <section className="glass-panel p-6 sm:p-8 rounded-2xl border border-border/50 bg-card/40">
            <h2 className="text-xl font-bold mb-4">1. Information We Collect</h2>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                We collect information you provide when creating an account (name, email address), content you upload (images, documents, visual assets), and usage data (features used, AI models queried) to improve the Service. 
              </p>
              <p>
                If you sign in with Google, we receive your Google profile information as permitted by your Google account settings.
              </p>
            </div>
          </section>

          <section className="glass-panel p-6 sm:p-8 rounded-2xl border border-border/50 bg-card/40">
            <h2 className="text-xl font-bold mb-4">2. How We Use Your Information</h2>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                We use your information to provide and improve the Service, authenticate your account, and process uploaded content with AI to generate summaries, semantic tags, and visual insights.
              </p>
              <p>
                Your visual assets are processed by our trusted AI partners (such as OpenAI and Google) solely for the purpose of fulfilling your specific analysis requests. We do not use your personal images to train our own foundational AI models.
              </p>
            </div>
          </section>

          <section className="glass-panel p-6 sm:p-8 rounded-2xl border border-border/50 bg-card/40">
            <h2 className="text-xl font-bold mb-4">3. Data Storage and Security</h2>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                Your uploaded assets are stored securely in cloud storage infrastructure (e.g., Vercel Blob). Metadata and semantic embeddings are stored securely in vector databases (e.g., Pinecone). We employ industry-standard security measures to protect your data from unauthorized access.
              </p>
            </div>
          </section>

          <section className="glass-panel p-6 sm:p-8 rounded-2xl border border-border/50 bg-card/40">
            <h2 className="text-xl font-bold mb-4">4. Your Choices</h2>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                You can delete your account and all associated visual assets at any time via your account settings. Upon deletion, your images and metadata will be permanently removed from our active servers and vector databases.
              </p>
            </div>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-border/50 flex justify-between items-center text-sm text-muted-foreground">
          <p>© 2026 Nexus AI. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
