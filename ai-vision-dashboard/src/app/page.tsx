"use client";

import { useState, useEffect, Suspense } from "react";
import { SidebarNav } from "@/components/sidebar-nav";
import { StatsBar } from "@/components/stats-bar";
import { ImageUploadZone, AnalysisMode } from "@/components/image-upload-zone";
import { AiChatPanel } from "@/components/ai-chat-panel";
import { AnalysisCard } from "@/components/analysis-card";
import { ImageGallery, GalleryAsset, addAssetToGallery } from "@/components/image-gallery";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/context/auth-context";
import { useVisionWorkspace } from "@/context/vision-workspace-context";
import { useSettings } from "@/context/settings-context";
import { saveAnalysisHistory } from "@/lib/supabase-db";

// History entry stored in localStorage for quick recent access
export interface HistoryEntry {
  id: string;
  fileName: string;
  fileType: string;
  mode: AnalysisMode;
  model: string;
  analysis: any;
  timestamp: string; // ISO string
  preview?: string; // Blob URL
}

function saveToHistory(entry: HistoryEntry, userEmail: string = 'guest') {
  try {
    const key = `nexus_analysis_history_${userEmail}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]') as HistoryEntry[];
    // Keep last 50 entries, newest first
    existing.unshift(entry);
    if (existing.length > 50) existing.length = 50;
    localStorage.setItem(key, JSON.stringify(existing));
  } catch (e) {
    console.warn('Could not save history:', e);
  }
}

export default function Dashboard() {
  const { user } = useAuth();
  const userEmail = user?.email || 'guest';
  const [mounted, setMounted] = useState(false);
  
  const {
    model,
    setModel,
    base64File,
    setBase64File,
    selectedFile,
    setSelectedFile,
    hasFile,
    setHasFile,
    isProcessing,
    setIsProcessing,
    analysis,
    setAnalysis,
    analysisError,
    setAnalysisError,
    mode,
    setMode,
    selectedGalleryAssets,
    setSelectedGalleryAssets
  } = useVisionWorkspace();

  const { autoAnalysis, openaiKey, anthropicKey, incrementApiUsage } = useSettings();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFileSelect = (base64: string | null, file: File | null) => {
    setBase64File(base64);
    setSelectedFile(file);
    setAnalysis(null);
    setAnalysisError(null);
    setHasFile(!!file);

    if (!file) {
      setIsProcessing(false);
      setAnalysis(null);
      setHasFile(false);
    } else {
      // Auto analysis feature integration
      if (autoAnalysis) {
        // Must wait for state update to settle, then analyze
        setTimeout(() => handleAnalyze(file), 0);
      }
    }
  };

  const handleAnalyze = async (overrideFile?: File) => {
    const targetFile = overrideFile || selectedFile;
    if (!targetFile) return;

    setIsProcessing(true);
    setAnalysis(null);
    setAnalysisError(null);

    try {
      const formData = new FormData();
      formData.append('file', targetFile);
      
      // 1. Upload to Blob & Pinecone (Data Layer Ingestion)
      console.log("Ingesting asset to Vercel Blob & Pinecone...");
      let blobUrl = undefined;
      try {
         const uploadRes = await fetch('/api/upload', {
           method: 'POST',
           body: formData
         });
         if (uploadRes.ok) {
           const uploadData = await uploadRes.json();
           blobUrl = uploadData.url;
         } else {
           console.warn("Upload to blob failed, proceeding with analysis anyway.", await uploadRes.text());
         }
      } catch (uploadErr) {
         console.warn("Upload to blob failed", uploadErr);
      }

      // 2. Perform Analysis
      formData.append('mode', mode);
      formData.append('model', model);
      
      // Pass custom API keys in headers
      const headers: Record<string, string> = {};
      if (openaiKey) {
        headers['x-custom-openai-key'] = openaiKey;
        incrementApiUsage();
      }
      if (anthropicKey) {
        headers['x-custom-anthropic-key'] = anthropicKey;
        incrementApiUsage();
      }

      const analysisStartTime = Date.now();
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers,
        body: formData
      });
      const analysisDuration = (Date.now() - analysisStartTime) / 1000;
      localStorage.setItem("nexus_last_latency", analysisDuration.toString());

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Analysis failed (${res.status})`);
      }

      const data = await res.json();
      setAnalysis(data);

      const entryId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      const timestamp = new Date().toISOString();

      // Save to local history for quick access
      const entry: HistoryEntry = {
        id: entryId,
        fileName: targetFile.name,
        fileType: targetFile.type,
        mode,
        model,
        analysis: data,
        timestamp,
        preview: blobUrl || (base64File ? base64File.substring(0, 500) + '...' : undefined),
      };
      saveToHistory(entry, userEmail);

      // Save to Supabase history (non-blocking)
      saveAnalysisHistory(
        {
          fileName: targetFile.name,
          fileType: targetFile.type,
          mode,
          model,
          analysis: data,
          previewUrl: blobUrl || undefined,
        },
        userEmail
      ).catch((err) => console.warn('Supabase history save failed:', err));

      // Auto-add image files to the gallery
      if (targetFile.type.startsWith('image/') && base64File) {
        addAssetToGallery(
          {
            id: entryId,
            url: base64File,
            filename: targetFile.name,
            contentType: targetFile.type,
            caption: data.summary || undefined,
            tags: data.tags || [mode],
            uploadedAt: timestamp,
            size: targetFile.size,
            analysisMode: mode,
          },
          userEmail
        );
      }

      // Notify other components that analysis is complete
      window.dispatchEvent(new CustomEvent("nexus-analysis-complete"));
    } catch (e: any) {
      console.error("Analysis error:", e);
      setAnalysisError(e.message || "Analysis failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex h-screen w-full bg-background items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-primary/20" />
          </div>
          <p className="text-muted-foreground text-xs font-mono animate-pulse uppercase tracking-widest">Initializing Nexus...</p>
        </div>
      </div>
    );
  }

  // If user selected items from gallery, we pass those URLs. 
  // Otherwise we pass the currently uploaded file in base64.
  const chatImages = selectedGalleryAssets.length > 0 
    ? selectedGalleryAssets.map(a => a.url) 
    : (base64File ? [base64File] : []);


  return (
    <ProtectedRoute>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <SidebarNav />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/20 blur-[120px] pointer-events-none" />

          <StatsBar model={model} setModel={setModel} />

          <div className="flex-1 overflow-y-auto dark-scroll p-4 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-1">Vision Workspace</h1>
                <p className="text-muted-foreground text-sm">Upload files for real-time multimodal analysis using {model === 'gpt-4o' ? 'GPT-4o' : model.includes('gemini') ? 'Gemini' : model}.</p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 min-h-[500px]">
                <div className="xl:col-span-2 flex flex-col gap-6">
                  <div className="shrink-0">
                    <ImageUploadZone 
                      onFileSelect={handleFileSelect}
                      onAnalyze={() => handleAnalyze()}
                      isProcessing={isProcessing} 
                      selectedMode={mode}
                      onModeChange={setMode}
                      hasFile={hasFile}
                    />
                  </div>
                  
                  <div className="flex-1 min-h-0">
                    <AnalysisCard 
                      isProcessing={isProcessing} 
                      hasImage={hasFile} 
                      analysis={analysis}
                      error={analysisError}
                    />
                  </div>
                </div>

                <div className="xl:col-span-1 h-full min-h-[400px]">
                  <AiChatPanel images={chatImages} model={model} analysis={analysis} />
                </div>
              </div>

              <div className="mt-8 pb-10">
                <ImageGallery onSelectionChange={setSelectedGalleryAssets} userEmail={userEmail} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
