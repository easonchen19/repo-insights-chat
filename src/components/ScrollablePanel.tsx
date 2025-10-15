import { ScrollArea } from "@/components/ui/scroll-area";
import { ReactNode } from "react";

interface ScrollablePanelProps {
  children: ReactNode;
}

export const ScrollablePanel = ({ children }: ScrollablePanelProps) => {
  return (
    <div className="flex-1 overflow-hidden">
      <ScrollArea className="h-full pr-4">
        {children}
      </ScrollArea>
    </div>
  );
};
