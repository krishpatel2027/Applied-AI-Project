"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Activity, Tag, Palette, FileText, Layout, ListChecks, Highlighter, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { ChevronRight, Sparkles, BrainCircuit, Lightbulb, Zap, Maximize2 } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const STUDY_TIPS = [
  "Try teaching what you've learned to someone else.",
  "Break complex topics into smaller, manageable chunks.",
  "Active recall is more effective than passive reading.",
  "Spaced repetition helps long-term retention.",
  "Use mind maps to visualize connections between ideas.",
  "Summarize concepts in your own words.",
  "Test yourself frequently with flashcards.",
  "Visualize the concepts to deepen understanding.",
  "Make connections to things you already know.",
  "Don't be afraid to ask questions and seek clarification.",
];

interface AnalysisCardProps {
  isProcessing: boolean;
  hasImage: boolean;
  analysis?: any;
  error?: string | null;
}

// Local interactive flashcard component
function Flashcard({ question, answer, index }: { question: string, answer: string, index: number }) {
  const [flipped, setFlipped] = useState(false);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative w-full h-[160px] cursor-pointer group perspective"
      onClick={() => setFlipped(!flipped)}
      style={{ perspective: "1000px" }}
    >
      <motion.div
        className="w-full h-full relative preserve-3d duration-500 rounded-xl shadow-sm border"
        initial={false}
        animate={{ rotateX: flipped ? 180 : 0 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front (Question) */}
        <div 
          className="absolute inset-0 backface-hidden w-full h-full flex flex-col items-center justify-center p-6 text-center bg-card rounded-xl border-border"
          style={{ backfaceVisibility: "hidden" }}
        >
          <Lightbulb className="w-6 h-6 text-primary/50 mb-3" />
          <h5 className="font-medium text-foreground text-sm lg:text-base">{question}</h5>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-4 opacity-0 group-hover:opacity-100 transition-opacity">Click to reveal</p>
        </div>
        
        {/* Back (Answer) */}
        <div 
          className="absolute inset-0 backface-hidden w-full h-full flex flex-col items-center justify-center p-6 text-center bg-primary/5 rounded-xl border-primary/20"
          style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}
        >
          <p className="text-sm lg:text-base text-foreground font-medium">{answer}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Hierarchical Mind Map Components
const NODE_COLORS = [
  "bg-blue-500/10 text-blue-500 border-blue-500/30",
  "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  "bg-amber-500/10 text-amber-500 border-amber-500/30",
  "bg-purple-500/10 text-purple-500 border-purple-500/30",
  "bg-rose-500/10 text-rose-500 border-rose-500/30",
];

function MindMapTree({ data, isRoot = false, depth = 0, isExpanded = false }: { data: any, isRoot?: boolean, depth?: number, isExpanded?: boolean }) {
  if (!data || !data.node) return null;

  const colorClass = isRoot 
    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-bold" 
    : `${NODE_COLORS[depth % NODE_COLORS.length]} hover:bg-background/80 transition-colors`;

  const nodeShape = data.node.type === 'concept' ? 'rounded-2xl' : 'rounded-lg';
  const nodePadding = isExpanded 
    ? (isRoot ? "px-6 py-4 text-lg" : "px-5 py-3 text-sm") 
    : (isRoot ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs");
    
  const branchWidth = isExpanded ? "w-10" : "w-4 sm:w-6";
  const verticalSpacing = isExpanded ? "my-4" : "my-2";

  return (
    <div className="flex items-center">
      {/* Node */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: depth * 0.1 }}
        className={`relative z-10 border shadow-sm max-w-[150px] sm:max-w-[250px] text-wrap text-center leading-tight ${nodeShape} ${colorClass} ${nodePadding}`}
      >
        {data.node.label}
      </motion.div>

      {/* Children */}
      {data.children && data.children.length > 0 && (
        <div className="relative flex flex-col ml-4 sm:ml-8 py-2">
          {/* Connector from Parent to Spine */}
          <div className="absolute top-1/2 -left-4 sm:-left-8 w-4 sm:w-8 h-[2px] bg-border/80 -translate-y-1/2 z-0" />
          
          {/* Vertical Spine */}
          <div className="absolute top-0 bottom-0 left-0 w-[2px] bg-border/80 z-0 rounded-full" />
          
          {data.children.map((child: any, i: number) => (
            <div key={i} className={`relative flex items-center z-10 ${verticalSpacing}`}>
              {/* Flex-based Connector from Spine to Child to prevent overlaps */}
              <div className="flex items-center">
                <div className={`${branchWidth} h-[2px] bg-border/80`} />
                {child.edge.relationship && (
                  <div className={`bg-card px-2 py-0.5 text-[8px] sm:text-[9px] uppercase tracking-wider font-semibold text-muted-foreground text-wrap text-center max-w-[80px] sm:max-w-[120px] leading-[1.1] border border-border/50 rounded-lg shadow-sm ${isExpanded ? 'p-1.5' : ''}`}>
                    {child.edge.relationship}
                  </div>
                )}
                <div className={`${branchWidth} h-[2px] bg-border/80`} />
              </div>
              
              {/* Recursive Child Render */}
              <MindMapTree data={child.tree} depth={depth + 1} isExpanded={isExpanded} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MindMapVisualizer({ nodes, edges, isExpanded = false }: { nodes: any[], edges: any[], isExpanded?: boolean }) {
  // 1. Calculate incoming edges to find the root(s)
  const inDegree = new Map<string, number>();
  nodes.forEach(n => inDegree.set(n.id, 0));
  edges.forEach(e => {
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
  });

  // 2. Identify roots (nodes with 0 incoming edges)
  let roots = nodes.filter(n => inDegree.get(n.id) === 0);
  
  // Fallback if there are cycles and no clear root: pick node with highest out-degree
  if (roots.length === 0 && nodes.length > 0) {
    const outDegree = new Map<string, number>();
    edges.forEach(e => outDegree.set(e.source, (outDegree.get(e.source) || 0) + 1));
    const sorted = [...nodes].sort((a, b) => (outDegree.get(b.id) || 0) - (outDegree.get(a.id) || 0));
    roots = [sorted[0]];
  }

  // 3. Build recursive tree structure
  const visited = new Set<string>();

  const buildTree = (node: any): any => {
    // Prevent infinite cycles
    if (visited.has(node.id)) return null;
    visited.add(node.id);

    const childEdges = edges.filter(e => e.source === node.id);
    const children = childEdges.map(edge => {
      const targetNode = nodes.find(n => n.id === edge.target);
      if (!targetNode) return null;
      
      const childTree = buildTree(targetNode);
      if (!childTree) return null;
      
      return { edge, tree: childTree };
    }).filter(Boolean);

    return { node, children };
  };

  const trees = roots.map(r => buildTree(r)).filter(Boolean);

  if (trees.length === 0) {
    return (
      <div className="flex flex-wrap gap-2 p-4 bg-muted/20 rounded-xl">
        {nodes.map((node: any, i: number) => (
          <Badge key={i} variant={node.type === 'concept' ? 'default' : 'secondary'} className="px-3 py-1">
            {node.label}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <div className={`w-full overflow-x-auto overflow-y-hidden bg-muted/10 rounded-xl border border-border/50 ${isExpanded ? 'p-8' : 'p-3 sm:p-5'}`}>
      <div className={`flex flex-col min-w-max ${isExpanded ? 'gap-16' : 'gap-8'}`}>
        {trees.map((tree, i) => (
          <MindMapTree key={i} data={tree} isRoot={true} isExpanded={isExpanded} />
        ))}
      </div>
    </div>
  );
}

export function AnalysisCard({ isProcessing, hasImage, analysis, error }: AnalysisCardProps) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProcessing) {
      interval = setInterval(() => {
        setTipIndex((prev) => (prev + 1) % STUDY_TIPS.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  if (!hasImage) {
    return (
      <div className="glass-panel rounded-xl p-8 flex flex-col items-center justify-center h-full min-h-[300px] text-center opacity-50">
        <Activity className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Awaiting Data</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs">Upload a file to start real-time analysis</p>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="glass-panel rounded-xl p-6 h-full min-h-[300px] flex flex-col space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-1/3 bg-primary/20" />
          <Skeleton className="h-4 w-full bg-muted" />
          <Skeleton className="h-4 w-5/6 bg-muted" />
        </div>
        <Separator className="bg-border/50" />
        <div className="space-y-3">
          <Skeleton className="h-5 w-1/4 bg-muted" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-6 w-16 bg-muted rounded-full" />
            ))}
          </div>
        </div>
        <div className="mt-auto pt-4 border-t border-border/50 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={tipIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-xs italic text-muted-foreground font-medium"
            >
              💡 Study Tip: {STUDY_TIPS[tipIndex]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel rounded-xl p-8 flex flex-col items-center justify-center h-full min-h-[300px] text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <Info className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-lg font-medium text-destructive mb-2">Analysis Failed</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{error}</p>
        <p className="text-xs text-muted-foreground mt-3">Try uploading a different file or check your API configuration.</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="glass-panel rounded-xl p-6 h-full min-h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground">Ready for analysis...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-xl p-6 h-full min-h-[300px]"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold font-mono text-primary flex items-center gap-2 mb-2">
          <Activity className="w-5 h-5" /> Analysis Result
        </h3>
      </div>

      <Separator className="bg-border/50 mb-6" />

      <div className="space-y-6">
        {/* Summary Mode */}
        {analysis.summary && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <h4 className="text-sm font-semibold flex items-center gap-2 text-primary uppercase tracking-wider">
              <FileText className="w-4 h-4" /> Executive Summary
            </h4>
            <div className="relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-primary/20 rounded-full" />
              <div className="pl-6 py-2">
                <div className="w-full text-sm md:text-base text-muted-foreground leading-relaxed break-words">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-2" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-2" {...props} />,
                      li: ({node, ...props}) => <li className="pl-1" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-semibold text-foreground" {...props} />,
                      h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-3 mt-6 text-foreground first:mt-0" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-3 mt-5 text-foreground first:mt-0" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-base font-bold mb-2 mt-4 text-foreground first:mt-0" {...props} />,
                      h4: ({node, ...props}) => <h4 className="text-sm font-bold mb-2 mt-4 text-foreground first:mt-0" {...props} />,
                      a: ({node, ...props}) => <a className="text-primary hover:underline hover:text-primary/80 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                      blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-primary/50 pl-4 py-1 my-4 italic bg-muted/30 rounded-r-lg" {...props} />,
                      code: ({node, inline, ...props}: any) => 
                        inline ? (
                          <code className="bg-primary/10 text-primary rounded px-1.5 py-0.5 font-mono text-sm" {...props} />
                        ) : (
                          <div className="bg-muted border border-border/50 rounded-lg p-4 my-4 overflow-x-auto">
                            <code className="font-mono text-sm text-foreground/90" {...props} />
                          </div>
                        ),
                      table: ({node, ...props}) => (
                        <div className="overflow-x-auto mb-4 border border-border/50 rounded-lg">
                          <table className="w-full text-sm text-left" {...props} />
                        </div>
                      ),
                      thead: ({node, ...props}) => <thead className="text-xs uppercase bg-muted/50" {...props} />,
                      th: ({node, ...props}) => <th className="px-4 py-3 font-medium text-foreground" {...props} />,
                      td: ({node, ...props}) => <td className="px-4 py-3 border-t border-border/50" {...props} />,
                    }}
                  >
                    {analysis.summary}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Flashcards Mode */}
        {analysis.flashcards && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <h4 className="text-sm font-semibold flex items-center gap-2 text-primary uppercase tracking-wider">
              <Layout className="w-4 h-4" /> Study Flashcards
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.flashcards.map((card: any, i: number) => (
                <Flashcard key={i} question={card.question} answer={card.answer} index={i} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Mind Map Mode */}
        {analysis.nodes && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-primary uppercase tracking-wider">
                <BrainCircuit className="w-4 h-4" /> Concept Relationships Map
              </h4>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
                    <Maximize2 className="w-3 h-3" /> Expand Map
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-[95vw] w-[95vw] h-[95vh] flex flex-col p-6 overflow-hidden">
                  <DialogTitle className="text-lg flex items-center gap-2 mb-2 text-primary">
                    <BrainCircuit className="w-5 h-5" /> Expanded Concept Relationships
                  </DialogTitle>
                  <div className="flex-1 w-full h-full overflow-auto bg-muted/10 rounded-xl border border-border/50 flex items-center justify-center p-8">
                    <div className="scale-75 md:scale-90 lg:scale-100 origin-center min-w-max flex items-center justify-center">
                      <MindMapVisualizer nodes={analysis.nodes} edges={analysis.edges || []} isExpanded={true} />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="relative group">
              <MindMapVisualizer nodes={analysis.nodes} edges={analysis.edges || []} />
            </div>
          </motion.div>
        )}

        {/* Highlights Mode */}
        {analysis.highlights && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="space-y-5"
          >
            <h4 className="text-sm font-semibold flex items-center gap-2 text-primary uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Key Highlights
            </h4>
            <div className="grid gap-3">
              {analysis.highlights.map((highlight: string, i: number) => (
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  key={i} 
                  className="flex gap-4 p-4 rounded-xl bg-card border shadow-sm group hover:border-primary/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed pt-1">
                    {highlight}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Fallback for original Image Analysis (Legacy support) */}
        {!analysis.summary && !analysis.flashcards && !analysis.nodes && !analysis.highlights && (
          <>
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2 text-foreground/80">
                <Tag className="w-4 h-4 text-secondary-foreground" /> Detected Features
              </h4>
              <div className="flex flex-wrap gap-2">
                {(analysis.tags || analysis.objects_detected || []).map((tag: string, i: number) => (
                  <Badge key={i} variant="secondary" className="bg-secondary/20 hover:bg-secondary/30 transition-colors font-mono font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2 text-foreground/80">
                <Palette className="w-4 h-4 text-chart-1" /> Dominant Colors
              </h4>
              <div className="flex gap-3">
                {analysis.colors?.map((color: string, i: number) => (
                  <div 
                    key={i} 
                    className="w-8 h-8 rounded-full border border-border shadow-sm" 
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
