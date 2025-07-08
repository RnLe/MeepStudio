# Number Input Wheel Scroll Fix

This solution prevents mouse wheel events on number inputs from scrolling the parent sidebar while still allowing the wheel to change input values.

## Problem

When using number inputs with wheel event handlers inside a scrollable container (like the right sidebar), scrolling to change the number value would also scroll the sidebar, causing the input to lose focus and stop responding to wheel events.

## Solution

### 1. Scroll Event Prevention in Parent Container

The `RightSidebar.tsx` component now includes a wheel event handler that:
- Detects when wheel events occur over number inputs
- Prevents the event from bubbling to the scrollable container
- Checks for `data-prevents-scroll` attributes and CSS classes

### 2. Number Input Hook

The `useNumberInputWheel` hook provides a standardized way to handle wheel events on number inputs:
- Prevents event bubbling with `e.stopPropagation()`
- Increments/decrements values based on wheel direction
- Respects min/max/step attributes
- Handles floating point precision
- Triggers React state updates properly

### 3. Dial Component Updates

The `Dial` component now:
- Has `data-prevents-scroll="true"` attribute
- Includes `dial-container` and `prevent-scroll` CSS classes
- Calls `e.stopPropagation()` on wheel events

## Usage

### Using the Hook

```tsx
import { useNumberInputWheel } from '../hooks/useNumberInputWheel';

const MyComponent = () => {
  const { handleNumberInputWheel } = useNumberInputWheel();
  
  return (
    <input
      type="number"
      onWheel={handleNumberInputWheel}
      // other props...
    />
  );
};
```

### Using the NumberInput Component

```tsx
import NumberInput from '../components/NumberInput';

const MyComponent = () => {
  return (
    <NumberInput
      value={myValue}
      onChange={handleChange}
      step={0.01}
      min={0}
      max={100}
    />
  );
};
```

## Components Updated

- ✅ `RightSidebar.tsx` - Main scroll prevention logic
- ✅ `RightProjectPanel.tsx` - Project property inputs  
- ✅ `GaussianSourceProperties.tsx` - Source property inputs
- ✅ `Dial.tsx` - Custom dial component
- ✅ `useNumberInputWheel.ts` - Reusable hook
- ✅ `NumberInput.tsx` - Wrapper component

## Future Property Panels

For any new property panels with number inputs, either:
1. Import and use `useNumberInputWheel` hook
2. Use the `NumberInput` component instead of regular `<input type="number">`
3. Add `data-prevents-scroll="true"` attribute to prevent scrolling

The solution is backwards compatible and doesn't affect existing functionality.
