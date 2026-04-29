"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Sparkles, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/context/settings-context";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AiChatPanelProps {
  images: string[];
  model: string;
  analysis?: any;
}

export function AiChatPanel({ images, model, analysis }: AiChatPanelProps) {
  const [input, setInput] = useState("");
  
  const { openaiKey, anthropicKey, incrementApiUsage } = useSettings();
  
  const customHeaders: Record<string, string> = {};
  if (openaiKey) {
    customHeaders['x-custom-openai-key'] = openaiKey;
  }
  if (anthropicKey) {
    customHeaders['x-custom-anthropic-key'] = anthropicKey;
  }

  const { messages, sendMessage, status } = useChat({
    api: '/api/chat',
    headers: customHeaders,
    body: { model, analysisData: analysis },
    onFinish: () => {
      if (openaiKey || anthropicKey) {
        incrementApiUsage();
      }
    }
  });
  
  const isLoading = status === 'streaming' || status === 'submitted';
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = (input || "").trim();
    if (!trimmedInput && images.length === 0) return;

    const messageText = trimmedInput || (images.length > 1 ? `Analyze and compare these ${images.length} images in detail.` : "Analyze this image in detail.");
    
    const currentInput = input;
    setInput("");

    try {
      // Build files array if we have images and this is the first message
      if (images.length > 0 && messages.length === 0) {
        await sendMessage({
          text: messageText,
          files: images.map(url => ({
            type: 'file' as const,
            mediaType: url.startsWith('data:') ? (url.split(';')[0].split(':')[1] || 'image/png') : 'image/jpeg',
            url: url,
          })),
        });
      } else {
        await sendMessage({ text: messageText });
      }
    } catch (error) {
      console.error("Chat error:", error);
      setInput(currentInput);
    }
  };

  // Helper to extract display text from a message's parts array
  const getMessageText = (m: any): string => {
    if (m.parts && Array.isArray(m.parts)) {
      return m.parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('');
    }
    // Fallback for string content (shouldn't happen with new SDK but just in case)
    if (typeof m.content === 'string') return m.content;
    return '';
  };

  // Helper to check if message has a file/image part
  const getMessageFiles = (m: any): any[] => {
    if (m.parts && Array.isArray(m.parts)) {
      return m.parts.filter((p: any) => p.type === 'file');
    }
    return [];
  };

  return (
    <div className="flex flex-col h-full w-full glass-panel rounded-xl overflow-hidden border border-border/50 shadow-lg">
      <div className="p-4 border-b border-border/50 bg-card/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm tracking-wide">Vision Assistant</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{model}</p>
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="flex flex-col gap-6 pb-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-2">
                <Bot className="w-8 h-8 text-muted-foreground opacity-50" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Hello! I'm your Vision AI.</p>
                <p className="text-xs text-muted-foreground max-w-[200px]">
                  Upload an image and ask me anything, or just type a question to get started.
                </p>
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((m: any) => {
                const text = getMessageText(m);
                const files = getMessageFiles(m);
                
                return (
                  <motion.div 
                    key={m.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className="w-8 h-8 shrink-0 border border-border/50">
                      {m.role === 'user' ? (
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">YOU</AvatarFallback>
                      ) : (
                        <AvatarFallback className="bg-accent/10 text-accent-foreground text-[10px] font-bold">AI</AvatarFallback>
                      )}
                    </Avatar>
                    
                    <div className={`rounded-2xl px-4 py-2.5 max-w-[85%] text-sm leading-relaxed shadow-sm ${
                      m.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-tr-none' 
                        : 'bg-muted/80 border border-border/30 rounded-tl-none'
                    }`}>
                      {/* Render file attachments */}
                      {files.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {files.map((file: any, idx: number) => (
                            <div key={idx} className="relative rounded-md overflow-hidden border border-white/20 shadow-sm w-16 h-16 shrink-0 group bg-black/20">
                              <img 
                                src={file.url} 
                                alt="Attached" 
                                className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Render text with Markdown */}
                      <div className="w-full break-words">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
                            li: ({node, ...props}) => <li className="" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-semibold text-foreground" {...props} />,
                            h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2 mt-3 text-primary" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2 mt-3 text-primary" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-1 mt-2 text-primary" {...props} />,
                            a: ({node, ...props}) => <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                            code: ({node, inline, ...props}: any) => 
                              inline ? (
                                <code className="bg-primary/10 text-primary rounded px-1.5 py-0.5 font-mono text-xs" {...props} />
                              ) : (
                                <div className="bg-muted border border-border/50 rounded-lg p-3 my-3 overflow-x-auto">
                                  <code className="font-mono text-xs text-foreground/90" {...props} />
                                </div>
                              ),
                            table: ({node, ...props}) => (
                              <div className="overflow-x-auto mb-3 border border-border/50 rounded-lg">
                                <table className="w-full text-sm text-left" {...props} />
                              </div>
                            ),
                            thead: ({node, ...props}) => <thead className="text-xs uppercase bg-muted/50" {...props} />,
                            th: ({node, ...props}) => <th className="px-4 py-2 font-medium" {...props} />,
                            td: ({node, ...props}) => <td className="px-4 py-2 border-t border-border/50" {...props} />,
                          }}
                        >
                          {text}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 shrink-0 border border-border/50">
                <AvatarFallback className="bg-accent/10 text-accent-foreground text-[10px] font-bold">AI</AvatarFallback>
              </Avatar>
              <div className="bg-muted/80 border border-border/30 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border/50 bg-card/20 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Input 
              value={input}
              onChange={handleInputChange}
              placeholder={images.length > 0 && messages.length === 0 ? "Ask about the image(s)..." : "Message AI Assistant..."}
              className="bg-background/50 border-border/50 focus-visible:ring-primary h-11 pr-10"
              disabled={isLoading}
            />
            {images.length > 0 && messages.length === 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <ImageIcon className="w-4 h-4 text-primary animate-pulse" />
              </div>
            )}
          </div>
          <Button 
            type="submit" 
            disabled={isLoading || (!(input || "").trim() && images.length === 0)} 
            size="icon" 
            className="h-11 w-11 shrink-0 rounded-xl shadow-md transition-all active:scale-95"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
        <p className="text-[10px] text-center text-muted-foreground mt-3">
          Powered by {model.includes('gpt') ? 'OpenAI' : model.includes('gemini') ? 'Google Gemini' : 'Nexus AI'}
        </p>
      </div>
    </div>
  );
}
