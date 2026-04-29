"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SidebarNav } from "@/components/sidebar-nav";
import { Card, CardContent } from "@/components/ui/card";
import {
  ImageIcon,
  Grid,
  List,
  Search,
  Trash2,
  Plus,
  UploadCloud,
  Eye,
  Calendar,
  Tag,
  Loader2,
  Cloud,
  CloudOff,
  AlertTriangle,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/context/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  getGalleryAssets,
  deleteGalleryAsset,
  uploadImageToStorage,
  saveGalleryAsset,
  type DbGalleryAsset,
} from "@/lib/supabase-db";
import { addAssetToGallery, type GalleryAsset } from "@/components/image-gallery";

// ─── localStorage fallback ───────────────────────────────────────
const GALLERY_KEY = "nexus_image_gallery";

function loadLocalGallery(): GalleryAsset[] {
  try {
    return JSON.parse(localStorage.getItem(GALLERY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocalGallery(assets: GalleryAsset[]) {
  try {
    localStorage.setItem(GALLERY_KEY, JSON.stringify(assets.slice(0, 100)));
  } catch {}
}

function dbToGalleryAsset(db: DbGalleryAsset): GalleryAsset {
  return {
    id: db.id,
    url: db.public_url,
    filename: db.filename,
    contentType: db.content_type,
    caption: db.caption || undefined,
    tags: db.tags || [],
    ocrText: db.ocr_text || undefined,
    uploadedAt: db.created_at,
    size: db.size_bytes,
    analysisMode: db.analysis_mode || undefined,
  };
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export default function GalleryPage() {
  const { user } = useAuth();
  const userEmail = user?.email || "guest";
  const [assets, setAssets] = useState<GalleryAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("all");
  const [viewAsset, setViewAsset] = useState<GalleryAsset | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load assets ───────────────────────────────────────────────
  const loadAssets = useCallback(async () => {
    setIsLoading(true);

    if (isSupabaseConfigured()) {
      try {
        const dbAssets = await getGalleryAssets(userEmail);
        if (dbAssets.length > 0) {
          setAssets(dbAssets.map(dbToGalleryAsset));
          setIsCloudConnected(true);
          setIsLoading(false);
          return;
        }
        setIsCloudConnected(true);
      } catch {
        setIsCloudConnected(false);
      }
    }

    setAssets(loadLocalGallery());
    setIsLoading(false);
  }, [userEmail]);

  useEffect(() => {
    loadAssets();

    const onUpdate = () => {
      setAssets(loadLocalGallery());
      if (isSupabaseConfigured()) {
        getGalleryAssets(userEmail)
          .then((db) => {
            if (db.length > 0) setAssets(db.map(dbToGalleryAsset));
          })
          .catch(() => {});
      }
    };
    window.addEventListener("nexus-gallery-update", onUpdate);
    return () => window.removeEventListener("nexus-gallery-update", onUpdate);
  }, [loadAssets, userEmail]);

  // ── Filtering ─────────────────────────────────────────────────
  let filtered = assets;

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.filename.toLowerCase().includes(q) ||
        (a.caption || "").toLowerCase().includes(q) ||
        (a.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }

  if (activeTab === "images") {
    filtered = filtered.filter((a) => a.contentType.startsWith("image/"));
  } else if (activeTab === "documents") {
    filtered = filtered.filter(
      (a) =>
        a.contentType.includes("pdf") ||
        a.contentType.includes("word") ||
        a.contentType.includes("document")
    );
  }

  // ── Delete ────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    const updated = assets.filter((a) => a.id !== id);
    setAssets(updated);
    saveLocalGallery(updated);
    setDeleteConfirm(null);
    if (viewAsset?.id === id) setViewAsset(null);

    if (isSupabaseConfigured()) {
      await deleteGalleryAsset(id, userEmail).catch(() => {});
    }
  };

  // ── Add images ────────────────────────────────────────────────
  const processFiles = useCallback(
    (files: FileList | File[]) => {
      Array.from(files).forEach((file) => {
        if (!file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          addAssetToGallery(
            {
              id: Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
              url: base64,
              filename: file.name,
              contentType: file.type,
              uploadedAt: new Date().toISOString(),
              size: file.size,
              tags: ["manually-added"],
            },
            userEmail
          );
          // Refresh
          setTimeout(() => setAssets(loadLocalGallery()), 200);
        };
        reader.readAsDataURL(file);
      });
      setShowAddDialog(false);
    },
    [userEmail]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  return (
    <ProtectedRoute>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <SidebarNav />

        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="p-8 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
                  Image Gallery
                </h1>
                <p className="text-muted-foreground text-sm">
                  Explore and manage all analyzed visual assets.
                  {assets.length > 0 && (
                    <span className="ml-1 text-primary font-medium">
                      ({assets.length} total • {formatBytes(assets.reduce((a, c) => a + (c.size || 0), 0))})
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "outline" : "ghost"}
                  size="sm"
                  className={viewMode === "grid" ? "glass-panel border-border/50" : "text-muted-foreground"}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="w-4 h-4 mr-2" /> Grid
                </Button>
                <Button
                  variant={viewMode === "list" ? "outline" : "ghost"}
                  size="sm"
                  className={viewMode === "list" ? "glass-panel border-border/50" : "text-muted-foreground"}
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4 mr-2" /> List
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary/30 text-primary hover:bg-primary/10"
                  onClick={() => setShowAddDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add
                </Button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search gallery..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 glass-panel border-border/50 bg-card/20 h-11"
                />
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList className="glass-panel border-border/50 bg-card/20 h-11">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="images">Images</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 pb-8 dark-scroll">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
              </div>
            ) : filtered.length > 0 ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  <AnimatePresence mode="popLayout">
                    {filtered.map((asset, i) => (
                      <motion.div
                        key={asset.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: i * 0.02 }}
                      >
                        <Card className="group glass-panel border-border/50 overflow-hidden hover:border-primary/50 transition-all cursor-pointer">
                          <div
                            className="aspect-square bg-muted relative overflow-hidden"
                            onClick={() => setViewAsset(asset)}
                          >
                            <img
                              src={asset.url}
                              alt={asset.filename}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            {/* Delete on hover */}
                            <div
                              className="absolute top-2 right-2 w-7 h-7 rounded-md bg-red-600/80 border border-red-400/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 hover:bg-red-600 hover:scale-110"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm(asset.id);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-white" />
                            </div>
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all p-3 flex flex-col justify-end pointer-events-none">
                              <p className="text-[10px] text-white font-medium line-clamp-2">
                                {asset.caption || asset.filename}
                              </p>
                            </div>
                          </div>
                          <CardContent className="p-3">
                            <p className="text-xs font-medium truncate">{asset.filename}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {new Date(asset.uploadedAt).toLocaleDateString()} • {formatBytes(asset.size)}
                            </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                /* List view */
                <div className="space-y-2">
                  {filtered.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center gap-4 p-3 rounded-lg glass-panel border border-border/50 hover:border-primary/30 cursor-pointer transition-colors"
                      onClick={() => setViewAsset(asset)}
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
                        <img src={asset.url} alt={asset.filename} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{asset.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(asset.uploadedAt).toLocaleDateString()} • {formatBytes(asset.size)}
                          {asset.analysisMode && ` • ${asset.analysisMode}`}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {asset.tags?.slice(0, 2).map((tag, idx) => (
                          <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(asset.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed border-border/30 rounded-xl">
                <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-medium">
                  {searchQuery ? "No matching assets found" : "No assets in gallery yet"}
                </p>
                <p className="text-xs opacity-60 mt-1 max-w-xs text-center">
                  {searchQuery
                    ? "Try a different search term or filter."
                    : "Upload images for analysis from the Dashboard, or add them manually."}
                </p>
                {!searchQuery && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 text-primary border-primary/30"
                    onClick={() => setShowAddDialog(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Images
                  </Button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Add Dialog ──────────────────────────────────────────── */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg glass-panel border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Add Images to Gallery
            </DialogTitle>
          </DialogHeader>
          <div
            className={`mt-4 flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
              isDragOver ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => { if (e.target.files?.length) processFiles(e.target.files); }}
            />
            <UploadCloud className={`w-10 h-10 mb-3 ${isDragOver ? "text-primary" : "text-muted-foreground"}`} />
            <p className="text-sm text-foreground/80 font-medium">
              <span className="font-bold text-primary">Click to choose</span> or drag & drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP, GIF — multiple files supported</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ─────────────────────────────────── */}
      <Dialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm glass-panel border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> Delete Image?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-2">
            This will permanently remove the image. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Asset Detail Dialog ─────────────────────────────────── */}
      <Dialog open={!!viewAsset} onOpenChange={(o) => !o && setViewAsset(null)}>
        <DialogContent className="max-w-3xl glass-panel border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" /> Asset Details
            </DialogTitle>
          </DialogHeader>
          {viewAsset && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="rounded-lg overflow-hidden bg-black/20 flex items-center justify-center">
                <img src={viewAsset.url} alt={viewAsset.filename} className="max-h-[300px] object-contain" />
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Filename</h4>
                  <p className="text-sm font-medium truncate">{viewAsset.filename}</p>
                </div>
                {viewAsset.caption && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Caption</h4>
                    <p className="text-sm leading-relaxed">{viewAsset.caption}</p>
                  </div>
                )}
                {viewAsset.tags && viewAsset.tags.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Tags
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {viewAsset.tags.map((tag, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="pt-4 border-t border-border/30 flex justify-between items-center text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(viewAsset.uploadedAt).toLocaleString()}
                  </span>
                  <span>{formatBytes(viewAsset.size)}</span>
                </div>
                <Button variant="destructive" size="sm" className="w-full" onClick={() => setDeleteConfirm(viewAsset.id)}>
                  <Trash2 className="w-4 h-4 mr-1" /> Delete Image
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
