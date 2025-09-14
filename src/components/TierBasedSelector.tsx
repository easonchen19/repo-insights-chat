import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { SUBSCRIPTION_TIERS } from "@/lib/subscription";

interface TierBasedSelectorProps {
  onSelectionChange: (count: number) => void;
  label?: string;
  defaultValue?: number;
}

export const TierBasedSelector = ({ 
  onSelectionChange, 
  label = "Items to display",
  defaultValue 
}: TierBasedSelectorProps) => {
  const { subscription } = useAuth();
  const currentTier = subscription?.tier || 'free';
  const maxItems = SUBSCRIPTION_TIERS[currentTier].features.projects;
  
  const [selectedCount, setSelectedCount] = useState(
    defaultValue || Math.min(1, maxItems)
  );

  const handleChange = (value: string) => {
    const count = parseInt(value);
    setSelectedCount(count);
    onSelectionChange(count);
  };

  const getOptions = () => {
    const options = [];
    for (let i = 1; i <= maxItems; i++) {
      options.push(i);
    }
    return options;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor="tier-selector">{label}</Label>
        <Badge variant="outline" className="text-xs">
          {SUBSCRIPTION_TIERS[currentTier].name} - Max {maxItems}
        </Badge>
      </div>
      <Select value={selectedCount.toString()} onValueChange={handleChange}>
        <SelectTrigger id="tier-selector" className="w-[180px]">
          <SelectValue placeholder="Select count" />
        </SelectTrigger>
        <SelectContent>
          {getOptions().map((count) => (
            <SelectItem key={count} value={count.toString()}>
              {count} item{count > 1 ? 's' : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};