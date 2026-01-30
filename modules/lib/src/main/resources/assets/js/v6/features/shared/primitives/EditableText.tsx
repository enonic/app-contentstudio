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
} from 'react';

const editableTextVariants = cva([
    'bg-transparent',
    'border border-transparent rounded-sm',
    'transition-highlight',
], {
    variants: {
        variant: {
            heading: 'text-2xl font-semibold px-1 py-0',
            text: 'text-md px-2 py-1',
        },
    },
    defaultVariants: {variant: 'text'},
});

export type EditableTextProps = {
    value?: string;
    placeholder?: string;
    onCommit?: (value: string) => void;
    onEditingChange?: (isEditing: boolean) => void;
    allowEmpty?: boolean;
} & VariantProps<typeof editableTextVariants>
    & Omit<ComponentPropsWithoutRef<'input'>, 'value' | 'onChange' | 'type'>;

const EDITABLE_TEXT_NAME = 'EditableText';

const MIN_WIDTH = 24; // Minimum input width in pixels
const CURSOR_PADDING = 2; // Extra space for cursor

export const EditableText = forwardRef<HTMLInputElement, EditableTextProps>(({
    value = '',
    placeholder,
    onCommit,
    onEditingChange,
    allowEmpty = false,
    variant,
    disabled,
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
    const inputRef = useRef<HTMLInputElement>(null);
    const measureRef = useRef<HTMLSpanElement>(null);

    const setRefs = useCallback((node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === 'function') {
            ref(node);
        } else if (ref) {
            ref.current = node;
        }
    }, [ref]);

    const updateWidth = useCallback(() => {
        if (measureRef.current) {
            setInputWidth(Math.max(measureRef.current.offsetWidth + CURSOR_PADDING, MIN_WIDTH));
        }
    }, []);

    useLayoutEffect(() => {
        updateWidth();
    }, [draft, value, updateWidth]);

    useEffect(() => {
        if (!isFocused) {
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
            onCommit?.(trimmed);
            committedRef.current = trimmed;
            setDraft(trimmed);
        }
    }, [draft, allowEmpty, onCommit]);

    const handleFocus: ComponentPropsWithoutRef<'input'>['onFocus'] = (e) => {
        onFocus?.(e);
        if (e.defaultPrevented) {
            return;
        }
        setIsFocused(true);
        onEditingChange?.(true);
        requestAnimationFrame(() => inputRef.current?.select());
    };

    const handleBlur: ComponentPropsWithoutRef<'input'>['onBlur'] = (e) => {
        onBlur?.(e);
        if (e.defaultPrevented) {
            return;
        }
        setIsFocused(false);
        onEditingChange?.(false);
        commit();
    };

    const handleKeyDown: ComponentPropsWithoutRef<'input'>['onKeyDown'] = (e) => {
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
            className="relative inline-flex min-w-0 max-w-full"
        >
            {/* Hidden sizer span - measures text width */}
            <span
                ref={measureRef}
                className={cn(
                    editableTextVariants({variant}),
                    'absolute invisible whitespace-pre pointer-events-none',
                    className,
                )}
                aria-hidden="true"
            >
                {draft || placeholder || '\u00A0'}
            </span>

            {/* Input - width controlled via JS measurement */}
            <input
                ref={setRefs}
                type="text"
                value={draft}
                placeholder={placeholder}
                disabled={disabled}
                onChange={(e) => setDraft(e.currentTarget.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                style={{width: inputWidth}}
                className={cn(
                    editableTextVariants({variant}),
                    'placeholder:text-subtle',
                    'hover:border-bdr-subtle',
                    'focus:border-bdr-strong focus:outline-none',
                    'focus:ring-3 focus:ring-ring focus:ring-offset-3 focus:ring-offset-ring-offset',
                    'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-transparent',
                    'min-w-6 max-w-full',
                    !isFocused && 'truncate',
                    className,
                )}
                {...props}
            />
        </div>
    );
});

EditableText.displayName = EDITABLE_TEXT_NAME;
