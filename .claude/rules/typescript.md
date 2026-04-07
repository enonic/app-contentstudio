---
paths:
  - "**/*.{ts,tsx}"
---

# TypeScript Coding Standards

## Code Style

```typescript
// ✅ Spaces inside {} in imports, types, objects, destructuring
import { Data } from './components/Button';
type Id = { id: string };
const { foo } = bar;

// ✅ Single quotes preferred
import { atom } from 'nanostores';

// ✅ Check both null and undefined with != null
if (response != null) { /* safe */ }

// ❌ No nested ternaries — use if/else, switch, or object lookup

// ✅ Modern syntax
const len = items?.length ?? 0;
settings.debug ||= false;
const size = 1_000;

// ✅ Prefer const, destructuring, single-line guard clauses
if (element == null) return;
if (!isSupported) return false;

// ❌ Don't wrap single-statement guards in braces

// ✅ One blank line between logically distinct operations
// ✅ Trailing newline at end of file
```

## Naming

```typescript
// ✅ Stores: $prefix
export const $counter = atom(0);

// ✅ Standalone booleans: is/has/can/should/will prefix
const isEnabled = true;
const canEdit = permissions.includes('edit');

// ✅ Object/React props: drop boolean prefixes
type ButtonProps = { disabled?: boolean; loading?: boolean };

// ✅ Event handlers: on prefix (props), handle prefix (internal)
type Props = { onClick?: () => void };
const handleClick = () => { onClick?.(); };

// ✅ Arrays: plural. Functions: verb prefix (get/set/is/has)
const users: User[] = [];
function getUserById(id: string) {}

// ✅ Constants: UPPERCASE
const TIMEOUT_MS = 30_000;

// ✅ Trailing comma in multi-line arguments
```

## Types

```typescript
// ✅ type over interface for object shapes
type User = { id: string; name: string };

// ✅ T[] syntax, not Array<T>
type Users = User[];

// ✅ unknown over any, type guards over assertions
const data: unknown = fetchData();
if (isUser(data)) { /* typed */ }

// ❌ Avoid: as assertions, non-null ! operator
// ✅ Use: optional chaining, nullish coalescing, guard clauses

// ✅ satisfies for precise literal types
const options = { retry: 3 } satisfies RequestOptions;

// ✅ undefined for optional values (except React refs use null)
const [activeId, setActiveId] = useState<string | undefined>(undefined);
```

## Type Composition

```typescript
// ✅ Composition over subtraction
type MenuItemOwnProps = { id?: string; disabled?: boolean } & ComponentPropsWithoutRef<'div'>;
export type MenuItemProps = MenuItemOwnProps;

// ❌ Avoid Omit gymnastics, especially nested Omit
// ❌ Avoid inline type imports: import('...').Type

// ✅ Regular imports for types
import { MenuContextOperations } from '@/primitives/menu-primitive';
```

## Functions

```typescript
// ✅ Explicit return types for public functions
export function calculateTotal(items: OrderItem[]): number { /* ... */ }

// ✅ Arrow functions without return type in handlers/callbacks
return values.map(v => v + 2);

// ✅ One-line helpers with return type
const isEven = (value: number): boolean => value % 2 === 0;
```

## Imports

```typescript
// ✅ Named exports preferred
// ✅ Group by source, blank line between groups
// ✅ @/ alias for local files, relative only from same directory
import { MyComponent } from '@/components/MyComponent';
import { helper } from './helper';
```

## Store Types

- Do not place types in store files except the store's own type
- Prefer one file per type
- Define types in the same file only if one type is used inside another
