'use client';

import { usePathname } from 'next/navigation';
import EnhancedNavbar from './EnhancedNavbar';

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Hide navbar only on auth pages and landing page
  const hideNavbar = 
    pathname?.startsWith('/auth/') || 
    pathname === '/';
  
  if (hideNavbar) {
    return null;
  }
  
  return <EnhancedNavbar />;
}

