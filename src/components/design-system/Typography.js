/**
 * Enhanced Typography System
 * Modern typography components with consistent spacing and hierarchy
 */

'use client';

import { motion } from 'framer-motion';
import { forwardRef } from 'react';
import clsx from 'clsx';

// Heading Components
export const Heading = forwardRef(({
  as: Component = 'h1',
  size = 'xl',
  weight = 'bold',
  color = 'default',
  className,
  children,
  ...props
}, ref) => {
  const sizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
    '6xl': 'text-6xl'
  };

  const weights = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold'
  };

  const colors = {
    default: 'text-gray-900 dark:text-white',
    muted: 'text-gray-600 dark:text-gray-400',
    primary: 'text-blue-600 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400'
  };

  return (
    <Component
      ref={ref}
      className={clsx(
        sizes[size],
        weights[weight],
        colors[color],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

Heading.displayName = 'Heading';

// Text Components
export const Text = forwardRef(({
  as: Component = 'p',
  size = 'base',
  weight = 'normal',
  color = 'default',
  align = 'left',
  className,
  children,
  ...props
}, ref) => {
  const sizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const weights = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  };

  const colors = {
    default: 'text-gray-900 dark:text-white',
    muted: 'text-gray-600 dark:text-gray-400',
    primary: 'text-blue-600 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400'
  };

  const aligns = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify'
  };

  return (
    <Component
      ref={ref}
      className={clsx(
        sizes[size],
        weights[weight],
        colors[color],
        aligns[align],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

Text.displayName = 'Text';

// Animated Text Component
export const AnimatedText = ({ 
  children, 
  delay = 0, 
  duration = 0.5,
  className,
  ...props 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Code Component
export const Code = forwardRef(({
  as: Component = 'code',
  variant = 'default',
  className,
  children,
  ...props
}, ref) => {
  const variants = {
    default: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1 rounded text-sm font-mono',
    block: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-lg text-sm font-mono block w-full overflow-x-auto'
  };

  return (
    <Component
      ref={ref}
      className={clsx(variants[variant], className)}
      {...props}
    >
      {children}
    </Component>
  );
});

Code.displayName = 'Code';

// Link Component
export const Link = forwardRef(({
  as: Component = 'a',
  variant = 'default',
  className,
  children,
  ...props
}, ref) => {
  const variants = {
    default: 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline-offset-4 hover:underline transition-colors',
    muted: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors',
    button: 'inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
  };

  return (
    <Component
      ref={ref}
      className={clsx(variants[variant], className)}
      {...props}
    >
      {children}
    </Component>
  );
});

Link.displayName = 'Link';

// Badge Component
export const Badge = forwardRef(({
  variant = 'default',
  size = 'sm',
  className,
  children,
  ...props
}, ref) => {
  const variants = {
    default: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white',
    primary: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    success: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    warning: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    danger: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
  };

  const sizes = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm'
  };

  return (
    <span
      ref={ref}
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

// Quote Component
export const Quote = forwardRef(({
  as: Component = 'blockquote',
  variant = 'default',
  className,
  children,
  ...props
}, ref) => {
  const variants = {
    default: 'border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-700 dark:text-gray-300',
    primary: 'border-l-4 border-blue-500 pl-4 italic text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-r-lg'
  };

  return (
    <Component
      ref={ref}
      className={clsx(variants[variant], className)}
      {...props}
    >
      {children}
    </Component>
  );
});

Quote.displayName = 'Quote';

export default {
  Heading,
  Text,
  AnimatedText,
  Code,
  Link,
  Badge,
  Quote
};


