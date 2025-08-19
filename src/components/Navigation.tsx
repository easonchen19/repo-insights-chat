import { useState } from "react";
import { Code, Github, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";
import UploadButton from "./UploadButton";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Code className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              CodeAnalyzer
            </span>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `text-sm font-medium transition-colors hover:text-primary ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`
              }
            >
              Home
            </NavLink>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <UploadButton variant="outline" size="sm" />
            <Button variant="hero" size="sm">
              <Github className="w-4 h-4 mr-2" />
              Connect
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <div className="flex flex-col space-y-4">
              <NavLink 
                to="/" 
                className="text-sm font-medium text-muted-foreground hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </NavLink>
              <div className="flex flex-col space-y-2 pt-4">
                <UploadButton variant="outline" size="sm" />
                <Button variant="hero" size="sm">
                  <Github className="w-4 h-4 mr-2" />
                  Connect GitHub
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;