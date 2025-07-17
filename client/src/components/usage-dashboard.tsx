import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import UsageSection from './usage-section';

interface UsageDashboardProps {
  onBack: () => void;
}

const UsageDashboard: React.FC<UsageDashboardProps> = ({ onBack }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
      
      <UsageSection />
    </div>
  );
};

export default UsageDashboard;