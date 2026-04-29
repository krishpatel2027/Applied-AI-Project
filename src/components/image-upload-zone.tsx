"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileImage, X, Loader2, FileText, FileArchive, ListChecks, Layers, Layout, Highlighter, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";

export type AnalysisMode = 'summary' | 'flashcards' | 'mindmap' | 'highlights';

interface ImageUploadZoneProps {
  onFileSelect: (base64File: string | null, file: File | null) => void;
  onAnalyze: () => void;
  isProcessing?: boolean;
  selectedMode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
  hasFile: boolean;
}

export function ImageUploadZone({ 
  onFileSelect, 
  onAnalyze,
  isProcessing = false, 
  selectedMode,
  onModeChange,
  hasFile
}: ImageUploadZoneProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [isReading, setIsReading] = useState<boolean>(false);
  const [readProgress, setReadProgress] = useState<number>(0);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
    return `${size} ${sizes[i]}`;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    setFileName(file.name);
    setFileSize(formatBytes(file.size));
    setPageCount(null);

    const extractMetadata = async () => {
      if (file.type === 'application/pdf') {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const uint8 = new Uint8Array(arrayBuffer);
          const chunkSize = 8192;
          let dataString = '';
          for (let i = 0; i < uint8.length; i += chunkSize) {
            const slice = uint8.subarray(i, Math.min(i + chunkSize, uint8.length));
            dataString += String.fromCharCode.apply(null, Array.from(slice));
          }
          const matches = dataString.match(/\/Page\b/g);
          const pages = matches ? matches.length : 0;
          setPageCount(pages);
        } catch (err) {
          console.warn('Could not extract PDF metadata:', err);
        }
      }
    };
    
    await extractMetadata();

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      setIsReading(true);
      setReadProgress(0);
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setReadProgress(percent);
        }
      };
      
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreview(base64);
        setIsReading(false);
        setReadProgress(0);
        onFileSelect(base64, file);
      };
      
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
      onFileSelect(null, file);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif', '.svg'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    },
    maxFiles: 1,
    maxSize: 25 * 1024 * 1024, // 25MB
  });

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setFileName(null);
    setFileSize(null);
    setPageCount(null);
    onFileSelect(null, null);
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
            Select Output Mode
          </label>
          <Select value={selectedMode} onValueChange={(value: AnalysisMode) => onModeChange(value)}>
            <SelectTrigger className="w-full glass-panel">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">
                <div className="flex items-center gap-2">
                  <ListChecks className="w-4 h-4" /> Summary
                </div>
              </SelectItem>
              <SelectItem value="flashcards">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Flashcards
                </div>
              </SelectItem>
              <SelectItem value="mindmap">
                <div className="flex items-center gap-2">
                  <Layout className="w-4 h-4" /> Mind Map
                </div>
              </SelectItem>
              <SelectItem value="highlights">
                <div className="flex items-center gap-2">
                  <Highlighter className="w-4 h-4" /> Highlights
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!fileName ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full"
          >
            <div
              {...getRootProps()}
              className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-colors glass-panel ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 glass-panel-hover'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                <UploadCloud className={`w-12 h-12 mb-4 transition-colors ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="mb-2 text-sm text-foreground/80 font-medium">
                  <span className="font-bold text-primary">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, PNG, JPG, WEBP, PPTX, or DOCX (MAX. 25MB)
                </p>
                {isReading && (
                  <div className="flex items-center gap-2 mt-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-xs text-primary">Reading file... {readProgress}%</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full h-64 rounded-xl overflow-hidden glass-panel group flex items-center justify-center bg-muted/20"
          >
            {preview ? (
              <img 
                src={preview} 
                alt="Preview" 
                className={`object-contain w-full h-full transition-all duration-500 ${isProcessing ? 'blur-sm scale-105' : ''}`}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                {fileName?.endsWith('.pdf') ? <FileText className="w-12 h-12" /> :
                 fileName?.endsWith('.pptx') ? <FileArchive className="w-12 h-12" /> :
                 <FileImage className="w-12 h-12" />}
                <span className="text-sm font-medium text-center px-4 truncate max-w-full">{fileName}</span>
                {fileSize && (
                  <span className="text-xs text-muted-foreground">{fileSize}{pageCount !== null ? ` • ${pageCount} pages` : ''}</span>
                )}
              </div>
            )}
            
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2 text-primary">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="font-medium text-sm">Analyzing Vision Data...</span>
                </div>
              </div>
            )}
            
            {!isProcessing && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={clearFile}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background/90 to-transparent flex items-center gap-2">
              <FileImage className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono truncate text-primary-foreground">Ready for analysis</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analyze Button — only show when a file is selected but not yet processing */}
      {hasFile && !isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
            onClick={onAnalyze}
          >
            <Zap className="w-5 h-5 mr-2" />
            Analyze Now
          </Button>
        </motion.div>
      )}
    </div>
  );
}
