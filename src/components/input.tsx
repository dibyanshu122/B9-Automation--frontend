import React from 'react';
import clsx from 'clsx';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    error,
    helpText,
    className,
    icon,
    type = 'text',
    showPasswordToggle = false,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const inputType = showPasswordToggle && showPassword ? 'text' : type;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {props.required && <span className="text-red-500">*</span>}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            type={inputType}
            className={clsx(
              'w-full px-4 py-2.5 border rounded-lg',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'transition-all duration-200',
              'placeholder:text-gray-400',
              icon && 'pl-10',
              error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300',
              'disabled:bg-gray-50 disabled:text-gray-500',
              className
            )}
            {...props}
          />
          
          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
        
        {error && <p className="text-red-500 text-sm mt-1.5">{error}</p>}
        {helpText && !error && <p className="text-gray-500 text-sm mt-1.5">{helpText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';