/**
 * Binance-Style Input Component
 * Input component with Binance dark theme styling
 */

'use client';

import { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

const BinanceInput = forwardRef(({
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
    default: 'bg-[#2B3139] border-[#3C4043] text-[#EAECEF] focus:border-[#F0B90B] focus:ring-[#F0B90B]/20',
    error: 'bg-[#2B3139] border-[#F6465D] text-[#EAECEF] focus:border-[#F6465D] focus:ring-[#F6465D]/20',
    success: 'bg-[#2B3139] border-[#0ECB81] text-[#EAECEF] focus:border-[#0ECB81] focus:ring-[#0ECB81]/20'
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
    if (error) return 'text-[#F6465D]';
    if (success) return 'text-[#0ECB81]';
    return 'text-[#B7BDC6]';
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#EAECEF] mb-2">
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
          className={`
            ${baseClasses}
            ${variants[getVariant()]}
            ${sizes[size]}
            ${icon && iconPosition === 'left' ? 'pl-10' : ''}
            ${icon && iconPosition === 'right' ? 'pr-10' : ''}
            ${isPassword ? 'pr-20' : ''}
            ${className}
          `}
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
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#B7BDC6] hover:text-[#EAECEF] transition-colors"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
        
        {error && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <AlertCircle size={16} className="text-[#F6465D]" />
          </div>
        )}
        
        {success && !error && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <CheckCircle size={16} className="text-[#0ECB81]" />
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
            <p className="text-sm text-[#F6465D]">{error}</p>
          )}
          {helperText && !error && (
            <p className="text-sm text-[#B7BDC6]">{helperText}</p>
          )}
        </motion.div>
      )}
    </div>
  );
});

BinanceInput.displayName = 'BinanceInput';

export default BinanceInput;


