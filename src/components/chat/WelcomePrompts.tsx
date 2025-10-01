import { Sparkles, Code, FileText, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomePromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

const suggestedPrompts = [
  {
    icon: Sparkles,
    title: "Get creative",
    prompt: "Help me brainstorm ideas for a new project",
  },
  {
    icon: Code,
    title: "Write code",
    prompt: "Create a React component with TypeScript",
  },
  {
    icon: FileText,
    title: "Summarize text",
    prompt: "Summarize this article in 3 bullet points",
  },
  {
    icon: Lightbulb,
    title: "Solve problems",
    prompt: "Help me debug this error message",
  },
];

export function WelcomePrompts({ onSelectPrompt }: WelcomePromptsProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-12">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            How can I help you today?
          </h1>
          <p className="text-muted-foreground">
            Start a conversation or try one of these prompts
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestedPrompts.map((prompt, index) => {
            const Icon = prompt.icon;
            return (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-muted/50 transition-all hover:scale-105"
                onClick={() => onSelectPrompt(prompt.prompt)}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">{prompt.title}</span>
                </div>
                <p className="text-xs text-muted-foreground text-left">
                  {prompt.prompt}
                </p>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
