import React from 'react';
import { useNumberInputWheel } from '../../hooks/useNumberInputWheel';

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  type: 'number';
  className?: string;
}

/**
 * NumberInput component that prevents wheel scrolling from affecting parent scrollable containers
 * while still allowing the wheel to change the input value when focused/hovered.
 * 
 * This component automatically handles:
 * - Preventing wheel event bubbling to scrollable parents
 * - Incrementing/decrementing values with mouse wheel
 * - Respecting min/max/step attributes
 * - Maintaining precision based on step value
 */
export const NumberInput: React.FC<NumberInputProps> = ({ 
  className = '', 
  ...props 
}) => {
  const { handleNumberInputWheel } = useNumberInputWheel();

  return (
    <input
      {...props}
      type="number"
      className={className}
      onWheel={handleNumberInputWheel}
      data-prevents-scroll="true"
    />
  );
};

export default NumberInput;
