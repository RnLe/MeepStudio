import { useCallback } from 'react';

/**
 * Hook to handle wheel events on number inputs without interfering with scrollable containers
 * Returns a function that creates wheel handlers for specific onChange callbacks
 */
export const useNumberInputWheel = () => {
  const createWheelHandler = useCallback((inputName: string, currentValue: number | string, setValue: (newValue: number) => void) => {
    return (e: React.WheelEvent<HTMLInputElement>) => {
      e.stopPropagation(); // Prevent bubbling to scrollable container
      e.preventDefault();
      
      const input = e.currentTarget;
      const step = Number(input.step) || (inputName?.includes('resolution') ? 1 : 0.01);
      const min = input.min !== '' ? Number(input.min) : -Infinity;
      const max = input.max !== '' ? Number(input.max) : Infinity;
      let value = Number(currentValue);
      if (isNaN(value)) value = 0;
      
      let newValue = value;
      if (e.deltaY < 0) {
        newValue = Math.min(max, value + step);
      } else if (e.deltaY > 0) {
        newValue = Math.max(min, value - step);
      }
      
      // Round to prevent floating point precision issues
      const precision = input.step ? Math.max(0, -Math.floor(Math.log10(Number(input.step)))) : 2;
      newValue = Math.round(newValue * Math.pow(10, precision)) / Math.pow(10, precision);
      
      // Call the state setter directly
      setValue(newValue);
    };
  }, []);

  // Legacy method for backward compatibility - but won't work properly
  const handleNumberInputWheel = useCallback((e: React.WheelEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Prevent bubbling to scrollable container
    e.preventDefault();
    
    const input = e.currentTarget;
    const step = Number(input.step) || (input.name?.includes('resolution') ? 1 : 0.01);
    const min = input.min !== '' ? Number(input.min) : -Infinity;
    const max = input.max !== '' ? Number(input.max) : Infinity;
    let value = Number(input.value);
    if (isNaN(value)) value = 0;
    
    let newValue = value;
    if (e.deltaY < 0) {
      newValue = Math.min(max, value + step);
    } else if (e.deltaY > 0) {
      newValue = Math.max(min, value - step);
    }
    
    // Round to prevent floating point precision issues
    const precision = input.step ? Math.max(0, -Math.floor(Math.log10(Number(input.step)))) : 2;
    newValue = Math.round(newValue * Math.pow(10, precision)) / Math.pow(10, precision);
    
    // Update the input value directly (this won't trigger React onChange)
    input.value = newValue.toString();
    
    console.warn('useNumberInputWheel: handleNumberInputWheel is deprecated, use createWheelHandler instead');
  }, []);

  return { createWheelHandler, handleNumberInputWheel };
};
