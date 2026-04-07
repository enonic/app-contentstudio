---
paths:
  - "**/*.tsx"
---

# Tailwind CSS & Styling Standards

## Class Name Utilities

### `cn` — Default Choice

```typescript
// ✅ Dynamic class combinations
const buttonClasses = cn(
    'px-4 py-2 rounded font-medium',
    disabled && 'opacity-50 cursor-not-allowed',
    variant === 'primary' && 'bg-blue-500 text-white',
    className, // Last — allows parent overrides
);

// ❌ className before other classes (overrides won't work)
const bad = cn(className, 'base-styles');

// ❌ Template literals for Tailwind classes
// ❌ cva for single conditions
```

### `cva` — Only for 2+ Variant Dimensions

```typescript
// ✅ Multiple variant dimensions
const buttonVariants = cva('px-4 py-2 rounded font-medium transition-colors', {
    variants: {
        variant: {
            primary: 'bg-blue-500 text-white hover:bg-blue-600',
            secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
            ghost: 'bg-transparent hover:bg-gray-100',
        },
        size: {
            sm: 'text-sm px-3 py-1',
            md: 'text-base px-4 py-2',
            lg: 'text-lg px-6 py-3',
        },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
});

// ❌ Don't use cva for simple true/false states
```

## Tailwind 4

```typescript
// ✅ Semantic color tokens
<div className="bg-primary text-primary-foreground" />

// ❌ Arbitrary CSS variable syntax when token exists
<div className="bg-[var(--color-overlay)]" /> // Use bg-overlay

// ✅ size-* for equal width/height
<Icon className="size-4" />  // Not h-4 w-4

// ✅ Logical properties
<div className="ps-4 me-2" />

// ✅ gap over space-x/y
<div className="flex gap-4" />

// ✅ Mobile-first responsive
<div className="text-sm md:text-base lg:text-lg" />
```

## Extract Classes to Variables When

- Complex conditional logic (3+ conditions)
- More than 6 classes on a single line, 4+ lines, or 80+ characters
- Reused in 2+ places in the same file

Keep inline when: simple static classes (up to 5), single condition, obvious connection.

## State-Based Styling

```typescript
// ✅ Data attributes
<li
    data-active={isActive}
    data-selected={isSelected}
    className="option data-[active=true]:bg-surface-neutral-hover data-[selected=true]:bg-surface-primary"
/>

// ❌ Complex class-based state selectors
```

## Anti-Patterns

```typescript
// ❌ String concatenation ('text-' + size) — breaks Tailwind compiler
// ❌ Conditional full class names in template literals
// ❌ Mixing Tailwind with inline styles
// ❌ Over-nesting conditional classes
// ❌ !important modifier everywhere
```
