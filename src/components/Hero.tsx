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
      <div className="absolute inset-0 bg-gradient-hero opacity-30"></div>
      <div className="absolute top-20 left-20 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-float"></div>
      <div className="absolute bottom-20 right-20 w-24 h-24 bg-accent/10 rounded-full blur-xl animate-float" style={{ animationDelay: '3s' }}></div>
      
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        <div className="mb-8 inline-flex items-center gap-2 bg-muted/50 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 text-accent" />
          AI-Powered Code Analysis Platform
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
          Analyze Your Code
          <br />
          <span className="text-4xl md:text-6xl">Like Never Before</span>
        </h1>
        
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
          Upload your project or connect your GitHub repository to get intelligent insights, 
          code quality analysis, and AI-powered recommendations instantly.
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
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 group">
            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Code className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Code Quality</h3>
            <p className="text-muted-foreground text-sm">
              Advanced static analysis to identify potential issues and improvements
            </p>
          </Card>
          
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-accent/50 transition-all duration-300 group">
            <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Insights</h3>
            <p className="text-muted-foreground text-sm">
              Intelligent recommendations powered by advanced machine learning
            </p>
          </Card>
          
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 group">
            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Instant Results</h3>
            <p className="text-muted-foreground text-sm">
              Get comprehensive analysis results in seconds, not hours
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Hero;