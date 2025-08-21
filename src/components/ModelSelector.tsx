import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const CLAUDE_MODELS = [
  { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", description: "Fastest, most cost-effective" },
  { id: "claude-sonnet-4-20250514", name: "Claude 4 Sonnet", description: "High-performance, balanced" },
  { id: "claude-opus-4-20250514", name: "Claude 4 Opus", description: "Most capable, premium" }
] as const;

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  className?: string;
}

export const ModelSelector = ({ selectedModel, onModelChange, className }: ModelSelectorProps) => {
  return (
    <div className={className}>
      <Label htmlFor="model-selector" className="text-sm font-medium">
        AI Model
      </Label>
      <Select value={selectedModel} onValueChange={onModelChange}>
        <SelectTrigger id="model-selector" className="w-full">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {CLAUDE_MODELS.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex flex-col">
                <span className="font-medium">{model.name}</span>
                <span className="text-xs text-muted-foreground">{model.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// Hook to manage model selection with localStorage persistence
export const useModelSelection = (defaultModel: string = "claude-3-5-haiku-20241022") => {
  const [selectedModel, setSelectedModel] = useState<string>(defaultModel);

  useEffect(() => {
    const saved = localStorage.getItem("selected-claude-model");
    if (saved && CLAUDE_MODELS.find(m => m.id === saved)) {
      setSelectedModel(saved);
    }
  }, []);

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem("selected-claude-model", model);
  };

  return { selectedModel, setSelectedModel: handleModelChange };
};