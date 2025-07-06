# DEPRECATED Service Files

These files are deprecated and no longer used in the new streamlined architecture:

- `projectService.ts` - Had mixed localStorage/remote implementations with React Query
- `meepProjectService.ts` - File-based storage implementation

## New Architecture

Now a clean separation is used:

1. **Data Storage**: `ProjectsStore` (Zustand) with automatic localStorage persistence
2. **UI State**: `EditorStateStore` (Zustand) for UI-only state  
3. **Visual State**: `LatticeStore` (Zustand) for canvas/visual state
4. **Data Access**: `useMeepProjects()` hook provides direct store access

## Migration

- Replace `useMeepProjects({ ghPages: true })` with `useMeepProjects()`
- Remove React Query dependencies
- Use stores directly for data access
- No manual localStorage calls needed (automatic via Zustand persist)
