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
          AI-Powered Code Analysis & Prompting Platform
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-vibe bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]">
          Feel the Vibe
          <br />
          <span className="text-4xl md:text-6xl">of Your Code</span>
        </h1>
        
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
          Discover your code's true potential with AI-powered analysis, intelligent prompting, 
          and deep insights that reveal the vibe of your project instantly.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
          {user ? (
            <UploadButton variant="hero" size="default" />
          ) : (
            <Button variant="hero" size="lg" asChild>
              <NavLink to="/auth">Get Started</NavLink>
            </Button>
          )}
          
          <Button variant="glow" size="lg" className="group">
            <Github className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            Connect GitHub
          </Button>
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
      </div>
    </div>
  );
};

export default Hero;