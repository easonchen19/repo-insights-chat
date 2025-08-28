import { Github, Sparkles, Code, Brain, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import UploadButton from "@/components/UploadButton";

const Hero = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-hero opacity-40"></div>
      <div className="absolute top-20 left-20 w-40 h-40 bg-primary/20 rounded-full blur-2xl animate-float shadow-deep"></div>
      <div className="absolute bottom-20 right-20 w-32 h-32 bg-accent/15 rounded-full blur-xl animate-float-slow" style={{ animationDelay: '3s' }}></div>
      <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-gradient-vibe opacity-10 rounded-full blur-xl animate-float" style={{ animationDelay: '6s' }}></div>
      
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        <div className="mb-8 inline-flex items-center gap-2 bg-muted/50 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-muted-foreground animate-glow">
          <Sparkles className="w-4 h-4 text-accent animate-pulse-vibe" />
          Lovable mate
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-vibe bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]">
          Code like you are
          <br />
          <span className="text-4xl md:text-6xl">a senior infra engineer</span>
        </h1>
        
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
          Bridge the gap between code and prompt with AI-powered analysis, intelligent insights, 
          and tools that elevate your development workflow to senior engineer level.
        </p>
        
        <div className="mb-12 inline-flex items-center gap-2 bg-gradient-primary/10 backdrop-blur-sm rounded-full px-6 py-3 text-lg font-medium text-foreground border border-primary/20">
          <Brain className="w-5 h-5 text-primary" />
          We are your AI coding partner - translating your codebase to real knowledge and prompts
        </div>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
          {user ? (
            <UploadButton variant="hero" size="default" />
          ) : (
            <Button variant="hero" size="lg" asChild>
              <NavLink to="/auth">Get Started</NavLink>
            </Button>
          )}
        </div>
        
        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 hover:shadow-glow transition-all duration-500 group">
            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 group-hover:animate-pulse-vibe transition-all duration-300">
              <Code className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Code Vibes</h3>
            <p className="text-muted-foreground text-sm">
              Feel the rhythm of your code with advanced static analysis and vibe detection
            </p>
          </Card>
          
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-accent/50 hover:shadow-glow transition-all duration-500 group">
            <div className="w-12 h-12 bg-gradient-vibe rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 group-hover:animate-pulse-vibe transition-all duration-300">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Prompting</h3>
            <p className="text-muted-foreground text-sm">
              Intelligent prompting that understands your code's personality and flow
            </p>
          </Card>
          
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 hover:shadow-deep transition-all duration-500 group">
            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 group-hover:animate-pulse-vibe transition-all duration-300">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Instant Vibes</h3>
            <p className="text-muted-foreground text-sm">
              Get deep insights into your code's vibe and energy in seconds, not hours
            </p>
          </Card>
        </div>
        
        {/* How It Works Section */}
        <div className="mt-24 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Continuous Development Loop
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A seamless partnership with AI coding platforms for continuous evolution
            </p>
          </div>
          
          {/* Circular Workflow */}
          <div className="relative">
            {/* Center connecting circle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-gradient-primary/10 border-2 border-primary/20 flex items-center justify-center backdrop-blur-sm">
                <div className="text-center">
                  <Brain className="w-8 h-8 text-primary mx-auto mb-1" />
                  <span className="text-sm font-medium text-primary">AI Partner</span>
                </div>
              </div>
            </div>
            
            {/* Workflow steps in circular layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {[
                {
                  step: "01",
                  title: "Code in Your Platform",
                  description: "You code in a vibe coding platform like Lovable, Claude, or ChatGPT",
                  icon: <Code className="w-6 h-6" />,
                  position: "top-left"
                },
                {
                  step: "02", 
                  title: "Connect GitHub",
                  description: "Connect your code repository to sync your latest work",
                  icon: <Github className="w-6 h-6" />,
                  position: "top-center"
                },
                {
                  step: "03",
                  title: "Sync & Analyze",
                  description: "We analyze your codebase with senior engineer insights",
                  icon: <Zap className="w-6 h-6" />,
                  position: "top-right"
                },
                {
                  step: "04",
                  title: "Senior Translation", 
                  description: "Get professional-grade code analysis and recommendations",
                  icon: <Brain className="w-6 h-6" />,
                  position: "bottom-right"
                },
                {
                  step: "05",
                  title: "Generate Prompts",
                  description: "AI-crafted prompts for features, improvements, or custom requests",
                  icon: <Sparkles className="w-6 h-6" />,
                  position: "bottom-center"
                },
                {
                  step: "06",
                  title: "Copy & Continue",
                  description: "Take ready-to-use prompts back to your AI platform and keep building",
                  icon: <Code className="w-6 h-6" />,
                  position: "bottom-left"
                }
              ].map((item, index) => (
                <Card key={index} className="relative p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 hover:shadow-glow transition-all duration-500 group">
                  {/* Connecting lines to center */}
                  <div className="absolute inset-0 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <line 
                        x1="50" y1="50" 
                        x2={index < 3 ? "50" : "50"} 
                        y2={index < 3 ? "100" : "0"}
                        stroke="url(#gradient)" 
                        strokeWidth="1" 
                        className="opacity-30"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <span className="text-white font-bold text-sm">{item.step}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-muted/50 rounded-lg group-hover:bg-primary/10 transition-colors duration-300">
                        {item.icon}
                      </div>
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                    </div>
                    
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  
                  {/* Curved arrow to next step */}
                  {index < 5 && (
                    <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 hidden md:block">
                      <div className="w-8 h-8 text-primary/40 animate-pulse">
                        →
                      </div>
                    </div>
                  )}
                  
                  {/* Loop back arrow from last to first */}
                  {index === 5 && (
                    <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 hidden md:block">
                      <div className="w-8 h-8 text-accent/60 animate-pulse-vibe">
                        ↺
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
            
            {/* Continuous loop indicator */}
            <div className="text-center mt-12">
              <div className="inline-flex items-center gap-2 bg-accent/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-accent font-medium">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                Continuous Evolution - The loop never ends
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;