---
paths:
  - "**/*.tsx"
---

# React Component Standards

## Component Structure

```typescript
// ✅ Functional components, Props exported from same file
// ✅ className and children last in Props
// ❌ No default exports

export type MyComponentProps = {
    title: string;
    active?: boolean;
    className?: string;
    children?: ReactNode;
};

export function MyComponent({ title, active = false, className, children }: MyComponentProps) {
    // 1. Refs and store hooks first
    const containerRef = useRef<HTMLDivElement>(null);
    const data = useStore($myStore);

    // 2. State, memo hooks
    const [count, setCount] = useState(0);
    const expensive = useMemo(() => heavyCalc(data), [data]);

    // 3. Effects last
    useEffect(() => { /* side-effect */ }, [data]);

    // 4. Class variables before return
    const classNames = twMerge('p-4 rounded shadow', active && 'bg-blue-500', className);

    // 5. Early returns
    if (!data) return <LoadingIndicator />;

    // 6. JSX
    return (
        <div ref={containerRef} className={classNames} aria-pressed={active}>
            <h1>{title}</h1>
            {children}
        </div>
    );
}
```

## Early Returns

```typescript
// ❌ Conditional fragment
return <>{isReady && <div>Content</div>}</>;

// ✅ Early return
if (!isReady) return null;
return <div>Content</div>;
```

## Display Names

```typescript
// Arrow functions: MUST set displayName
export const Button = ({ children }: ButtonProps) => <button>{children}</button>;
Button.displayName = 'Button';

// memo(): MUST set displayName
export const List = React.memo(({ items }: Props) => <ul>...</ul>);
List.displayName = 'List';

// forwardRef(): MUST set displayName
export const Input = React.forwardRef<HTMLInputElement, Props>((props, ref) => <input ref={ref} />);
Input.displayName = 'Input';

// HOCs: MUST set displayName with wrapper info
Wrapped.displayName = `withAuth(${Component.displayName || Component.name})`;

// Function declarations: NOT needed (auto-inferred)
export function UserCard({ name }: Props) { return <div>{name}</div>; }
```

## useEffect — Correct Uses Only

```typescript
// ❌ Transform data → calculate during render or useMemo
// ❌ Handle user events → use event handlers
// ❌ Reset state on prop change → use key prop
// ❌ Sync derived state → derive during render

// ✅ External system sync (WebSocket, DOM APIs)
// ✅ Data fetching (prefer React Query/SWR)
// ✅ Analytics/logging after render
```

## useCallback / useMemo

Only use when:
- Passing to `memo()` children
- Used as dependency in other hooks
- Expensive calculation (useMemo)

Do not use for simple calculations or handlers not passed to memoized children.

## Refs in Dependencies

- Never put `ref.current` in dependency arrays (mutable, won't trigger re-render)
- Ref objects from `useRef()` are stable — safe but usually unnecessary in deps
- Never wrap arrays in another array as deps — use array directly

## Extending Props

```typescript
// ✅ ComponentPropsWithoutRef for standard components
type ButtonProps = { variant?: 'primary' | 'secondary' } & ComponentPropsWithoutRef<'button'>;

// ✅ ComponentPropsWithRef when forwarding refs
type InputProps = { label?: string } & ComponentPropsWithRef<'input'>;

// ❌ Don't use ComponentProps, ButtonHTMLAttributes, HTMLAttributes
```

## Element IDs

```typescript
const COMPONENT_NAME = 'MySelector';

export const MySelector = ({ label }: Props) => {
    const baseId = useId();
    const inputId = `${COMPONENT_NAME}-${baseId}-input`;

    return (
        <div>
            {label && <label htmlFor={inputId}>{label}</label>}
            <input id={inputId} />
        </div>
    );
};
```

- Format: `${DISPLAY_NAME}-${baseId}-suffix`
- Never use static IDs (collision risk)
- Never use `useId()` for list keys
