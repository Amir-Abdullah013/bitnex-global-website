'use client';

import { usePathname } from 'next/navigation';
import EnhancedNavbar from './EnhancedNavbar';

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Hide navbar on auth pages, landing page, and user pages
  const hideNavbar = 
    pathname?.startsWith('/auth/') || 
    pathname === '/' ||
    pathname?.startsWith('/user/') ||
    pathname?.startsWith('/admin/') ||
    pathname?.startsWith('/plans');
  
  if (hideNavbar) {
    return null;
  }
  
  return <EnhancedNavbar />;
}

