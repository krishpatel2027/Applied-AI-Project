"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { AnalysisMode } from "@/components/image-upload-zone";
import { GalleryAsset } from "@/components/image-gallery";

interface VisionWorkspaceState {
  model: string;
  setModel: (model: string) => void;
  base64File: string | null;
  setBase64File: (file: string | null) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  hasFile: boolean;
  setHasFile: (has: boolean) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  analysis: any;
  setAnalysis: (analysis: any) => void;
  analysisError: string | null;
  setAnalysisError: (error: string | null) => void;
  mode: AnalysisMode;
  setMode: (mode: AnalysisMode) => void;
  selectedGalleryAssets: GalleryAsset[];
  setSelectedGalleryAssets: (assets: GalleryAsset[]) => void;
}

const VisionWorkspaceContext = createContext<VisionWorkspaceState | undefined>(undefined);

export function VisionWorkspaceProvider({ children }: { children: ReactNode }) {
  const [model, setModel] = useState("gemini-2.5-flash");
  const [base64File, setBase64File] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hasFile, setHasFile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [mode, setMode] = useState<AnalysisMode>("summary");
  const [selectedGalleryAssets, setSelectedGalleryAssets] = useState<GalleryAsset[]>([]);

  useEffect(() => {
    const savedModel = localStorage.getItem('nexus_default_model');
    if (savedModel) {
      setModel(savedModel);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('nexus_default_model', model);
  }, [model]);

  return (
    <VisionWorkspaceContext.Provider
      value={{
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
        setSelectedGalleryAssets,
      }}
    >
      {children}
    </VisionWorkspaceContext.Provider>
  );
}

export function useVisionWorkspace() {
  const context = useContext(VisionWorkspaceContext);
  if (context === undefined) {
    throw new Error("useVisionWorkspace must be used within a VisionWorkspaceProvider");
  }
  return context;
}
