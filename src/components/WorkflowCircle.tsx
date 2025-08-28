import { Brain } from "lucide-react";

const WorkflowCircle = () => {
  return (
    <div className="w-full h-[800px] bg-gradient-to-br from-background to-muted/20 rounded-lg border p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
          <Brain className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-primary">AI Partner - Continuous Evolution</span>
        </div>
        <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
          An infinite loop of intelligent development where each step flows seamlessly into the next, 
          creating a continuous cycle of improvement and innovation.
        </p>
      </div>
      
      <div className="flex justify-center items-center h-full">
        <div className="w-full max-w-4xl">
          <lov-mermaid>
flowchart LR
    A["🖥️ Code in Your Platform<br/>You code in a vibe coding platform like Lovable, Claude, or ChatGPT"]
    B["🔗 Connect GitHub<br/>Connect your code repository to sync your latest work"]
    C["⚡ Sync & Analyze<br/>We analyze your codebase with senior engineer insights"]
    D["🧠 Senior Translation<br/>Get professional-grade code analysis and recommendations"]
    E["✨ Generate Prompts<br/>AI-crafted prompts for features, improvements, or custom requests"]
    F["🔄 Copy & Continue<br/>Take ready-to-use prompts back to your AI platform and keep building"]
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> A
    
    style A fill:#8B5CF6,stroke:#7c3aed,stroke-width:3px,color:#fff
    style B fill:#10B981,stroke:#059669,stroke-width:3px,color:#fff
    style C fill:#F59E0B,stroke:#d97706,stroke-width:3px,color:#fff
    style D fill:#EF4444,stroke:#dc2626,stroke-width:3px,color:#fff
    style E fill:#EC4899,stroke:#db2777,stroke-width:3px,color:#fff
    style F fill:#06B6D4,stroke:#0891b2,stroke-width:3px,color:#fff
          </lov-mermaid>
        </div>
      </div>
    </div>
  );
};

export default WorkflowCircle;