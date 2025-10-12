'use client';

import { forwardRef } from 'react';

const Card = forwardRef(({ 
  children,
  title,
  subtitle,
  header,
  footer,
  variant = 'default',
  padding = 'md',
  className = '',
  hover = false,
  ...props 
}, ref) => {
  const baseClasses = 'bg-binance-surface rounded-lg border transition-all duration-200';
  
  const variants = {
    default: 'border-binance-border',
    elevated: 'border-binance-border shadow-lg',
    outlined: 'border-binance-border',
    filled: 'border-binance-border bg-binance-surfaceHover',
    primary: 'border-binance-primary/20 bg-binance-primary/5',
    success: 'border-binance-green/20 bg-binance-green/5',
    warning: 'border-primary-400/20 bg-primary-400/5',
    error: 'border-binance-red/20 bg-binance-red/5'
  };
  
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };
  
  const hoverClasses = hover ? 'hover:border-binance-primary/50 cursor-pointer' : '';
  
  const cardClasses = `${baseClasses} ${variants[variant]} ${paddingClasses[padding]} ${hoverClasses} ${className}`;
  
  return (
    <div
      ref={ref}
      className={cardClasses}
      {...props}
    >
      {(title || subtitle || header) && (
        <div className="mb-4">
          {header && <div className="mb-2">{header}</div>}
          {title && (
            <h3 className="text-base font-semibold text-binance-textPrimary">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs text-binance-textSecondary mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      <div className="flex-1">
        {children}
      </div>
      
      {footer && (
        <div className="mt-4 pt-4 border-t border-binance-border">
          {footer}
        </div>
      )}
    </div>
  );
});

Card.displayName = 'Card';

// Card sub-components for better composition
const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`text-base font-semibold text-binance-textPrimary ${className}`} {...props}>
    {children}
  </h3>
);

const CardSubtitle = ({ children, className = '', ...props }) => (
  <p className={`text-xs text-binance-textSecondary mt-1 ${className}`} {...props}>
    {children}
  </p>
);

const CardContent = ({ children, className = '', ...props }) => (
  <div className={`flex-1 ${className}`} {...props}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`mt-4 pt-4 border-t border-binance-border ${className}`} {...props}>
    {children}
  </div>
);

// Export all components
export default Card;
export { CardHeader, CardTitle, CardSubtitle, CardContent, CardFooter };
