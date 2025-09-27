import React from 'react';
import { SEOHead } from '@/components/SEOHead';
import { SubscriptionAwareLayout } from '@/components/SubscriptionAwareLayout';
import DragDropProfileDesigner from '@/components/profile/DragDropProfileDesigner';

export default function ThemeDesigner() {
  return (
    <SubscriptionAwareLayout>
      <SEOHead 
        title="Theme Designer"
        description="Design your author profile with our drag and drop theme designer"
      />
      <DragDropProfileDesigner />
    </SubscriptionAwareLayout>
  );
}