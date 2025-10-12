/**
 * Layout with Enhanced Navigation
 * Layout component that includes the enhanced navbar
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import EnhancedNavbar from '../components/navigation/EnhancedNavbar';
import { ThemeProvider } from '../lib/theme-context';

const LayoutWithNavbar = ({ children }) => {
  const [theme, setTheme] = useState('dark');

  return (
    <ThemeProvider value={{ theme, setTheme }}>
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0B0E11]' : 'bg-white'}`}>
        <EnhancedNavbar />
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          {children}
        </motion.main>
      </div>
    </ThemeProvider>
  );
};

export default LayoutWithNavbar;


