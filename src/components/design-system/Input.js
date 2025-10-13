/**
 * Enhanced Input Component
 * Modern input with variants, states, and animations
 */

'use client';

import { motion } from 'framer-motion';
import { forwardRef, useState } from 'react';
import clsx from 'clsx';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

const Input = forwardRef(({
  label,
  error,
  success,
  helperText,
  icon,
  iconPosition = 'left',
  type = 'text',
  variant = 'default',
  size = 'md',
  disabled = false,
  className,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const baseClasses = 'w-full rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:focus:border-blue-400',
    error: 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400',
    success: 'border-green-500 focus:border-green-500 focus:ring-green-500 dark:border-green-400'
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const getVariant = () => {
    if (error) return 'error';
    if (success) return 'success';
    return variant;
  };

  const getIconColor = () => {
    if (error) return 'text-red-500';
    if (success) return 'text-green-500';
    return 'text-gray-400';
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <span className={getIconColor()}>{icon}</span>
          </div>
        )}
        
        <motion.input
          ref={ref}
          type={inputType}
          className={clsx(
            baseClasses,
            variants[getVariant()],
            sizes[size],
            icon && iconPosition === 'left' ? 'pl-10' : '',
            icon && iconPosition === 'right' ? 'pr-10' : '',
            isPassword ? 'pr-20' : '',
            className
          )}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        
        {icon && iconPosition === 'right' && !isPassword && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <span className={getIconColor()}>{icon}</span>
          </div>
        )}
        
        {isPassword && (
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
        
        {error && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <AlertCircle size={16} className="text-red-500" />
          </div>
        )}
        
        {success && !error && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <CheckCircle size={16} className="text-green-500" />
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-2"
        >
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          {helperText && !error && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
          )}
        </motion.div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;



