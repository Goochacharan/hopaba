
import React from 'react';
import { Shield, MapPin, Check, AlertCircle, Eye } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const SafeTradingTips = () => {
  return (
    <Card className="shadow-sm border-amber-100 bg-amber-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5 text-amber-600" />
          Safe Trading Tips
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          <li className="flex gap-2">
            <MapPin className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="text-sm">Meet in a public, well-lit place for exchanges</span>
          </li>
          <li className="flex gap-2">
            <Check className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="text-sm">Verify the item before completing the purchase</span>
          </li>
          <li className="flex gap-2">
            <Eye className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="text-sm">Inspect thoroughly and test if possible</span>
          </li>
          <li className="flex gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="text-sm">Be cautious of deals that seem too good to be true</span>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
};

export default SafeTradingTips;
