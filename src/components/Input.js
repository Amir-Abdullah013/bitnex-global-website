'use client';

import { forwardRef, useState } from 'react';

const Input = forwardRef(({ 
  label,
  error,
  helperText,
  success,
  leftIcon,
  rightIcon,
  size = 'md',
  variant = 'default',
  className = '',
  labelClassName = '',
  ...props 
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const baseInputClasses = 'block w-full border rounded-lg transition-all duration-200 focus:outline-none disabled:bg-binance-surface disabled:text-binance-textTertiary disabled:cursor-not-allowed bg-binance-background text-binance-textPrimary';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2.5 text-sm'
  };
  
  const variantClasses = {
    default: error 
      ? 'border-binance-red focus:ring-1 focus:ring-binance-red focus:border-binance-red' 
      : success 
        ? 'border-binance-green focus:ring-1 focus:ring-binance-green focus:border-binance-green'
        : 'border-binance-border focus:ring-1 focus:ring-binance-primary focus:border-binance-primary hover:border-binance-textTertiary',
    filled: error
      ? 'border-binance-red bg-binance-red/10 focus:ring-1 focus:ring-binance-red focus:border-binance-red'
      : success
        ? 'border-binance-green bg-binance-green/10 focus:ring-1 focus:ring-binance-green focus:border-binance-green'
        : 'border-binance-border bg-binance-surface focus:ring-1 focus:ring-binance-primary focus:border-binance-primary'
  };
  
  const inputClasses = `${baseInputClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  
  const labelClasses = `
    block text-xs font-medium mb-1.5 transition-colors duration-200
    ${error ? 'text-binance-red' : success ? 'text-binance-green' : 'text-binance-textSecondary'}
    ${labelClassName}
  `.trim();
  
  const iconClasses = 'absolute inset-y-0 flex items-center pointer-events-none';
  const leftIconClasses = `${iconClasses} left-0 pl-3 text-binance-textTertiary`;
  const rightIconClasses = `${iconClasses} right-0 pr-3 text-binance-textTertiary`;
  
  return (
    <div className="w-full">
      {label && (
        <label className={labelClasses}>
          {label}
          {props.required && <span className="text-binance-red ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className={leftIconClasses}>
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          className={`${inputClasses} ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''}`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {rightIcon && (
          <div className={rightIconClasses}>
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-1.5 flex items-center">
          <svg className="h-3.5 w-3.5 text-binance-red mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-binance-red">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mt-1.5 flex items-center">
          <svg className="h-3.5 w-3.5 text-binance-green mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-binance-green">{success}</p>
        </div>
      )}
      
      {helperText && !error && !success && (
        <p className="mt-1.5 text-xs text-binance-textTertiary">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
