
import React from 'react';

interface SortAscIconProps extends React.SVGProps<SVGSVGElement> {}

export const SortAscIcon: React.FC<SortAscIconProps> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className="w-5 h-5" 
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h1.5m0 0V3m0 1.5H3m1.5 0h1.5m3-1.5h9M3 9h1.5m0 0V7.5m0 1.5H3m1.5 0H6m-3 4.5h1.5m0 0V12m0 1.5H3m1.5 0h1.5m3 0h9M3 18h1.5m0 0v-1.5m0 1.5H3m1.5 0H6m-3 4.5h1.5m0 0v-1.5m0 1.5H3m1.5 0H6m6-10.5v15m0 0l-3.75-3.75M12 19.5l3.75-3.75" />
  </svg>
);
