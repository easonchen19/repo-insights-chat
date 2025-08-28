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
    <div className="w-full min-h-[1200px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 p-12 relative overflow-visible">{/* Increased height, padding and made overflow visible */}
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-pulse"></div>
        <div className="grid grid-cols-12 h-full w-full">
          {Array.from({ length: 144 }).map((_, i) => (
            <div key={i} className="border-r border-b border-slate-700/30 animate-pulse" style={{ animationDelay: `${i * 50}ms` }}></div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-12 relative z-10">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-800/60 backdrop-blur-lg rounded-full mb-6 border border-slate-600/30 shadow-2xl">
          <Brain className="w-6 h-6 text-cyan-400 animate-pulse" />
          <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI Partner - Continuous Evolution
          </span>
        </div>
        <p className="text-slate-300 text-lg max-w-3xl mx-auto leading-relaxed">
          An infinite loop of intelligent development where each step flows seamlessly into the next, 
          creating a <span className="text-cyan-400 font-semibold">continuous cycle</span> of improvement and innovation.
        </p>
      </div>
      
      <div className="flex justify-center items-center h-full relative z-10">
        <div className="grid grid-cols-3 grid-rows-2 gap-32 max-w-8xl w-full relative px-20 py-16">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === activeStep;
            const isNextActive = (activeStep + 1) % steps.length === index;
            
            return (
              <div key={step.id} className="relative flex flex-col items-center group">
                {/* Holographic Step Card */}
                <div className={`
                  relative p-8 rounded-3xl transition-all duration-700 transform w-full max-w-sm
                  backdrop-blur-xl border shadow-2xl
                  ${isActive 
                    ? `bg-gradient-to-br ${step.bgGradient} border-${step.glowColor} shadow-${step.glowColor}/50 scale-110 rotate-1` 
                    : 'bg-slate-800/40 border-slate-600/30 hover:bg-slate-700/50 hover:scale-105'
                  }
                  ${isNextActive ? 'ring-2 ring-cyan-400/50 animate-pulse' : ''}
                `}>
                  
                  {/* Floating Particles */}
                  {isActive && (
                    <div className="absolute inset-0 overflow-hidden rounded-3xl">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className={`absolute w-1 h-1 bg-${step.glowColor} rounded-full animate-ping`}
                          style={{
                            left: `${20 + (i * 15)}%`,
                            top: `${10 + (i * 15)}%`,
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
                      absolute -top-4 -left-4 w-12 h-12 rounded-full border-4 border-slate-900 
                      flex items-center justify-center font-bold text-lg transition-all duration-500
                      ${isActive 
                        ? `bg-${step.glowColor} text-white shadow-lg shadow-${step.glowColor}/60 animate-pulse scale-125` 
                        : 'bg-slate-700 text-slate-300'
                      }
                    `}
                  >
                    {step.id}
                  </div>
                  
                  {/* Holographic Icon */}
                  <div className={`
                    w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-500
                    ${isActive 
                      ? `bg-${step.glowColor} shadow-lg shadow-${step.glowColor}/60 animate-bounce` 
                      : 'bg-slate-700/50'
                    }
                  `}>
                    <Icon className={`w-10 h-10 transition-all duration-500 ${isActive ? 'text-white' : 'text-slate-300'}`} />
                  </div>
                  
                  {/* Content with Glow Effect */}
                  <div className="text-center">
                    <h3 className={`font-bold text-xl mb-3 transition-all duration-500 ${
                      isActive ? 'text-white' : 'text-slate-200'
                    }`}>
                      {step.title}
                    </h3>
                    <p className={`text-sm leading-relaxed transition-all duration-500 ${
                      isActive ? 'text-slate-100' : 'text-slate-400'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                </div>
                
                {/* Futuristic Connection Lines */}
                {index < steps.length && (
                  <>
                    {/* Horizontal arrows for top row */}
                    {index === 0 && (
                      <div className="absolute -right-16 top-1/2 transform -translate-y-1/2 z-20">
                        <div className="flex items-center space-x-3">
                          <div className={`w-24 h-0.5 bg-gradient-to-r from-purple-500 to-emerald-500 rounded-full ${isActive ? 'animate-pulse shadow-lg shadow-purple-500/50' : ''}`}></div>
                          <ArrowRight className={`w-12 h-12 text-emerald-400 drop-shadow-2xl transition-all duration-500 ${isActive ? 'animate-pulse scale-125' : 'animate-pulse'}`} />
                        </div>
                      </div>
                    )}
                    
                    {index === 1 && (
                      <div className="absolute -right-16 top-1/2 transform -translate-y-1/2 z-20">
                        <div className="flex items-center space-x-3">
                          <div className={`w-24 h-0.5 bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full ${isActive ? 'animate-pulse shadow-lg shadow-emerald-500/50' : ''}`}></div>
                          <ArrowRight className={`w-12 h-12 text-amber-400 drop-shadow-2xl transition-all duration-500 ${isActive ? 'animate-pulse scale-125' : 'animate-pulse'}`} />
                        </div>
                      </div>
                    )}
                    
                    {/* Vertical arrow down */}
                    {index === 2 && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-16 z-20">
                        <div className="flex flex-col items-center space-y-3">
                          <div className={`w-0.5 h-24 bg-gradient-to-b from-amber-500 to-red-500 rounded-full ${isActive ? 'animate-pulse shadow-lg shadow-amber-500/50' : ''}`}></div>
                          <ArrowRight className={`w-12 h-12 text-red-400 drop-shadow-2xl transition-all duration-500 rotate-90 ${isActive ? 'animate-pulse scale-125' : 'animate-pulse'}`} />
                        </div>
                      </div>
                    )}
                    
                    {/* Horizontal arrows for bottom row (reverse) */}
                    {index === 3 && (
                      <div className="absolute -left-16 top-1/2 transform -translate-y-1/2 z-20">
                        <div className="flex items-center space-x-3">
                          <ArrowRight className={`w-12 h-12 text-pink-400 drop-shadow-2xl transition-all duration-500 rotate-180 ${isActive ? 'animate-pulse scale-125' : 'animate-pulse'}`} />
                          <div className={`w-24 h-0.5 bg-gradient-to-l from-red-500 to-pink-500 rounded-full ${isActive ? 'animate-pulse shadow-lg shadow-red-500/50' : ''}`}></div>
                        </div>
                      </div>
                    )}
                    
                    {index === 4 && (
                      <div className="absolute -left-16 top-1/2 transform -translate-y-1/2 z-20">
                        <div className="flex items-center space-x-3">
                          <ArrowRight className={`w-12 h-12 text-cyan-400 drop-shadow-2xl transition-all duration-500 rotate-180 ${isActive ? 'animate-pulse scale-125' : 'animate-pulse'}`} />
                          <div className={`w-24 h-0.5 bg-gradient-to-l from-pink-500 to-cyan-500 rounded-full ${isActive ? 'animate-pulse shadow-lg shadow-pink-500/50' : ''}`}></div>
                        </div>
                      </div>
                    )}
                    
                    {/* Vertical arrow up */}
                    {index === 5 && (
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-16 z-20">
                        <div className="flex flex-col items-center space-y-3">
                          <ArrowRight className={`w-12 h-12 text-purple-400 drop-shadow-2xl transition-all duration-500 -rotate-90 ${isActive ? 'animate-pulse scale-125' : 'animate-pulse'}`} />
                          <div className={`w-0.5 h-24 bg-gradient-to-t from-cyan-500 to-purple-500 rounded-full ${isActive ? 'animate-pulse shadow-lg shadow-cyan-500/50' : ''}`}></div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
          
          {/* Central Holographic Core */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="relative">
              <div className="w-40 h-40 rounded-full bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 border-2 border-dashed border-cyan-400/30 flex items-center justify-center backdrop-blur-sm animate-spin-slow">
                <div className="w-24 h-24 rounded-full bg-slate-800/80 border border-cyan-400/50 flex items-center justify-center backdrop-blur-lg">
                  <div className="text-center">
                    <Brain className="w-8 h-8 text-cyan-400 mx-auto mb-1 animate-pulse" />
                    <div className="text-xs font-bold text-cyan-400">INFINITE</div>
                    <div className="text-xs font-bold text-purple-400">LOOP</div>
                  </div>
                </div>
              </div>
              
              {/* Orbiting Particles */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-cyan-400 rounded-full animate-ping"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-80px)`,
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
              index === activeStep ? 'bg-cyan-400 shadow-lg shadow-cyan-400/60' : 'bg-slate-600'
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default WorkflowCircle;