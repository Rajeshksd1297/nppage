import { useEffect } from 'react';
import { updateSEO, SEOConfig } from '@/utils/seo';

interface SEOHeadProps extends SEOConfig {}

export const SEOHead: React.FC<SEOHeadProps> = (props) => {
  useEffect(() => {
    updateSEO(props);
  }, [props]);

  return null;
};