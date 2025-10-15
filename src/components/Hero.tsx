import { Github, Sparkles, Code, Brain, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import UploadButton from "@/components/UploadButton";

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
          <span className="font-medium bg-gradient-vibe bg-clip-text text-transparent">
            Lovable Mate: From code to prompt
          </span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-vibe bg-clip-text text-transparent animate-pulse">
          Stop AI hallucinations in Cursor/Lovable.
          <br />
          <span className="text-4xl md:text-6xl">Paste repo-aware prompts that just work.</span>
        </h1>
        
        <p className="text-xl text-foreground/80 mb-8 max-w-2xl mx-auto leading-relaxed">
          We parse your repo, find the right files/functions, and generate prompts that guide AI to correct, runnable code.
        </p>
        
        <div className="mb-12 inline-flex items-center gap-3 bg-card/60 backdrop-blur-xl rounded-full px-8 py-4 text-lg font-medium border border-primary/30 shadow-glow">
          <Brain className="w-6 h-6 text-primary animate-pulse" />
          <span className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            We are your AI coding partner - translating your codebase to real knowledge and prompts
          </span>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
          {user ? (
            <>
              <UploadButton variant="hero" size="lg" className="text-lg px-8 py-4 h-auto w-48" />
              <Button 
                variant="hero" 
                size="lg" 
                asChild 
                className="text-lg px-8 py-4 h-auto w-48"
              >
                <NavLink to="/github">
                  <Github className="w-5 h-5 mr-2" />
                  Git Connect
                </NavLink>
              </Button>
            </>
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
        
        {/* Testimonials Section */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 mt-32 mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-vibe bg-clip-text text-transparent">
              Developers love Lovable Mate
            </h2>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
              See how we're helping developers ship faster with better AI prompts
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Chen",
                role: "Senior Frontend Developer",
                company: "TechCorp",
                quote: "Before Lovable Mate, I spent hours debugging AI-generated code that didn't work with our existing codebase. Now I get perfect, context-aware prompts every time.",
                avatar: "SC"
              },
              {
                name: "Marcus Rodriguez",
                role: "Full Stack Engineer", 
                company: "StartupXYZ",
                quote: "The repo analysis is incredible. It actually understands our architecture and generates prompts that produce working code on the first try. Game changer for our team.",
                avatar: "MR"
              },
              {
                name: "Alex Kim",
                role: "Tech Lead",
                company: "DevStudio",
                quote: "We reduced our AI debugging time by 80%. The prompts are so precise that even junior developers can get senior-level results from AI tools.",
                avatar: "AK"
              }
            ].map((testimonial, index) => (
              <Card 
                key={testimonial.name}
                className="p-6 bg-card/60 backdrop-blur-xl border-primary/20 hover:border-primary/40 transition-all duration-500 hover:shadow-glow group"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    <p className="text-xs text-primary font-medium">{testimonial.company}</p>
                  </div>
                </div>
                <blockquote className="text-foreground/80 italic leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
              </Card>
            ))}
          </div>
        </div>
      </div>
      
      {/* Connect Git CTA */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6">
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