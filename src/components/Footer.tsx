import { Github, Linkedin, Mail, Heart } from "lucide-react";
import { NavLink } from "react-router-dom";
import lovableMateLogoUrl from "@/assets/lovable-mate-heart-logo.png";

const Footer = () => {
  return (
    <footer className="bg-background/95 backdrop-blur-md border-t border-border/50 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src={lovableMateLogoUrl} 
                alt="Lovable Mate Logo" 
                className="w-8 h-8"
              />
              <span className="text-xl font-bold bg-gradient-vibe bg-clip-text text-transparent">
                Lovable Mate
              </span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
              Bridge the gap between code and prompt with AI-powered analysis, intelligent insights, 
              and tools that elevate your development workflow to senior engineer level.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://www.linkedin.com/in/easonchen19/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit Eason Chen's LinkedIn profile"
                className="p-2 rounded-lg bg-muted/50 hover:bg-primary/10 border border-border hover:border-primary/30 transition-all duration-300 group"
              >
                <Linkedin className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit GitHub platform"
                className="p-2 rounded-lg bg-muted/50 hover:bg-primary/10 border border-border hover:border-primary/30 transition-all duration-300 group"
              >
                <Github className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Navigation</h3>
            <nav className="space-y-3">
              <NavLink 
                to="/"
                className="block text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                Home
              </NavLink>
              <NavLink 
                to="/github"
                className="block text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                GitHub
              </NavLink>
              <NavLink 
                to="/analyzer"
                className="block text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                Analyzer
              </NavLink>
              <NavLink 
                to="/projects"
                className="block text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                Projects
              </NavLink>
            </nav>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Support</h3>
            <nav className="space-y-3">
              <NavLink 
                to="/contact"
                className="block text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                Contact Us
              </NavLink>
              <a
                href="https://www.linkedin.com/in/easonchen19/"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                LinkedIn
              </a>
              <a
                href="mailto:contact@lovablemate.dev"
                className="block text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                Email Support
              </a>
            </nav>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border/50 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-current" />
            <span>by Eason Chen</span>
          </div>
          <div className="text-sm text-muted-foreground">
            © 2024 Lovable Mate. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;