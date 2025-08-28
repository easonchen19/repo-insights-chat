import { Github, Sparkles, Code, Brain, Zap, RotateCcw } from "lucide-react";

const WorkflowCircle = () => {
  const steps = [
    {
      id: "step1",
      title: "Code in Your Platform",
      description: "You code in a vibe coding platform like Lovable, Claude, or ChatGPT",
      icon: Code,
      color: "#8B5CF6"
    },
    {
      id: "step2", 
      title: "Connect GitHub",
      description: "Connect your code repository to sync your latest work",
      icon: Github,
      color: "#10B981"
    },
    {
      id: "step3",
      title: "Sync & Analyze",
      description: "We analyze your codebase with senior engineer insights",
      icon: Zap,
      color: "#F59E0B"
    },
    {
      id: "step4",
      title: "Senior Translation", 
      description: "Get professional-grade code analysis and recommendations",
      icon: Brain,
      color: "#EF4444"
    },
    {
      id: "step5",
      title: "Generate Prompts",
      description: "AI-crafted prompts for features, improvements, or custom requests",
      icon: Sparkles,
      color: "#EC4899"
    },
    {
      id: "step6",
      title: "Copy & Continue",
      description: "Take ready-to-use prompts back to your AI platform and keep building",
      icon: RotateCcw,
      color: "#06B6D4"
    }
  ];

  const mermaidDiagram = `
    %%{init: {
      'theme': 'base',
      'themeVariables': {
        'primaryColor': '#8B5CF6',
        'primaryTextColor': '#ffffff',
        'primaryBorderColor': '#7c3aed',
        'lineColor': '#6366f1',
        'secondaryColor': '#f1f5f9',
        'tertiaryColor': '#f8fafc',
        'background': 'transparent',
        'mainBkg': '#ffffff',
        'secondBkg': '#f1f5f9'
      }
    }}%%
    
    flowchart TB
      subgraph " "
        A["🖥️ Code in Your Platform<br/><small>You code in a vibe coding platform like Lovable, Claude, or ChatGPT</small>"]
        B["🔗 Connect GitHub<br/><small>Connect your code repository to sync your latest work</small>"]
        C["⚡ Sync & Analyze<br/><small>We analyze your codebase with senior engineer insights</small>"]
        D["🧠 Senior Translation<br/><small>Get professional-grade code analysis and recommendations</small>"]
        E["✨ Generate Prompts<br/><small>AI-crafted prompts for features, improvements, or custom requests</small>"]
        F["🔄 Copy & Continue<br/><small>Take ready-to-use prompts back to your AI platform and keep building</small>"]
        
        A --> B
        B --> C
        C --> D
        D --> E
        E --> F
        F --> A
      end
      
      style A fill:#8B5CF6,stroke:#7c3aed,stroke-width:3px,color:#fff
      style B fill:#10B981,stroke:#059669,stroke-width:3px,color:#fff
      style C fill:#F59E0B,stroke:#d97706,stroke-width:3px,color:#fff
      style D fill:#EF4444,stroke:#dc2626,stroke-width:3px,color:#fff
      style E fill:#EC4899,stroke:#db2777,stroke-width:3px,color:#fff
      style F fill:#06B6D4,stroke:#0891b2,stroke-width:3px,color:#fff
      
      linkStyle 0 stroke:#8B5CF6,stroke-width:3px,stroke-dasharray:8,4
      linkStyle 1 stroke:#10B981,stroke-width:3px,stroke-dasharray:8,4
      linkStyle 2 stroke:#F59E0B,stroke-width:3px,stroke-dasharray:8,4
      linkStyle 3 stroke:#EF4444,stroke-width:3px,stroke-dasharray:8,4
      linkStyle 4 stroke:#EC4899,stroke-width:3px,stroke-dasharray:8,4
      linkStyle 5 stroke:#06B6D4,stroke-width:3px,stroke-dasharray:8,4
  `;

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
          {/* Mermaid Diagram */}
          <div className="mermaid-container">
            <pre className="mermaid bg-transparent">
              {mermaidDiagram}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowCircle;