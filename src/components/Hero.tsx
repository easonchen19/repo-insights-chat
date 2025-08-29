import { Github, Sparkles, Code, Brain, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import UploadButton from "@/components/UploadButton";
import WorkflowCircle from "@/components/WorkflowCircle";
import { useEffect, useState } from "react";
import lovableMateLogoUrl from "@/assets/lovable-mate-heart-logo.png";

const Hero = () => {
  const { user } = useAuth();
  const [glowActive, setGlowActive] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setGlowActive(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-dark">
      {/* High-Tech Animated Background Grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-pulse"></div>
        <div className="grid grid-cols-12 h-full w-full">
          {Array.from({ length: 144 }).map((_, i) => (
            <div key={i} className="border-r border-b border-primary/10 animate-pulse" style={{ animationDelay: `${i * 50}ms` }}></div>
          ))}
        </div>
      </div>

      {/* Floating Holographic Elements */}
      <div className="absolute top-20 left-20 w-40 h-40 bg-primary/20 rounded-full blur-2xl animate-pulse shadow-glow"></div>
      <div className="absolute bottom-20 right-20 w-32 h-32 bg-accent/15 rounded-full blur-xl animate-pulse" style={{ animationDelay: '3s' }}></div>
      <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-gradient-glow opacity-30 rounded-full blur-xl animate-pulse" style={{ animationDelay: '6s' }}></div>
      
      
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        <div className={`mb-8 inline-flex items-center gap-3 backdrop-blur-xl rounded-full px-6 py-3 text-sm border transition-all duration-1000 ${
          glowActive 
            ? 'bg-primary/20 border-primary/50 shadow-neon' 
            : 'bg-muted/30 border-muted/50'
        }`}>
          <img src={lovableMateLogoUrl} alt="Lovable Mate Logo" className="w-6 h-6" />
          <span className="font-medium bg-gradient-vibe bg-clip-text text-transparent">Lovable mate</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-vibe bg-clip-text text-transparent animate-pulse">
          Code like you are
          <br />
          <span className="text-4xl md:text-6xl">a senior infra engineer</span>
        </h1>
        
        <p className="text-xl text-foreground/80 mb-8 max-w-2xl mx-auto leading-relaxed">
          Bridge the gap between code and prompt with <span className="text-primary font-semibold">AI-powered analysis</span>, intelligent insights, 
          and tools that elevate your development workflow to <span className="text-accent font-semibold">senior engineer level</span>.
        </p>
        
        <div className="mb-12 inline-flex items-center gap-3 bg-card/60 backdrop-blur-xl rounded-full px-8 py-4 text-lg font-medium border border-primary/30 shadow-glow">
          <Brain className="w-6 h-6 text-primary animate-pulse" />
          <span className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            We are your AI coding partner - translating your codebase to real knowledge and prompts
          </span>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
          {user ? (
            <UploadButton variant="hero" size="default" />
          ) : (
            <Button 
              variant="default" 
              size="lg" 
              asChild 
              className="bg-gradient-primary hover:shadow-neon transition-all duration-500 text-lg px-8 py-4 h-auto"
            >
              <NavLink to="/auth">Get Started</NavLink>
            </Button>
          )}
        </div>
        
        {/* High-Tech Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {[
            { 
              icon: Code, 
              title: "Code Vibes", 
              desc: "Analyze your codebase with intelligent insights",
              color: "primary",
              delay: "0s"
            },
            { 
              icon: Brain, 
              title: "AI Prompting", 
              desc: "Generate perfect prompts for your development needs",
              color: "accent", 
              delay: "0.2s"
            },
            { 
              icon: Zap, 
              title: "Instant Vibes", 
              desc: "Get real-time feedback and optimizations",
              color: "primary",
              delay: "0.4s"
            }
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={feature.title} 
                className="p-8 bg-card/40 backdrop-blur-xl border-primary/20 hover:border-primary/50 transition-all duration-500 hover:shadow-glow hover:scale-105 group"
                style={{ animationDelay: feature.delay }}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-500 ${
                  feature.color === 'primary' ? 'bg-primary/20 group-hover:bg-primary/30' : 'bg-accent/20 group-hover:bg-accent/30'
                }`}>
                  <Icon className={`w-8 h-8 ${
                    feature.color === 'primary' ? 'text-primary' : 'text-accent'
                  } group-hover:animate-pulse`} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors duration-500">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground group-hover:text-foreground/80 transition-colors duration-500">
                  {feature.desc}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
      
      {/* Continuous Development Loop Section */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 mt-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-vibe bg-clip-text text-transparent">
            How does Lovable Mate work?
          </h2>
        </div>
        
        <WorkflowCircle />
        
        {/* Connect Git CTA */}
        <div className="text-center mt-20 mb-20">
          <div className="mb-8">
            <h3 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-vibe bg-clip-text text-transparent">
              Ready to supercharge your development?
            </h3>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto mb-4">
              Connect your GitHub and unlock <span className="text-primary font-semibold">bidirectional sync</span>, 
              automatic deployments, and seamless collaboration.
            </p>
            <p className="text-base text-accent font-medium">
              ⚡ Real-time sync • 🚀 Instant deployment • 🔄 Zero configuration
            </p>
          </div>
          
          <Button 
            variant="default" 
            size="lg" 
            asChild 
            className="bg-gradient-primary hover:shadow-neon transition-all duration-500 text-lg px-8 py-4 h-auto"
          >
            <NavLink to="/github">
              <Github className="w-5 h-5 mr-2" />
              Connect Git
            </NavLink>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Hero;