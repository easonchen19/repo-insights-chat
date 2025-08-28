import { Brain, Code, Github, Zap, Sparkles, RotateCcw, ArrowRight } from "lucide-react";

const WorkflowCircle = () => {
  const steps = [
    {
      id: 1,
      title: "Code in Your Platform",
      description: "You code in a vibe coding platform like Lovable, Claude, or ChatGPT",
      icon: Code,
      color: "#8B5CF6",
      bgColor: "bg-purple-500"
    },
    {
      id: 2, 
      title: "Connect GitHub",
      description: "Connect your code repository to sync your latest work",
      icon: Github,
      color: "#10B981",
      bgColor: "bg-emerald-500"
    },
    {
      id: 3,
      title: "Sync & Analyze",
      description: "We analyze your codebase with senior engineer insights",
      icon: Zap,
      color: "#F59E0B",
      bgColor: "bg-amber-500"
    },
    {
      id: 4,
      title: "Senior Translation", 
      description: "Get professional-grade code analysis and recommendations",
      icon: Brain,
      color: "#EF4444",
      bgColor: "bg-red-500"
    },
    {
      id: 5,
      title: "Generate Prompts",
      description: "AI-crafted prompts for features, improvements, or custom requests",
      icon: Sparkles,
      color: "#EC4899",
      bgColor: "bg-pink-500"
    },
    {
      id: 6,
      title: "Copy & Continue",
      description: "Take ready-to-use prompts back to your AI platform and keep building",
      icon: RotateCcw,
      color: "#06B6D4",
      bgColor: "bg-cyan-500"
    }
  ];

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
        <div className="grid grid-cols-3 grid-rows-2 gap-8 max-w-6xl w-full relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isLastStep = index === steps.length - 1;
            const showArrow = !isLastStep || index === steps.length - 1;
            
            return (
              <div key={step.id} className="relative flex flex-col items-center">
                {/* Step Card */}
                <div className="relative p-6 bg-card border rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 w-full max-w-sm">
                  {/* Step Number Badge */}
                  <div 
                    className="absolute -top-3 -left-3 w-8 h-8 rounded-full border-4 border-background flex items-center justify-center shadow-lg text-white font-bold text-sm"
                    style={{ backgroundColor: step.color }}
                  >
                    {step.id}
                  </div>
                  
                  {/* Icon */}
                  <div 
                    className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 ${step.bgColor}`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  {/* Content */}
                  <div className="text-center">
                    <h3 className="font-bold text-lg mb-2 text-foreground">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
                
                {/* Arrow */}
                {showArrow && (
                  <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 z-10">
                    {index < 2 && (
                      <ArrowRight 
                        className="w-8 h-8 text-primary animate-pulse" 
                        style={{ color: step.color }}
                      />
                    )}
                    {index === 2 && (
                      <div className="flex flex-col items-center">
                        <ArrowRight 
                          className="w-8 h-8 text-primary animate-pulse rotate-90" 
                          style={{ color: step.color }}
                        />
                      </div>
                    )}
                    {index >= 3 && index < 5 && (
                      <ArrowRight 
                        className="w-8 h-8 text-primary animate-pulse rotate-180" 
                        style={{ color: step.color }}
                      />
                    )}
                    {index === 5 && (
                      <div className="flex flex-col items-center">
                        <ArrowRight 
                          className="w-8 h-8 text-primary animate-pulse -rotate-90" 
                          style={{ color: step.color }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Central Connection Indicator */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-32 h-32 rounded-full bg-primary/5 border-2 border-dashed border-primary/20 flex items-center justify-center">
              <div className="text-center">
                <Brain className="w-8 h-8 text-primary mx-auto mb-1" />
                <div className="text-xs font-medium text-primary">Infinite Loop</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowCircle;