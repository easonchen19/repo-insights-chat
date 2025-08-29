import { Brain, Code, Github, Zap, Sparkles, RotateCcw, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

const WorkflowCircle = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 1,
      title: "Code in Your Platform",
      description: "You code in a vibe coding platform like Lovable, Claude, or ChatGPT",
      icon: Code,
      color: "#8B5CF6",
      glowColor: "purple-500",
      bgGradient: "from-purple-500/20 to-purple-600/30"
    },
    {
      id: 2, 
      title: "Connect GitHub",
      description: "Connect your code repository to sync your latest work",
      icon: Github,
      color: "#10B981",
      glowColor: "emerald-500",
      bgGradient: "from-emerald-500/20 to-emerald-600/30"
    },
    {
      id: 3,
      title: "Sync & Analyze",
      description: "We analyze your codebase with senior engineer insights",
      icon: Zap,
      color: "#F59E0B",
      glowColor: "amber-500",
      bgGradient: "from-amber-500/20 to-amber-600/30"
    },
    {
      id: 4,
      title: "Senior Translation", 
      description: "Get professional-grade code analysis and recommendations",
      icon: Brain,
      color: "#EF4444",
      glowColor: "red-500",
      bgGradient: "from-red-500/20 to-red-600/30"
    },
    {
      id: 5,
      title: "Generate Prompts",
      description: "AI-crafted prompts for features, improvements, or custom requests",
      icon: Sparkles,
      color: "#EC4899",
      glowColor: "pink-500",
      bgGradient: "from-pink-500/20 to-pink-600/30"
    },
    {
      id: 6,
      title: "Copy & Continue",
      description: "Take ready-to-use prompts back to your AI platform and keep building",
      icon: RotateCcw,
      color: "#06B6D4",
      glowColor: "cyan-500",
      bgGradient: "from-cyan-500/20 to-cyan-600/30"
    }
  ];

  // Auto-cycle through steps for demo effect
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full min-h-[1200px] p-12 relative overflow-visible">{/* Removed separate background and border - now blends with page */}
      {/* Header - now matches main theme */}
      <div className="text-center mb-12 relative z-10">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-card/60 backdrop-blur-lg rounded-full mb-6 border border-primary/30 shadow-glow">
          <Brain className="w-6 h-6 text-primary animate-pulse" />
          <span className="text-lg font-bold bg-gradient-vibe bg-clip-text text-transparent">
            AI Partner - Continuous Evolution
          </span>
        </div>
        <p className="text-foreground/70 text-lg max-w-3xl mx-auto leading-relaxed">
          An infinite loop of intelligent development where each step flows seamlessly into the next, 
          creating a <span className="text-primary font-semibold">continuous cycle</span> of improvement and innovation.
        </p>
      </div>
      
      <div className="flex justify-center items-center h-full relative z-10">
        <div className="grid grid-cols-3 grid-rows-2 gap-32 max-w-8xl w-full relative px-20 py-16">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === activeStep;
            const isNextActive = (activeStep + 1) % steps.length === index;
            
            // Layout: Top row 1,2,3 (left to right) | Bottom row 6,5,4 (left to right)
            let gridPosition = '';
            if (index <= 2) {
              // Top row: 1,2,3 (normal order)
              gridPosition = `col-start-${index + 1} row-start-1`;
            } else {
              // Bottom row: 6,5,4 (index 5,4,3 -> positions 1,2,3)
              const positionIndex = index === 5 ? 1 : index === 4 ? 2 : 3; // 6->1, 5->2, 4->3
              gridPosition = `col-start-${positionIndex} row-start-2`;
            }
            
            return (
              <div key={step.id} className={`relative flex flex-col items-center group ${gridPosition}`}>
                {/* Circular Step Card - Made 2 sizes smaller */}
                <div className={`
                  relative w-60 h-60 rounded-full flex flex-col items-center justify-center transition-all duration-700 transform
                  backdrop-blur-xl border shadow-2xl
                  ${isActive 
                    ? `bg-gradient-to-br ${step.bgGradient} border-${step.glowColor} shadow-${step.glowColor}/50 scale-110` 
                    : 'bg-card/40 border-primary/20 hover:bg-card/60 hover:scale-105'
                  }
                  ${isNextActive ? 'ring-2 ring-primary/50 animate-pulse' : ''}
                `}>
                  
                  {/* Floating Particles */}
                  {isActive && (
                    <div className="absolute inset-0 overflow-hidden rounded-full">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div
                          key={i}
                          className={`absolute w-1 h-1 bg-${step.glowColor} rounded-full animate-ping`}
                          style={{
                            left: `${30 + Math.cos((i * 45) * Math.PI / 180) * 30}%`,
                            top: `${30 + Math.sin((i * 45) * Math.PI / 180) * 30}%`,
                            animationDelay: `${i * 200}ms`,
                            animationDuration: '2s'
                          }}
                        ></div>
                      ))}
                    </div>
                  )}
                  
                  {/* Glowing Step Number Badge */}
                  <div 
                    className={`
                      absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full border-4 border-background 
                      flex items-center justify-center font-bold text-lg transition-all duration-500 z-10
                      ${isActive 
                        ? `bg-${step.glowColor} text-white shadow-lg shadow-${step.glowColor}/60 animate-pulse scale-125` 
                        : 'bg-muted text-muted-foreground'
                      }
                    `}
                  >
                    {step.id}
                  </div>
                  
                  {/* Holographic Icon */}
                  <div className={`
                    w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all duration-500
                    ${isActive 
                      ? `bg-${step.glowColor} shadow-lg shadow-${step.glowColor}/60 animate-bounce` 
                      : 'bg-muted/50'
                    }
                  `}>
                    <Icon className={`w-10 h-10 transition-all duration-500 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                  </div>
                  
                  {/* Content with Glow Effect */}
                  <div className="text-center px-4">
                    <h3 className={`font-bold text-lg mb-2 transition-all duration-500 ${
                      isActive ? 'text-white' : 'text-foreground'
                    }`}>
                      {step.title}
                    </h3>
                    <p className={`text-xs leading-relaxed transition-all duration-500 ${
                      isActive ? 'text-white/90' : 'text-muted-foreground'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                </div>
                {/* Arrows removed as requested */}
              </div>
            );
          })}
          
          {/* Central Holographic Core - Made 3 times smaller */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-dashed border-primary/30 flex items-center justify-center backdrop-blur-sm animate-spin-slow">
                <div className="w-8 h-8 rounded-full bg-card/80 border border-primary/50 flex items-center justify-center backdrop-blur-lg">
                  <div className="text-center">
                    <Brain className="w-2.5 h-2.5 text-primary mx-auto mb-0.5 animate-pulse" />
                    <div className="text-[6px] font-bold text-primary leading-none">INFINITE</div>
                    <div className="text-[6px] font-bold text-accent leading-none">LOOP</div>
                  </div>
                </div>
              </div>
              
              {/* Orbiting Particles - Made 3 times smaller */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-primary rounded-full animate-ping"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-27px)`,
                    animationDelay: `${i * 250}ms`,
                    animationDuration: '2s'
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-500 ${
              index === activeStep ? 'bg-primary shadow-lg shadow-primary/60' : 'bg-muted'
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default WorkflowCircle;