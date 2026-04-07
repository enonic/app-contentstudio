---
paths:
  - "**/index.ts"
  - "**/index.tsx"
---

# Component Structure Standards

## Component Folder Structure

```
component/
├── component.stories.tsx
├── component.tsx
└── index.ts
```

## Export Standards

### Component's `index.ts`

Components first, types second:

```typescript
// ✅ Separate exports
export { MyComponent } from './my-component';
export type { MyComponentProps } from './my-component';

// ⚠️ Acceptable but separate is preferred
export { MyComponent, type MyComponentProps } from './my-component';

// ❌ Missing type export
export { MyComponent } from './my-component';
```

### `src/components/index.ts`

Re-export all component folders:

```typescript
export * from './button';
export * from './modal';
export * from './user-card';
```

## Context Provider Structure

Extract to `src/providers/` with: value type, context (`undefined` default), provider component, custom hook.

```typescript
// src/providers/menu-provider.tsx
import { createContext, type ReactElement, type ReactNode, useContext } from 'react';

export type MenuContextValue = {
    open: boolean;
    setOpen: (open: boolean) => void;
};

const MenuContext = createContext<MenuContextValue | undefined>(undefined);

export type MenuProviderProps = {
    value: MenuContextValue;
    children?: ReactNode;
};

export const MenuProvider = ({ value, children }: MenuProviderProps): ReactElement => {
    return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
};

export const useMenu = (): MenuContextValue => {
    const context = useContext(MenuContext);
    if (!context) {
        throw new Error('useMenu must be used within a MenuProvider');
    }
    return context;
};
```

```typescript
// ❌ Context in component file, null default
const MenuContext = createContext<MenuContextValue | null>(null);
```
