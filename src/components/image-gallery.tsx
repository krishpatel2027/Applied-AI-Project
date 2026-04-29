"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Image as ImageIcon,
  Loader2,
  Tag,
  HardDrive,
  CheckCircle2,
  Trash2,
  Plus,
  X,
  UploadCloud,
  AlertTriangle,
  Calendar,
  Eye,
  Cloud,
  CloudOff,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  getGalleryAssets,
  saveGalleryAsset,
  deleteGalleryAsset,
  bulkDeleteGalleryAssets,
  uploadImageToStorage,
  type DbGalleryAsset,
} from "@/lib/supabase-db";

// ─── Types ───────────────────────────────────────────────────────
export interface GalleryAsset {
  id: string;
  url: string;
  filename: string;
  contentType: string;
  caption?: string;
  tags?: string[];
  ocrText?: string;
  uploadedAt: string;
  size: number;
  analysisMode?: string;
  storagePath?: string; // Supabase storage path
}

interface ImageGalleryProps {
  onSelectionChange?: (selectedAssets: GalleryAsset[]) => void;
  userEmail?: string;
}

// ─── localStorage helpers (fallback) ─────────────────────────────
const GALLERY_KEY = "nexus_image_gallery";

function loadGalleryFromStorage(): GalleryAsset[] {
  try {
    const raw = localStorage.getItem(GALLERY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGalleryToStorage(assets: GalleryAsset[]) {
  try {
    const capped = assets.slice(0, 100);
    localStorage.setItem(GALLERY_KEY, JSON.stringify(capped));
  } catch (e) {
    console.warn("Could not save gallery:", e);
  }
}

// ─── Convert DB record to component type ─────────────────────────
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
    storagePath: db.storage_path,
  };
}

// ─── Public helper — add asset (Supabase + localStorage) ─────────
export async function addAssetToGallery(
  asset: GalleryAsset,
  userEmail: string = "guest"
) {
  // 1. Always save to localStorage as instant cache
  const existing = loadGalleryFromStorage();
  const isDuplicate = existing.some(
    (a) =>
      a.filename === asset.filename &&
      Math.abs(
        new Date(a.uploadedAt).getTime() - new Date(asset.uploadedAt).getTime()
      ) < 2000
  );
  if (!isDuplicate) {
    existing.unshift(asset);
    saveGalleryToStorage(existing);
    window.dispatchEvent(new CustomEvent("nexus-gallery-update"));
  }

  // 2. Upload to Supabase if configured
  if (isSupabaseConfigured() && asset.url.startsWith("data:")) {
    try {
      // Convert base64 to Blob
      const response = await fetch(asset.url);
      const blob = await response.blob();

      const storageResult = await uploadImageToStorage(
        blob,
        asset.filename,
        userEmail
      );

      if (storageResult) {
        const dbAsset = await saveGalleryAsset(
          {
            filename: asset.filename,
            contentType: asset.contentType,
            storagePath: storageResult.storagePath,
            publicUrl: storageResult.publicUrl,
            caption: asset.caption,
            tags: asset.tags,
            ocrText: asset.ocrText,
            analysisMode: asset.analysisMode,
            sizeBytes: asset.size,
          },
          userEmail
        );

        if (dbAsset) {
          // Update localStorage entry with Supabase URL + ID
          const updated = loadGalleryFromStorage();
          const idx = updated.findIndex(
            (a) =>
              a.filename === asset.filename &&
              Math.abs(
                new Date(a.uploadedAt).getTime() -
                  new Date(asset.uploadedAt).getTime()
              ) < 2000
          );
          if (idx >= 0) {
            updated[idx].id = dbAsset.id;
            updated[idx].url = dbAsset.public_url;
            updated[idx].storagePath = dbAsset.storage_path;
            saveGalleryToStorage(updated);
          }
          window.dispatchEvent(new CustomEvent("nexus-gallery-update"));
        }
      }
    } catch (err) {
      console.warn("Supabase gallery upload failed (localStorage used):", err);
    }
  }
}

// ─── Component ───────────────────────────────────────────────────
export function ImageGallery({ onSelectionChange, userEmail = "guest" }: ImageGalleryProps) {
  const [assets, setAssets] = useState<GalleryAsset[]>([]);
  const [filterQuery, setFilterQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewAsset, setViewAsset] = useState<GalleryAsset | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load on mount ─────────────────────────────────────────────
  const loadAssets = useCallback(async () => {
    setIsLoading(true);

    // Try Supabase first
    if (isSupabaseConfigured()) {
      try {
        const dbAssets = await getGalleryAssets(userEmail);
        if (dbAssets.length > 0) {
          const mapped = dbAssets.map(dbToGalleryAsset);
          setAssets(mapped);
          setIsCloudConnected(true);
          setIsLoading(false);
          return;
        }
        setIsCloudConnected(true);
      } catch (err) {
        console.warn("Supabase gallery load failed, using localStorage:", err);
        setIsCloudConnected(false);
      }
    }

    // Fallback to localStorage
    setAssets(loadGalleryFromStorage());
    setIsLoading(false);
  }, [userEmail]);

  useEffect(() => {
    setMounted(true);
    loadAssets();

    const onUpdate = () => {
      // Reload from localStorage immediately for responsiveness
      setAssets(loadGalleryFromStorage());
      // Then try Supabase in background
      if (isSupabaseConfigured()) {
        getGalleryAssets(userEmail).then((dbAssets) => {
          if (dbAssets.length > 0) {
            setAssets(dbAssets.map(dbToGalleryAsset));
          }
        }).catch(() => {});
      }
    };

    window.addEventListener("nexus-gallery-update", onUpdate);
    return () => window.removeEventListener("nexus-gallery-update", onUpdate);
  }, [loadAssets, userEmail]);

  // ── Filtering ─────────────────────────────────────────────────
  const filtered = filterQuery.trim()
    ? assets.filter(
        (a) =>
          a.filename.toLowerCase().includes(filterQuery.toLowerCase()) ||
          (a.caption || "").toLowerCase().includes(filterQuery.toLowerCase()) ||
          (a.tags || []).some((t) =>
            t.toLowerCase().includes(filterQuery.toLowerCase())
          )
      )
    : assets;

  // ── Selection ─────────────────────────────────────────────────
  const toggleSelection = (e: React.MouseEvent, asset: GalleryAsset) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(asset.id)) {
      next.delete(asset.id);
    } else {
      if (next.size >= 5) return;
      next.add(asset.id);
    }
    setSelectedIds(next);
    onSelectionChange?.(assets.filter((a) => next.has(a.id)));
  };

  // ── Delete ────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    // Remove from local state + localStorage
    const updated = assets.filter((a) => a.id !== id);
    setAssets(updated);
    saveGalleryToStorage(updated);
    setDeleteConfirm(null);

    const next = new Set(selectedIds);
    next.delete(id);
    setSelectedIds(next);
    onSelectionChange?.(updated.filter((a) => next.has(a.id)));
    if (viewAsset?.id === id) setViewAsset(null);

    // Delete from Supabase
    if (isSupabaseConfigured()) {
      await deleteGalleryAsset(id, userEmail).catch((err) =>
        console.warn("Supabase delete failed:", err)
      );
    }
  };

  // ── Bulk Delete ───────────────────────────────────────────────
  const handleBulkDelete = async () => {
    const idsToDelete = Array.from(selectedIds);
    const updated = assets.filter((a) => !selectedIds.has(a.id));
    setAssets(updated);
    saveGalleryToStorage(updated);
    setSelectedIds(new Set());
    onSelectionChange?.([]);

    if (isSupabaseConfigured()) {
      await bulkDeleteGalleryAssets(idsToDelete, userEmail).catch((err) =>
        console.warn("Supabase bulk delete failed:", err)
      );
    }
  };

  // ── Add images manually ───────────────────────────────────────
  const processFiles = useCallback(
    (files: FileList | File[]) => {
      Array.from(files).forEach((file) => {
        if (!file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const newAsset: GalleryAsset = {
            id:
              Date.now().toString(36) +
              Math.random().toString(36).substring(2, 7),
            url: base64,
            filename: file.name,
            contentType: file.type,
            uploadedAt: new Date().toISOString(),
            size: file.size,
            tags: ["manually-added"],
          };
          addAssetToGallery(newAsset, userEmail);
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
      if (e.dataTransfer.files.length) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  // ── Utilities ─────────────────────────────────────────────────
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  if (!mounted) return null;

  const totalSize = assets.reduce((acc, curr) => acc + (curr.size || 0), 0);

  return (
    <div className="glass-panel rounded-xl p-6 border border-border/40 bg-card/10 backdrop-blur-md">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <ImageIcon className="w-5 h-5 text-primary" />
            </div>
            Image Gallery
            {/* Cloud status indicator */}
            {isCloudConnected ? (
              <Cloud className="w-4 h-4 text-green-400" title="Synced to cloud" />
            ) : (
              <CloudOff className="w-4 h-4 text-muted-foreground/50" title="Local storage only" />
            )}
          </h3>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5" />
              {assets.length} assets ({formatBytes(totalSize)})
            </span>
            {selectedIds.size > 0 && (
              <span className="text-primary font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {selectedIds.size} selected
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Filter by name, tag..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="pl-9 bg-background/50 border-border/50 h-10"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0 border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => setShowAddDialog(true)}
            title="Add images to gallery"
          >
            <Plus className="w-5 h-5" />
          </Button>
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              className="h-10 px-3 shrink-0"
              onClick={handleBulkDelete}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete ({selectedIds.size})
            </Button>
          )}
        </div>
      </div>

      {/* ── Grid ────────────────────────────────────────────────── */}
      <div className="min-h-[160px]">
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((asset, i) => {
                const isSelected = selectedIds.has(asset.id);
                return (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.03 }}
                    className={`group relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border/50 bg-background/40 hover:border-primary/50"
                    }`}
                  >
                    <img
                      src={asset.url}
                      alt={asset.filename}
                      className={`w-full h-full object-cover transition-transform duration-500 ${
                        isSelected ? "scale-105" : "group-hover:scale-110"
                      }`}
                      onClick={() => setViewAsset(asset)}
                    />
                    <div
                      className={`absolute top-2 left-2 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all z-10 ${
                        isSelected
                          ? "bg-primary border-primary text-white scale-110"
                          : "bg-black/40 border-white/40 text-transparent hover:border-white hover:bg-black/60"
                      }`}
                      onClick={(e) => toggleSelection(e, asset)}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div
                      className="absolute top-2 right-2 w-6 h-6 rounded-md bg-red-600/80 border border-red-400/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 hover:bg-red-600 hover:scale-110"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(asset.id);
                      }}
                      title="Delete image"
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 p-3 flex flex-col justify-end pointer-events-none">
                      <p className="text-[10px] text-white font-medium mb-1 line-clamp-2 leading-tight">
                        {asset.caption || asset.filename}
                      </p>
                      <div className="flex items-center gap-1 overflow-hidden mt-1">
                        {asset.tags?.slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[8px] px-1.5 py-0.5 rounded-sm bg-white/20 text-white font-medium truncate"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed border-border/30 rounded-xl bg-muted/5">
            <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
              <ImageIcon className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-sm font-medium">
              {filterQuery ? "No matching images found" : "No images in gallery yet"}
            </p>
            <p className="text-xs opacity-60 max-w-[280px] text-center mt-1">
              {filterQuery
                ? "Try a different search term."
                : "Upload files for analysis and they will automatically appear here, or click the + button to add images manually."}
            </p>
            {!filterQuery && (
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

      {/* ── Add Images Dialog ───────────────────────────────────── */}
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
              isDragOver
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
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
              onChange={(e) => {
                if (e.target.files?.length) processFiles(e.target.files);
              }}
            />
            <UploadCloud
              className={`w-10 h-10 mb-3 ${
                isDragOver ? "text-primary" : "text-muted-foreground"
              }`}
            />
            <p className="text-sm text-foreground/80 font-medium">
              <span className="font-bold text-primary">Click to choose</span> or
              drag & drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG, WEBP, GIF — multiple files supported
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ──────────────────────────── */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <DialogContent className="max-w-sm glass-panel border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete Image?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-2">
            This will permanently remove the image from your gallery
            {isCloudConnected && " and cloud storage"}. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Asset Detail Dialog ─────────────────────────────────── */}
      <Dialog
        open={!!viewAsset}
        onOpenChange={(open) => !open && setViewAsset(null)}
      >
        <DialogContent className="max-w-3xl glass-panel border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Asset Details
            </DialogTitle>
          </DialogHeader>
          {viewAsset && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="rounded-lg overflow-hidden bg-black/20 flex items-center justify-center">
                <img
                  src={viewAsset.url}
                  alt={viewAsset.filename}
                  className="max-h-[300px] object-contain"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Filename
                  </h4>
                  <p className="text-sm font-medium truncate">
                    {viewAsset.filename}
                  </p>
                </div>
                {viewAsset.caption && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Caption
                    </h4>
                    <p className="text-sm leading-relaxed">
                      {viewAsset.caption}
                    </p>
                  </div>
                )}
                {viewAsset.tags && viewAsset.tags.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Tags
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {viewAsset.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {viewAsset.ocrText && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Extracted Text (OCR)
                    </h4>
                    <div className="p-2 rounded-md bg-background/50 border border-border/50 max-h-[100px] overflow-y-auto dark-scroll">
                      <p className="text-xs whitespace-pre-wrap">
                        {viewAsset.ocrText}
                      </p>
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
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => setDeleteConfirm(viewAsset.id)}
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Delete Image
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
