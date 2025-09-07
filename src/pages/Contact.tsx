import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Linkedin, Github, MessageSquare, Send, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Message sent successfully!",
        description: "Thank you for reaching out. I'll get back to you soon.",
      });
      setFormData({ name: '', email: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-dark pt-16">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-vibe bg-clip-text text-transparent">
            Get in Touch
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have questions about Lovable Mate? Want to collaborate or provide feedback? 
            I'd love to hear from you!
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="bg-card/60 backdrop-blur-xl border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-primary" />
                  Send a Message
                </CardTitle>
                <CardDescription>
                  Fill out the form below and I'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your full name"
                        required
                        className="bg-background/50 border-border/50 focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your.email@example.com"
                        required
                        className="bg-background/50 border-border/50 focus:border-primary/50"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="What's this about?"
                      required
                      className="bg-background/50 border-border/50 focus:border-primary/50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Tell me more about your inquiry, feedback, or collaboration idea..."
                      required
                      rows={6}
                      className="bg-background/50 border-border/50 focus:border-primary/50 resize-none"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Info & Social */}
          <div className="space-y-6">
            {/* Direct Contact */}
            <Card className="bg-card/60 backdrop-blur-xl border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-6 h-6 text-primary" />
                  Direct Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email</p>
                    <a 
                      href="mailto:contact@lovablemate.dev"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      contact@lovablemate.dev
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card className="bg-card/60 backdrop-blur-xl border-primary/20">
              <CardHeader>
                <CardTitle>Connect with Me</CardTitle>
                <CardDescription>
                  Follow my work and connect on social platforms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <a
                  href="https://www.linkedin.com/in/easonchen19/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group"
                >
                  <Linkedin className="w-5 h-5 text-blue-600 group-hover:text-blue-500" />
                  <div>
                    <p className="font-medium group-hover:text-primary transition-colors">LinkedIn</p>
                    <p className="text-sm text-muted-foreground">Professional profile</p>
                  </div>
                </a>
                
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group"
                >
                  <Github className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                  <div>
                    <p className="font-medium group-hover:text-primary transition-colors">GitHub</p>
                    <p className="text-sm text-muted-foreground">View my projects</p>
                  </div>
                </a>
              </CardContent>
            </Card>

            {/* About */}
            <Card className="bg-card/60 backdrop-blur-xl border-primary/20">
              <CardHeader>
                <CardTitle>About Eason</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  I'm passionate about building tools that enhance developer productivity and bridge the gap between AI and traditional coding workflows. 
                  Lovable Mate is designed to help developers work more efficiently with AI-powered insights.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;