import { Lightbulb, Zap, Shield, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FeatureSuggestion {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

interface FeatureSuggestionsProps {
  suggestions: FeatureSuggestion[];
  onSuggestionClick: (suggestion: FeatureSuggestion) => void;
  isGenerating?: boolean;
}

const getCategoryIcon = (category: string) => {
  const icons: Record<string, any> = {
    Security: Shield,
    UX: Sparkles,
    Performance: Zap,
    Features: Lightbulb,
    UI: Sparkles,
    Marketing: Lightbulb
  };
  return icons[category] || Lightbulb;
};

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    high: 'bg-red-500/10 text-red-500 border-red-500/20',
    medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    low: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
  };
  return colors[priority] || colors.medium;
};

export const FeatureSuggestions = ({ 
  suggestions, 
  onSuggestionClick,
  isGenerating 
}: FeatureSuggestionsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Suggested Features</h3>
      </div>
      
      <div className="space-y-3">
        {suggestions.map((suggestion, index) => {
          const Icon = getCategoryIcon(suggestion.category);
          
          return (
            <Card
              key={index}
              onClick={() => !isGenerating && onSuggestionClick(suggestion)}
              className={cn(
                "p-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
                "border border-border/50 hover:border-primary/50",
                "animate-in fade-in slide-in-from-left-5",
                isGenerating && "opacity-50 cursor-not-allowed"
              )}
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'both'
              }}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  "bg-primary/10 text-primary"
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-sm leading-tight">
                      {suggestion.title}
                    </h4>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs shrink-0",
                        getPriorityColor(suggestion.priority)
                      )}
                    >
                      {suggestion.priority}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {suggestion.description}
                  </p>
                  
                  <Badge variant="secondary" className="text-xs">
                    {suggestion.category}
                  </Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
