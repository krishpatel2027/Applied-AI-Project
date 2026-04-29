"use client";

import { Cpu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ModelSelectorProps {
  model: string;
  setModel: (model: string) => void;
}

const MODEL_DISPLAY: Record<string, string> = {
  'gemini-2.5-flash': 'Gemini 2.5 Flash',
  'gemini-2.5-pro': 'Gemini 2.5 Pro',
  'gemini-2.0-flash': 'Gemini 2.0 Flash',
  'gpt-4o': 'GPT-4o Vision',
};

const MODELS = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Recommended)' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Highest Quality)' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Fast)' },
  { id: 'gpt-4o', label: 'GPT-4o Vision' },
];

export function ModelSelector({ model, setModel }: ModelSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border bg-transparent hover:bg-accent hover:text-accent-foreground h-8 px-3 glass-panel border-border/50 gap-2 text-xs font-mono">
        <Cpu className="w-3.5 h-3.5 text-primary" />
        {MODEL_DISPLAY[model] || model}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-panel border-border/50">
        {MODELS.map((m) => (
          <DropdownMenuItem
            key={m.id}
            onClick={() => setModel(m.id)}
            className={`font-mono text-xs ${model === m.id ? 'bg-primary/20 text-primary' : ''}`}
          >
            {m.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
