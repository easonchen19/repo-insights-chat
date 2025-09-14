import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SUBSCRIPTION_TIERS } from "@/lib/subscription";
import { toast } from "sonner";

export const PricingCards = () => {
  const { user, session, subscription } = useAuth();

  const handleSubscribe = async (priceId: string, tierName: string) => {
    if (!user || !session) {
      toast.error("Please sign in to subscribe");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error("Failed to start checkout process");
    }
  };

  const handleManageSubscription = async () => {
    if (!user || !session) {
      toast.error("Please sign in to manage subscription");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error("Failed to open customer portal");
    }
  };

  const getCurrentTier = () => subscription?.tier || 'free';

  return (
    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => {
        const isCurrentTier = getCurrentTier() === key;
        const isFree = key === 'free';
        
        return (
          <Card key={key} className={`relative ${isCurrentTier ? 'border-primary shadow-lg' : ''}`}>
            {isCurrentTier && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                Your Plan
              </Badge>
            )}
            
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{tier.name}</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold">${tier.price}</span>
                {!isFree && <span className="text-muted-foreground">/month</span>}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Up to {tier.features.projects} project{tier.features.projects > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{tier.features.prompts}</span>
                </div>
                {tier.features.customPrompts && (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Custom prompt generation</span>
                  </div>
                )}
                {tier.features.premiumPrompts > 0 && (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{tier.features.premiumPrompts} premium prompts/month</span>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter>
              {isCurrentTier ? (
                <div className="w-full space-y-2">
                  <Button className="w-full" disabled>
                    Current Plan
                  </Button>
                  {!isFree && (
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={handleManageSubscription}
                    >
                      Manage Subscription
                    </Button>
                  )}
                </div>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={() => handleSubscribe(tier.price_id, tier.name)}
                  disabled={!user}
                >
                  {isFree ? 'Free Forever' : `Subscribe to ${tier.name}`}
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};