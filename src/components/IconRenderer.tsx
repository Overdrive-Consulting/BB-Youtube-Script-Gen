
import React from 'react';
import { PenLine, Sparkles, CheckCircle, Clock, LucideProps } from 'lucide-react';

interface IconRendererProps extends LucideProps {
  iconName: 'PenLine' | 'Sparkles' | 'CheckCircle' | 'Clock';
}

const IconRenderer: React.FC<IconRendererProps> = ({ iconName, ...props }) => {
  switch (iconName) {
    case 'PenLine':
      return <PenLine {...props} />;
    case 'Sparkles':
      return <Sparkles {...props} />;
    case 'CheckCircle':
      return <CheckCircle {...props} />;
    case 'Clock':
      return <Clock {...props} />;
    default:
      return null;
  }
};

export default IconRenderer;
