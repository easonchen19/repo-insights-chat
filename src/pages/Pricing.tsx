import { PricingCards } from "@/components/PricingCards";

const Pricing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock the full potential of AI-powered code analysis and generation
          </p>
        </div>
        
        <PricingCards />
        
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">
            All plans include access to our core features
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span>✓ AI Code Analysis</span>
            <span>✓ GitHub Integration</span>
            <span>✓ Project Management</span>
            <span>✓ 24/7 Support</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;