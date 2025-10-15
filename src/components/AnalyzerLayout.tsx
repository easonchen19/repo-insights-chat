import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AnalyzerLayoutProps {
  onBack: () => void;
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  leftPanelHeader: {
    title: string;
    description: string;
  };
  rightPanelHeader: {
    title: string;
    description: string;
  };
}

export const AnalyzerLayout = ({ 
  onBack, 
  leftPanel, 
  rightPanel,
  leftPanelHeader,
  rightPanelHeader
}: AnalyzerLayoutProps) => {
  return (
    <div className="fixed inset-0 top-20 overflow-hidden px-4 pb-4">
      <Button
        variant="outline"
        onClick={onBack}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Repositories
      </Button>

      <ResizablePanelGroup direction="horizontal" className="h-[calc(100%-4rem)] rounded-lg border overflow-hidden">
        {/* Left Panel */}
        <ResizablePanel defaultSize={40} minSize={30}>
          <div className="h-full flex flex-col p-6 bg-background">
            <div className="mb-6 flex-shrink-0">
              <h2 className="text-xl font-semibold mb-1">{leftPanelHeader.title}</h2>
              <p className="text-sm text-muted-foreground">{leftPanelHeader.description}</p>
            </div>
            
            <div className="flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                {leftPanel}
              </ScrollArea>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel */}
        <ResizablePanel defaultSize={60} minSize={40}>
          <div className="h-full flex flex-col p-6 bg-muted/20">
            <div className="mb-4 flex-shrink-0">
              <h2 className="text-xl font-semibold mb-1">{rightPanelHeader.title}</h2>
              <p className="text-sm text-muted-foreground">{rightPanelHeader.description}</p>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                {rightPanel}
              </ScrollArea>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
