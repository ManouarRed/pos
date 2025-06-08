import React from 'react';

interface ReceiptIconProps extends React.SVGProps<SVGSVGElement> {}

export const ReceiptIcon: React.FC<ReceiptIconProps> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className="w-5 h-5" 
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-12v.75m0 3v.75m0 3v.75m0 3V18m-3 .75h18A2.25 2.25 0 0021 16.5V7.5A2.25 2.25 0 0018.75 6H3.75A2.25 2.25 0 001.5 7.5v9A2.25 2.25 0 003.75 18.75H6" />
  </svg>
);
