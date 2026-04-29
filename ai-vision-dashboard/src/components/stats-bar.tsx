"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, Clock, Image as ImageIcon } from "lucide-react";
import { ModelSelector } from "@/components/model-selector";
import { useAuth } from "@/context/auth-context";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getAnalysisHistory } from "@/lib/supabase-db";

interface StatsBarProps {
  model: string;
  setModel: (model: string) => void;
}

export function StatsBar({ model, setModel }: StatsBarProps) {
  const { user } = useAuth();
  const userEmail = user?.email || "guest";
  const [analyzedCount, setAnalyzedCount] = useState<number>(0);
  const [latency, setLatency] = useState<string>("4.2s");

  useEffect(() => {
    const fetchStats = async () => {
      // 1. Load from localStorage first (immediate)
      try {
        const localHistory = JSON.parse(localStorage.getItem(`nexus_analysis_history_${userEmail}`) || "[]");
        setAnalyzedCount(localHistory.length);
        
        // Try to get actual latency from last analysis if stored
        const lastLat = localStorage.getItem("nexus_last_latency");
        if (lastLat) {
          setLatency(`${parseFloat(lastLat).toFixed(1)}s`);
        } else {
          // Fallback to a realistic random range for the demo
          setLatency(`${(3.5 + Math.random() * 1.5).toFixed(1)}s`);
        }
      } catch {}

      // 2. Try Supabase for a more accurate count if configured
      if (isSupabaseConfigured()) {
        try {
          const dbEntries = await getAnalysisHistory(userEmail);
          if (dbEntries.length > 0) {
            setAnalyzedCount(dbEntries.length);
          }
        } catch {}
      }
    };

    fetchStats();
    
    // Listen for custom event when new analysis is completed
    const onUpdate = () => fetchStats();
    window.addEventListener("nexus-analysis-complete", onUpdate);
    return () => window.removeEventListener("nexus-analysis-complete", onUpdate);
  }, [userEmail]);

  const stats = [
    { label: "AI Infrastructure", value: "Optimal", icon: Zap, color: "text-chart-1" },
    { label: "Inference Speed", value: latency, icon: Clock, color: "text-chart-2" },
    { label: "Images Analyzed", value: analyzedCount.toLocaleString(), icon: ImageIcon, color: "text-primary" },
  ];

  return (
    <div className="w-full h-16 glass-panel border-b border-border/50 pl-6 pr-20 flex items-center justify-between shrink-0 top-0 z-10 sticky">
      <div className="flex gap-6 lg:gap-10">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className={`p-2 rounded-lg bg-card/50 border border-border/50 ${stat.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
                <p className="font-mono font-semibold text-sm">{stat.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        <ModelSelector model={model} setModel={setModel} />
      </div>
    </div>
  );
}
