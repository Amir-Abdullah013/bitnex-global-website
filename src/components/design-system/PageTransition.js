/**
 * Enhanced Page Transition Component
 * Smooth page transitions with Framer Motion
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const PageTransition = ({ children, className = '' }) => {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  const pageVariants = {
    initial: { 
      opacity: 0, 
      y: 20,
      scale: 0.98
    },
    in: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    out: { 
      opacity: 0, 
      y: -20,
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: 'easeIn'
      }
    }
  };

  const loadingVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    <>
      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={loadingVariants}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900"
          >
            <div className="flex flex-col items-center space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
              />
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          className={className}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
};

// Slide Transition
export const SlideTransition = ({ children, direction = 'right' }) => {
  const pathname = usePathname();

  const slideVariants = {
    initial: (direction) => ({
      x: direction === 'left' ? -300 : 300,
      opacity: 0
    }),
    in: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    out: (direction) => ({
      x: direction === 'left' ? 300 : -300,
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: 'easeIn'
      }
    })
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        custom={direction}
        initial="initial"
        animate="in"
        exit="out"
        variants={slideVariants}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Fade Transition
export const FadeTransition = ({ children }) => {
  const pathname = usePathname();

  const fadeVariants = {
    initial: { opacity: 0 },
    in: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    out: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={fadeVariants}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Scale Transition
export const ScaleTransition = ({ children }) => {
  const pathname = usePathname();

  const scaleVariants = {
    initial: { 
      scale: 0.8,
      opacity: 0
    },
    in: { 
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    out: { 
      scale: 1.1,
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: 'easeIn'
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={scaleVariants}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Staggered Transition
export const StaggeredTransition = ({ children, stagger = 0.1 }) => {
  const pathname = usePathname();

  const containerVariants = {
    initial: { opacity: 0 },
    in: {
      opacity: 1,
      transition: {
        staggerChildren: stagger
      }
    },
    out: {
      opacity: 0,
      transition: {
        staggerChildren: stagger / 2,
        staggerDirection: -1
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    in: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    },
    out: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.2 }
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;

