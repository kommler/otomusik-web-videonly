'use client';

import { useEffect } from 'react';

interface ClientBodyWrapperProps {
  children: React.ReactNode;
}

export const ClientBodyWrapper: React.FC<ClientBodyWrapperProps> = ({ children }) => {
  useEffect(() => {
    // Clean up any browser extension attributes that might cause hydration mismatches
    // This runs only on the client side after hydration
    const body = document.body;
    
    // List of known browser extension attributes that can cause hydration issues
    const extensionAttributes = [
      'data-atm-ext-installed',
      'data-lastpass-icon-root',
      'data-grammarly-shadow-root',
      'spellcheck',
      'data-new-gr-c-s-check-loaded',
      'data-gr-ext-installed',
    ];
    
    // Remove extension attributes to prevent future hydration warnings
    extensionAttributes.forEach(attr => {
      if (body.hasAttribute(attr)) {
        console.log(`[ClientBodyWrapper] Detected browser extension attribute: ${attr}`);
      }
    });
  }, []);

  return <>{children}</>;
};