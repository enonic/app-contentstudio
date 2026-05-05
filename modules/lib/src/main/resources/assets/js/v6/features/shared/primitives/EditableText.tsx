import {cn} from '@enonic/ui';
import {cva, type VariantProps} from 'class-variance-authority';
import {
    forwardRef,
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type ComponentPropsWithoutRef,
    type FocusEventHandler,
    type KeyboardEventHandler,
} from 'react';

const editableTextVariants = cva([
    'bg-transparent border',
    'border-transparent rounded-sm',
    'hover:not-focus:not-disabled:border-bdr-subtle',
    'focus:border-bdr-strong',
    'transition-highlight',
    'placeholder:text-subtle',
    'focus:outline-none',
    'focus:ring-3 focus:ring-ring focus:ring-offset-3 focus:ring-offset-ring-offset',
    'disabled:select-none disabled:cursor-not-allowed disabled:opacity-50',
], {
    variants: {
        size: {
            md: 'text-md px-2 py-1',
            lg: 'text-2xl font-semibold px-1 py-0',
            xl: 'text-[2rem] font-semibold px-2.5 py-1',
        },
    },
    defaultVariants: {size: 'md'},
});

type EditableTextElement = HTMLInputElement | HTMLTextAreaElement;

export type EditableTextProps = {
    value?: string;
    placeholder?: string;
    onCommit?: (value: string) => void;
    onValueChange?: (value: string) => void;
    onEditingChange?: (isEditing: boolean) => void;
    allowEmpty?: boolean;
    fullWidth?: boolean;
    multiline?: boolean;
    multilineDisplayMode?: 'wrap' | 'truncate',
    error?: boolean;
} & VariantProps<typeof editableTextVariants>
    & Omit<ComponentPropsWithoutRef<'input'>, 'onBlur' | 'onChange' | 'onFocus' | 'onKeyDown' | 'type' | 'size' | 'value'>
    & {
        onBlur?: FocusEventHandler<EditableTextElement>;
        onFocus?: FocusEventHandler<EditableTextElement>;
        onKeyDown?: KeyboardEventHandler<EditableTextElement>;
    };

const EDITABLE_TEXT_NAME = 'EditableText';

const MIN_WIDTH = 24; // Minimum input width in pixels
const CURSOR_PADDING = 2; // Extra space for cursor

function isTextarea(el: EditableTextElement | null): el is HTMLTextAreaElement {
    return el?.tagName === 'TEXTAREA';
}

function normalizeSingleLineValue(value: string): string {
    return value.replace(/[\r\n]+/g, ' ');
}

export const EditableText = forwardRef<EditableTextElement, EditableTextProps>(({
    value = '',
    placeholder,
    onCommit,
    onValueChange,
    onEditingChange,
    allowEmpty = true,
    size,
    fullWidth = false,
    multiline = false,
    multilineDisplayMode = 'wrap',
    error,
    className,
    onFocus,
    onBlur,
    onKeyDown,
    ...props
}, ref) => {
    const [draft, setDraft] = useState(value);
    const [isFocused, setIsFocused] = useState(false);
    const [inputWidth, setInputWidth] = useState(0);
    const committedRef = useRef(value);
    const skipNextSyncRef = useRef(false);
    const inputRef = useRef<EditableTextElement>(null);
    const measureRef = useRef<HTMLSpanElement>(null);
    const shouldTruncate = multiline && multilineDisplayMode === 'truncate' && !isFocused;

    const setRefs = useCallback((node: EditableTextElement | null) => {
        inputRef.current = node;
        if (typeof ref === 'function') {
            ref(node);
        } else if (ref) {
            ref.current = node;
        }
    }, [ref]);

    const updateMultilineHeight = useCallback(() => {
        if (!isTextarea(inputRef.current)) {
            return;
        }

        const el = inputRef.current;

        if (shouldTruncate) {
            el.style.removeProperty('height');
            return;
        }

        const previousHeight = el.style.height;

        el.style.height = 'auto';
        const nextHeight = `${el.scrollHeight}px`;
        el.style.height = previousHeight === nextHeight ? previousHeight : nextHeight;
    }, [shouldTruncate]);

    const updateWidth = useCallback(() => {
        if (measureRef.current) {
            setInputWidth(Math.max(measureRef.current.offsetWidth + CURSOR_PADDING, MIN_WIDTH));
        }
    }, []);

    useLayoutEffect(() => {
        updateWidth();
    }, [draft, value, updateWidth]);

    useLayoutEffect(() => {
        if (multiline) {
            updateMultilineHeight();
        }
    }, [draft, value, multiline, updateMultilineHeight]);

    // WORKAROUND: Preact compat timing issue — useLayoutEffect can fire before
    // the browser calculates layout, causing offsetWidth to return 0 on initial
    // mount. ResizeObserver acts as an async fallback. Remove if migrating to React.
    useEffect(() => {
        const el = measureRef.current;
        if (!el) return;

        const observer = new ResizeObserver(() => {
            updateWidth();
        });
        observer.observe(el);

        return () => observer.disconnect();
    }, [updateWidth]);

    useEffect(() => {
        if (!multiline || !isTextarea(inputRef.current) || shouldTruncate) {
            return;
        }

        let rafId = requestAnimationFrame(updateMultilineHeight);
        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(updateMultilineHeight);
        });

        observer.observe(inputRef.current);

        return () => {
            cancelAnimationFrame(rafId);
            observer.disconnect();
        };
    }, [multiline, shouldTruncate, updateMultilineHeight]);

    useEffect(() => {
        if (!isFocused) {
            if (skipNextSyncRef.current) {
                skipNextSyncRef.current = false;
                return;
            }
            setDraft(value);
            committedRef.current = value;
        }
    }, [value, isFocused]);

    const commit = useCallback(() => {
        const trimmed = draft.trim();
        const hasChanged = trimmed !== committedRef.current;
        const isEmpty = !trimmed;

        if (isEmpty && !allowEmpty) {
            setDraft(committedRef.current);
            return;
        }

        if (hasChanged) {
            skipNextSyncRef.current = true;
            onCommit?.(trimmed);
            committedRef.current = trimmed;
            setDraft(trimmed);
        }
    }, [draft, allowEmpty, onCommit]);

    const handleFocus: FocusEventHandler<EditableTextElement> = (e) => {
        onFocus?.(e);
        if (e.defaultPrevented) {
            return;
        }
        setIsFocused(true);
        onEditingChange?.(true);
        requestAnimationFrame(() => inputRef.current?.select());
    };

    const handleBlur: FocusEventHandler<EditableTextElement> = (e) => {
        onBlur?.(e);
        if (e.defaultPrevented) {
            return;
        }
        setIsFocused(false);
        onEditingChange?.(false);
        commit();
        e.currentTarget.setSelectionRange(0, 0);
    };

    const handleKeyDown: KeyboardEventHandler<EditableTextElement> = (e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented) {
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            inputRef.current?.blur();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            setDraft(committedRef.current);
            inputRef.current?.blur();
        }
    };

    return (
        <div
            data-component={EDITABLE_TEXT_NAME}
            className={cn(
                'relative inline-flex min-w-0 max-w-full',
                (fullWidth || multiline) && 'flex w-full',
            )}
        >
            {!fullWidth && !multiline && (
                <span
                    ref={measureRef}
                    className={cn(
                        editableTextVariants({size}),
                        'absolute invisible whitespace-pre pointer-events-none',
                        className,
                    )}
                    aria-hidden="true"
                >
                    {(isFocused ? draft : value) || placeholder || '\u00A0'}
                </span>
            )}

            {multiline ? (
                <textarea
                    ref={setRefs}
                    value={draft}
                    placeholder={placeholder}
                    aria-invalid={error || undefined}
                    rows={1}
                    onChange={(e) => {
                        const nextValue = normalizeSingleLineValue(e.currentTarget.value);
                        setDraft(nextValue);
                        onValueChange?.(nextValue);
                    }}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className={cn(
                        editableTextVariants({size}),
                        'w-full min-w-0 resize-none overflow-hidden',
                        shouldTruncate ? 'truncate' : 'whitespace-pre-wrap break-words',
                        className,
                        error && 'focus:ring-error',
                    )}
                    {...(props as unknown as ComponentPropsWithoutRef<'textarea'>)}
                />
            ) : (
                <input
                    ref={setRefs}
                    type="text"
                    value={draft}
                    placeholder={placeholder}
                    aria-invalid={error || undefined}
                    onChange={(e) => {
                        const nextValue = e.currentTarget.value;
                        setDraft(nextValue);
                        onValueChange?.(nextValue);
                    }}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    style={fullWidth ? undefined : {width: inputWidth}}
                    className={cn(
                        editableTextVariants({size}),
                        fullWidth ? 'w-full' : 'min-w-6 max-w-full',
                        !isFocused && !fullWidth && 'truncate',
                        className,
                        error && 'focus:ring-error',
                    )}
                    {...props}
                />
            )}
        </div>
    );
});

EditableText.displayName = EDITABLE_TEXT_NAME;
