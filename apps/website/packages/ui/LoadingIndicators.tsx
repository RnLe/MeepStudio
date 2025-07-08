import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Animated loading spinner for code generation
 */
export function LoadingIndicator({ size = 'md', className = '' }: LoadingIndicatorProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-6 h-6'
  };

  return (
    <Loader2 
      className={`animate-spin text-blue-400 ${sizeClasses[size]} ${className}`}
    />
  );
}

interface CodeGenerationStatusProps {
  status: 'pending' | 'generating' | 'complete' | 'error';
  error?: string;
  className?: string;
}

/**
 * Status indicator for code section generation
 */
export function CodeGenerationStatus({ status, error, className = '' }: CodeGenerationStatusProps) {
  switch (status) {
    case 'generating':
      return <LoadingIndicator size="sm" className={className} />;
    
    case 'complete':
      return (
        <div className={`w-3 h-3 rounded-full bg-green-500 ${className}`} title="Generated" />
      );
    
    case 'error':
      return (
        <div 
          className={`w-3 h-3 rounded-full bg-red-500 ${className}`} 
          title={error || 'Generation failed'}
        />
      );
    
    case 'pending':
    default:
      return (
        <div className={`w-3 h-3 rounded-full bg-gray-500 ${className}`} title="Pending" />
      );
  }
}

interface GeneratingCodePlaceholderProps {
  sectionName: string;
  className?: string;
}

/**
 * Placeholder content shown while code is generating
 */
export function GeneratingCodePlaceholder({ sectionName, className = '' }: GeneratingCodePlaceholderProps) {
  return (
    <div className={`flex items-center space-x-3 py-8 ${className}`}>
      <LoadingIndicator size="md" />
      <div className="text-gray-400">
        <div className="text-sm font-medium">Generating {sectionName} code...</div>
        <div className="text-xs text-gray-500 mt-1">Please wait while the code is being assembled</div>
      </div>
    </div>
  );
}
