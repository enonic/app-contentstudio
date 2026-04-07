---
paths:
  - "**/*.tsx"
---

# Preact Component Standards

## Imports

Always import from `react` (aliased to `preact/compat`), never directly from `preact`:

```typescript
// ✅ Correct
import { forwardRef, useState, type ReactElement, type ReactNode } from 'react';

// ❌ Wrong
import { forwardRef, useState } from 'preact';
import type { ComponentChildren } from 'preact';
```

Use `ReactNode` for children, not `ComponentChildren`.

This applies to component files, stories, and tests.

## forwardRef with ComponentPropsWithoutRef

```typescript
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

export type ButtonProps = {
    variant?: 'solid' | 'outline';
} & ComponentPropsWithoutRef<'button'>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'solid', children, ...props }, ref) => {
        return <button ref={ref} {...props}>{children}</button>;
    }
);
Button.displayName = 'Button';
```

## Radix UI Slot — Known Type Incompatibility

Preact's `ForwardedRef` type doesn't match Radix UI Slot's expected ref type. Works at runtime.

```typescript
<Comp
    // @ts-expect-error - Preact's ForwardedRef type is incompatible with Radix UI Slot's expected ref type
    ref={ref}
    {...props}
>
```

Use `@ts-expect-error` with explanation. Do not use `as any` or `as React.Ref<...>`.

## Best Practices

Follow the same patterns as React (see `react.md`):
- Functional components only
- Arrow functions need `displayName`
- Minimize `useEffect`, prefer derived state
- `useCallback`/`useMemo` only when needed
