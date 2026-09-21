import React from 'react';
import { CourierType } from '../types';
import { DtdcLogo } from './DtdcLogo';
import { BlueDartLogo } from './BlueDartLogo';
import { DelhiveryLogo } from './DelhiveryLogo';

interface CourierLogoProps {
  courier: CourierType;
  className?: string;
  customLogoUrl?: string | null;
}

export const CourierLogo: React.FC<CourierLogoProps> = ({
  courier,
  className = 'h-8',
  customLogoUrl,
}) => {
  if (courier === 'BLUEDART') {
    return <BlueDartLogo className={className} customLogoUrl={customLogoUrl} />;
  }
  if (courier === 'DELHIVERY') {
    return <DelhiveryLogo className={className} customLogoUrl={customLogoUrl} />;
  }
  return <DtdcLogo className={className} customLogoUrl={customLogoUrl} />;
};
