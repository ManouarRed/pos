import React from 'react';

interface SlovakiaFlagIconProps extends React.SVGProps<SVGSVGElement> {}

export const SlovakiaFlagIcon: React.FC<SlovakiaFlagIconProps> = (props) => (
  <svg viewBox="0 0 900 600" width="20" height="15" {...props}>
    <rect width="900" height="600" fill="#fff"/>
    <rect width="900" height="400" fill="#0b4ea2"/>
    <rect width="900" height="200" fill="#ee1c25" y="400"/>
    <path d="M200 175 H 400 V 425 H 200 V 175 Z" fill="#fff" stroke="#0b4ea2" strokeWidth="10" />
    <path d="M300 200 L 300 400 M 225 250 H 375" stroke="#ee1c25" strokeWidth="30" />
    <path d="M300 125 L 250 175 L 350 175 Z" fill="#0b4ea2" />
  </svg>
);
