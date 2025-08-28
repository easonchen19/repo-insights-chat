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
        
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
          Bridge the gap between code and prompt with AI-powered analysis, intelligent insights, 
          and tools that elevate your development workflow to senior engineer level.
        </p>
        
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
        <div className="mt-24 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From code to prompts in 6 simple steps
            </p>
          </div>
          
          <div className="grid gap-8 md:gap-12">
            {[
              {
                step: "01",
                title: "Code in Your Platform",
                description: "You code in a vibe coding platform",
                icon: <Code className="w-6 h-6" />
              },
              {
                step: "02", 
                title: "Connect GitHub",
                description: "Connect your code in your GitHub repository",
                icon: <Github className="w-6 h-6" />
              },
              {
                step: "03",
                title: "Sync & Analyze",
                description: "Sync up your GitHub with us and we analyze your codebase",
                icon: <Zap className="w-6 h-6" />
              },
              {
                step: "04",
                title: "Senior Engineer Translation", 
                description: "We translate it to you like a senior infra engineer",
                icon: <Brain className="w-6 h-6" />
              },
              {
                step: "05",
                title: "Generate Prompts",
                description: "We generate proper prompts for additional features, or you describe your features to us",
                icon: <Sparkles className="w-6 h-6" />
              },
              {
                step: "06",
                title: "Copy & Continue",
                description: "Copy the 'ready to go' prompt back to your AI or vibe coding platform, continue building",
                icon: <Code className="w-6 h-6" />
              }
            ].map((item, index) => (
              <div key={index} className="flex gap-6 group">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform duration-300">
                    {item.step}
                  </div>
                </div>
                <div className="flex-1 pt-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-muted/50 rounded-lg group-hover:bg-primary/10 transition-colors duration-300">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-semibold">{item.title}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
                {index < 5 && (
                  <div className="absolute left-8 mt-20 w-px h-12 bg-gradient-to-b from-primary/50 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;