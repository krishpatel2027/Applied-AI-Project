"use client";

import { useState, useEffect } from "react";
import { SidebarNav } from "@/components/sidebar-nav";
import { History, Search, Trash2, FileImage, FileText, Clock, Eye, ListChecks, Cloud, CloudOff, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/context/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import { isSupabaseConfigured } from "@/lib/supabase";
import { MindMapVisualizer } from "@/components/analysis-card";
import {
  getAnalysisHistory,
  deleteAnalysisEntry,
  clearAnalysisHistory,
  type DbAnalysisHistory,
} from "@/lib/supabase-db";


interface HistoryEntry {
  id: string;
  fileName: string;
  fileType: string;
  mode: string;
  model: string;
  timestamp: string;
  analysis: any;
}

const modeIcons: Record<string, any> = {
  summary: ListChecks,
  flashcards: ListChecks,
  mindmap: ListChecks,
  highlights: ListChecks,
};

const modeLabels: Record<string, string> = {
  summary: "Summary",
  flashcards: "Flashcards",
  mindmap: "Mindmap",
  highlights: "Highlights",
};

const formatRelativeTime = (timestamp: string) => {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

// ── localStorage helpers (fallback) ──────────────────────────────
function loadHistoryFromStorage(userEmail: string): HistoryEntry[] {
  try {
    const key = `nexus_analysis_history_${userEmail}`;
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    return data.map((d: any) => ({
      ...d,
      timestamp: d.timestamp || new Date(d.timestamp).toISOString(),
    }));
  } catch {
    return [];
  }
}

function saveHistoryToStorage(entries: HistoryEntry[], userEmail: string) {
  try {
    const key = `nexus_analysis_history_${userEmail}`;
    localStorage.setItem(key, JSON.stringify(entries));
  } catch {}
}

function dbToHistoryEntry(db: DbAnalysisHistory): HistoryEntry {
  return {
    id: db.id,
    fileName: db.file_name,
    fileType: db.file_type,
    mode: db.mode,
    model: db.model,
    timestamp: db.created_at,
    analysis: db.analysis,
  };
}

export default function HistoryPage() {
  const { user } = useAuth();
  const userEmail = user?.email || "guest";
  const [mounted, setMounted] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(false);

  // ── Load history ──────────────────────────────────────────────
  const loadHistory = async () => {
    setIsLoading(true);

    // Try Supabase first
    if (isSupabaseConfigured()) {
      try {
        const dbEntries = await getAnalysisHistory(userEmail);
        if (dbEntries.length > 0) {
          setHistory(dbEntries.map(dbToHistoryEntry));
          setIsCloudConnected(true);
          setIsLoading(false);
          return;
        }
        setIsCloudConnected(true);
      } catch (err) {
        console.log("Supabase history load failed, using localStorage:", err);
        setIsCloudConnected(false);
      }
    }

    // Fallback to localStorage
    setHistory(loadHistoryFromStorage(userEmail));
    setIsLoading(false);
  };

  useEffect(() => {
    setMounted(true);
    loadHistory();
  }, [user]);

  // ── Delete ────────────────────────────────────────────────────
  const handleDeleteEntry = async (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    saveHistoryToStorage(updated, userEmail);

    if (isSupabaseConfigured()) {
      await deleteAnalysisEntry(id, userEmail).catch((err) =>
        console.warn("Supabase delete failed:", err)
      );
    }
  };

  // ── Clear All ─────────────────────────────────────────────────
  const handleClearAll = async () => {
    setHistory([]);
    saveHistoryToStorage([], userEmail);

    if (isSupabaseConfigured()) {
      await clearAnalysisHistory(userEmail).catch((err) =>
        console.warn("Supabase clear failed:", err)
      );
    }
  };

  const filteredHistory = history.filter(
    (h) =>
      h.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.mode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!mounted) return null;

  return (
    <ProtectedRoute>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <SidebarNav />

        <main className="flex-1 flex flex-col h-full overflow-hidden p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
                <History className="w-8 h-8 text-primary" />
                Analysis History
              </h1>
              <p className="text-muted-foreground text-sm">
                Review and revisit all your previous vision intelligence sessions.
                {history.length > 0 && (
                  <span className="ml-1 text-primary font-medium">
                    ({history.length} total)
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="glass-panel border-border/50 text-destructive hover:text-destructive"
                  onClick={handleClearAll}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Clear All
                </Button>
              )}
            </div>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search your analysis history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 glass-panel border-border/50 bg-card/20 h-12"
            />
          </div>

          <div className="flex-1 overflow-y-auto dark-scroll pr-2 space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <History className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium mb-1">
                  {history.length === 0
                    ? "No analysis history yet"
                    : "No results found"}
                </p>
                <p className="text-sm">
                  {history.length === 0
                    ? 'Upload a file and click "Analyze Now" to create your first entry.'
                    : "Try a different search term."}
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {filteredHistory.map((entry, i) => {
                  const ModeIcon = modeIcons[entry.mode] || ListChecks;
                  const isExpanded = expandedId === entry.id;

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Card className="glass-panel border-border/50 bg-card/20 hover:border-primary/30 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              {entry.fileType?.startsWith("image/") ? (
                                <FileImage className="w-6 h-6 text-primary" />
                              ) : (
                                <FileText className="w-6 h-6 text-primary" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="text-sm font-semibold truncate">
                                  {entry.fileName}
                                </h3>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatRelativeTime(entry.timestamp)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                  <ModeIcon className="w-3 h-3" />
                                  {modeLabels[entry.mode] || entry.mode}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {entry.model}
                                </span>
                              </div>

                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="mt-4 p-4 rounded-lg bg-background/50 border border-border/30 text-sm">
                                      {entry.mode === "summary" &&
                                        entry.analysis?.summary && (
                                          <p className="whitespace-pre-wrap leading-relaxed">
                                            {entry.analysis.summary}
                                          </p>
                                        )}
                                      {entry.mode === "flashcards" &&
                                        entry.analysis?.flashcards && (
                                          <div className="space-y-3">
                                            {entry.analysis.flashcards.map(
                                              (card: any, idx: number) => (
                                                <div
                                                  key={idx}
                                                  className="p-3 rounded-md bg-primary/5 border border-primary/10"
                                                >
                                                  <p className="text-xs text-primary font-semibold mb-1">
                                                    Q: {card.question}
                                                  </p>
                                                  <p className="text-xs text-muted-foreground">
                                                    A: {card.answer}
                                                  </p>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        )}
                                      {entry.mode === "mindmap" &&
                                        entry.analysis?.nodes && (
                                          <div className="bg-background rounded-lg p-2 border border-border/50">
                                            <MindMapVisualizer 
                                              nodes={entry.analysis.nodes} 
                                              edges={entry.analysis.edges} 
                                              isExpanded={true}
                                            />
                                          </div>
                                        )}
                                      {entry.mode === "highlights" &&
                                        entry.analysis?.highlights && (
                                          <ul className="list-disc list-inside space-y-1">
                                            {entry.analysis.highlights.map(
                                              (h: string, idx: number) => (
                                                <li
                                                  key={idx}
                                                  className="text-xs"
                                                >
                                                  {h}
                                                </li>
                                              )
                                            )}
                                          </ul>
                                        )}
                                      {!entry.analysis?.summary &&
                                        !entry.analysis?.flashcards &&
                                        !entry.analysis?.nodes &&
                                        !entry.analysis?.highlights && (
                                          <pre className="whitespace-pre-wrap text-xs">
                                            {JSON.stringify(
                                              entry.analysis,
                                              null,
                                              2
                                            )}
                                          </pre>
                                        )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                onClick={() =>
                                  setExpandedId(isExpanded ? null : entry.id)
                                }
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteEntry(entry.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
