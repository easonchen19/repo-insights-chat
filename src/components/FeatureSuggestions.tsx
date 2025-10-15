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
                "p-4 cursor-pointer transition-all duration-500 group relative overflow-hidden",
                "border border-border/50 hover:border-primary/70",
                "bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm",
                "hover:shadow-glow hover:scale-[1.03] hover:-translate-y-1",
                "animate-slide-up-fade",
                index % 2 === 0 ? "animate-float" : "animate-float-delayed",
                isGenerating && "opacity-50 cursor-not-allowed"
              )}
              style={{
                animationDelay: `${index * 150}ms`,
                animationFillMode: 'both'
              }}
            >
              {/* Animated gradient border effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Glow effect on hover */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg blur opacity-0 group-hover:opacity-100 group-hover:animate-pulse-glow transition-opacity duration-500 -z-10" />
              
              <div className="flex items-start gap-3 relative z-10">
                <div className={cn(
                  "p-2 rounded-lg transition-all duration-300",
                  "bg-gradient-to-br from-primary/20 to-accent/10",
                  "group-hover:from-primary/30 group-hover:to-accent/20",
                  "group-hover:shadow-neon group-hover:scale-110"
                )}>
                  <Icon className="w-4 h-4 text-primary group-hover:text-accent transition-colors duration-300" />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors duration-300">
                      {suggestion.title}
                    </h4>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs shrink-0 transition-all duration-300",
                        getPriorityColor(suggestion.priority),
                        "group-hover:scale-110"
                      )}
                    >
                      {suggestion.priority}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/90 transition-colors duration-300">
                    {suggestion.description}
                  </p>
                  
                  <Badge 
                    variant="secondary" 
                    className="text-xs bg-gradient-to-r from-secondary to-secondary/80 group-hover:from-primary/20 group-hover:to-accent/20 transition-all duration-300"
                  >
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
