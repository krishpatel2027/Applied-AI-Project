"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Hexagon, 
  Sparkles, 
  Zap, 
  BrainCircuit, 
  Layers, 
  Layout, 
  Highlighter, 
  ArrowRight,
  Shield,
  Zap as ZapIcon,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MarketingPage() {
  return (
    <div className="min-h-screen w-full bg-background font-sans selection:bg-primary/30 overflow-x-hidden">
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[150px]" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-500/5 blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-border/50 bg-background/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <Hexagon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">NEXUS</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-primary transition-colors">How it Works</Link>
            <Link href="/login" className="hover:text-primary transition-colors">Sign In</Link>
          </div>
          <Link href="/signup">
            <Button className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20">
              Get Started Free
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary tracking-widest uppercase mb-6">
              <Sparkles className="w-3 h-3" /> The Future of Learning
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 text-white leading-[1.1]">
              Analyze anything, <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-blue-500">
                instantly visual.
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed">
              Nexus is the ultimate AI-powered visual workspace. Transform lecture slides, PDFs, and complex diagrams into interactive mind maps, flashcards, and summaries in seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button className="h-14 px-10 text-lg font-bold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-xl shadow-primary/25 transition-all hover:scale-105 active:scale-95">
                  Launch Workspace <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" className="h-14 px-8 text-lg font-semibold hover:bg-white/5 transition-colors">
                  Continue as Guest
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Hero Image Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-20 relative max-w-5xl mx-auto"
          >
            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-[3rem] -z-10" />
            <div className="glass-panel border-border/50 p-2 rounded-[2rem] shadow-2xl bg-card/20 backdrop-blur-2xl">
              <div className="rounded-[1.5rem] overflow-hidden border border-border/30 aspect-video bg-background flex items-center justify-center relative">
                 <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5" />
                 <BrainCircuit className="w-20 h-20 text-primary opacity-20 animate-pulse" />
                 {/* Decorative UI elements */}
                 <div className="absolute top-8 left-8 w-48 h-32 glass-panel border-primary/30 p-4 rounded-xl flex flex-col justify-between">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                       <Layout className="w-5 h-5 text-primary" />
                    </div>
                    <div className="space-y-2">
                       <div className="h-2 w-full bg-primary/20 rounded-full" />
                       <div className="h-2 w-2/3 bg-primary/10 rounded-full" />
                    </div>
                 </div>
                 <div className="absolute bottom-12 right-12 w-64 h-48 glass-panel border-purple-500/30 p-6 rounded-2xl">
                    <div className="flex gap-2 mb-4">
                       <div className="w-3 h-3 rounded-full bg-red-500/50" />
                       <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                       <div className="w-3 h-3 rounded-full bg-green-500/50" />
                    </div>
                    <div className="space-y-3">
                       <div className="h-3 w-full bg-white/10 rounded-full" />
                       <div className="h-3 w-full bg-white/10 rounded-full" />
                       <div className="h-3 w-4/5 bg-white/5 rounded-full" />
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white">One Workspace. Infinite Possibilities.</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">Everything you need to master complex visual information, powered by multimodal AI.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                title: "Smart Summaries", 
                desc: "Extract the core essence of any document or image with high-fidelity summaries.", 
                icon: Layout, 
                color: "text-blue-400", 
                bg: "bg-blue-500/10" 
              },
              { 
                title: "Dynamic Mind Maps", 
                desc: "Visualize relationships and hierarchy automatically from your uploaded assets.", 
                icon: BrainCircuit, 
                color: "text-purple-400", 
                bg: "bg-purple-500/10" 
              },
              { 
                title: "Flashcard Creator", 
                desc: "Generate study sets instantly. Perfect for exam prep and long-term retention.", 
                icon: Layers, 
                color: "text-amber-400", 
                bg: "bg-amber-500/10" 
              },
              { 
                title: "Semantic Highlights", 
                desc: "Never miss a key point again. Nexus identifies the most critical data for you.", 
                icon: Highlighter, 
                color: "text-primary", 
                bg: "bg-primary/10" 
              }
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel border-border/50 p-8 rounded-3xl hover:border-primary/50 hover:bg-card/30 transition-all group"
              >
                <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-card/20 border-y border-border/30 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2">
              <span className="text-primary font-bold tracking-widest uppercase text-xs mb-4 block">The Process</span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-8 text-white">Three steps to <br />total clarity.</h2>
              
              <div className="space-y-8">
                {[
                  { step: "01", title: "Upload Assets", desc: "Drag and drop images, PDFs, or PPTX slides directly into your workspace." },
                  { step: "02", title: "Select Mode", desc: "Choose between Summary, Mind Map, Flashcards, or Highlights based on your goal." },
                  { step: "03", title: "Instant Analysis", desc: "Our multimodal engine processes the data and generates professional insights." }
                ].map((item) => (
                  <div key={item.step} className="flex gap-6">
                    <span className="text-4xl font-black text-primary/20">{item.step}</span>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">{item.title}</h4>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="lg:w-1/2 w-full">
              <div className="aspect-square glass-panel border-border/50 rounded-[3rem] p-8 relative flex items-center justify-center">
                 <div className="absolute inset-0 bg-primary/5 rounded-[3rem]" />
                 <div className="grid grid-cols-2 gap-4 w-full h-full">
                    <div className="rounded-2xl border border-border/50 bg-background/50 p-6 flex flex-col items-center justify-center text-center">
                       <ZapIcon className="w-8 h-8 text-primary mb-3" />
                       <span className="text-xs font-bold text-muted-foreground">Real-time</span>
                    </div>
                    <div className="rounded-2xl border border-border/50 bg-background/50 p-6 flex flex-col items-center justify-center text-center">
                       <Shield className="w-8 h-8 text-blue-400 mb-3" />
                       <span className="text-xs font-bold text-muted-foreground">Secure</span>
                    </div>
                    <div className="rounded-2xl border border-border/50 bg-background/50 p-6 flex flex-col items-center justify-center text-center">
                       <Globe className="w-8 h-8 text-green-400 mb-3" />
                       <span className="text-xs font-bold text-muted-foreground">Global</span>
                    </div>
                    <div className="rounded-2xl border border-border/50 bg-background/50 p-6 flex flex-col items-center justify-center text-center">
                       <Sparkles className="w-8 h-8 text-purple-400 mb-3" />
                       <span className="text-xs font-bold text-muted-foreground">AI Powered</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-border/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <Hexagon className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold tracking-tight text-white">NEXUS</span>
          </div>
          <p className="text-muted-foreground text-sm">© 2026 Nexus AI Vision. Built for the students of tomorrow.</p>
          <div className="flex gap-6">
            <Link href="#" className="text-muted-foreground hover:text-white transition-colors text-sm">Privacy</Link>
            <Link href="#" className="text-muted-foreground hover:text-white transition-colors text-sm">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
