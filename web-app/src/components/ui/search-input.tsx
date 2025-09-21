import React, { useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Input } from './input';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showClearButton?: boolean;
  debounceMs?: number;
}

const sizeClasses = {
  sm: 'h-8 text-sm',
  md: 'h-10 text-sm',
  lg: 'h-12 text-base',
};

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  className,
  size = 'md',
  showClearButton = true,
  debounceMs = 300,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // Debounce search
  React.useEffect(() => {
    if (!onSearch || !value) return;
    
    const timeoutId = setTimeout(() => {
      onSearch(value);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [value, onSearch, debounceMs]);

  const handleClear = () => {
    onChange('');
    if (onSearch) {
      onSearch('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <MagnifyingGlassIcon 
          className={cn(
            "text-gray-400 transition-colors",
            size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5',
            isFocused && "text-blue-500"
          )} 
          aria-hidden="true" 
        />
      </div>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={cn(
          "pl-10",
          sizeClasses[size],
          showClearButton && value && "pr-10"
        )}
      />
      {showClearButton && value && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors cursor-pointer"
          >
            <span className="sr-only">Clear search</span>
            <XMarkIcon 
              className={cn(
                size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5',
                "cursor-pointer"
              )} 
              aria-hidden="true" 
            />
          </button>
        </div>
      )}
    </div>
  );
};