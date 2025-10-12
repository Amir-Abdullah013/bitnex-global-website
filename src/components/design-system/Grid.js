/**
 * Enhanced Grid System
 * Modern grid components with responsive design
 */

'use client';

import { motion } from 'framer-motion';
import { forwardRef } from 'react';
import clsx from 'clsx';

// Container Component
export const Container = forwardRef(({
  as: Component = 'div',
  size = 'lg',
  className,
  children,
  ...props
}, ref) => {
  const sizes = {
    sm: 'max-w-3xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full'
  };

  return (
    <Component
      ref={ref}
      className={clsx(
        'mx-auto px-4 sm:px-6 lg:px-8',
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

Container.displayName = 'Container';

// Grid Component
export const Grid = forwardRef(({
  as: Component = 'div',
  cols = 1,
  gap = 'md',
  className,
  children,
  ...props
}, ref) => {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
    auto: 'grid-cols-auto'
  };

  const gapClasses = {
    none: 'gap-0',
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  return (
    <Component
      ref={ref}
      className={clsx(
        'grid',
        colClasses[cols],
        gapClasses[gap],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

Grid.displayName = 'Grid';

// Flex Component
export const Flex = forwardRef(({
  as: Component = 'div',
  direction = 'row',
  align = 'start',
  justify = 'start',
  wrap = false,
  gap = 'md',
  className,
  children,
  ...props
}, ref) => {
  const directions = {
    row: 'flex-row',
    col: 'flex-col',
    'row-reverse': 'flex-row-reverse',
    'col-reverse': 'flex-col-reverse'
  };

  const aligns = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline'
  };

  const justifies = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  const gapClasses = {
    none: 'gap-0',
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  return (
    <Component
      ref={ref}
      className={clsx(
        'flex',
        directions[direction],
        aligns[align],
        justifies[justify],
        wrap && 'flex-wrap',
        gapClasses[gap],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

Flex.displayName = 'Flex';

// Stack Component
export const Stack = forwardRef(({
  as: Component = 'div',
  spacing = 'md',
  align = 'start',
  className,
  children,
  ...props
}, ref) => {
  const spacingClasses = {
    none: 'space-y-0',
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8'
  };

  const aligns = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  return (
    <Component
      ref={ref}
      className={clsx(
        'flex flex-col',
        spacingClasses[spacing],
        aligns[align],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

Stack.displayName = 'Stack';

// Animated Grid Component
export const AnimatedGrid = ({ 
  children, 
  stagger = 0.1,
  className,
  ...props 
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
      {...props}
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          variants={itemVariants}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

// Responsive Grid Component
export const ResponsiveGrid = forwardRef(({
  as: Component = 'div',
  breakpoints = {
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4
  },
  gap = 'md',
  className,
  children,
  ...props
}, ref) => {
  const getGridClasses = () => {
    const classes = ['grid'];
    
    // Add gap
    const gapClasses = {
      none: 'gap-0',
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8'
    };
    classes.push(gapClasses[gap]);
    
    // Add responsive columns
    if (breakpoints.sm) classes.push(`grid-cols-${breakpoints.sm}`);
    if (breakpoints.md) classes.push(`md:grid-cols-${breakpoints.md}`);
    if (breakpoints.lg) classes.push(`lg:grid-cols-${breakpoints.lg}`);
    if (breakpoints.xl) classes.push(`xl:grid-cols-${breakpoints.xl}`);
    
    return classes.join(' ');
  };

  return (
    <Component
      ref={ref}
      className={clsx(getGridClasses(), className)}
      {...props}
    >
      {children}
    </Component>
  );
});

ResponsiveGrid.displayName = 'ResponsiveGrid';

// Card Grid Component
export const CardGrid = ({ 
  children, 
  columns = 3,
  gap = 'md',
  className,
  ...props 
}) => {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
  };

  const gapClasses = {
    none: 'gap-0',
    xs: 'gap-2',
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  return (
    <div
      className={clsx(
        'grid',
        colClasses[columns],
        gapClasses[gap],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default {
  Container,
  Grid,
  Flex,
  Stack,
  AnimatedGrid,
  ResponsiveGrid,
  CardGrid
};


