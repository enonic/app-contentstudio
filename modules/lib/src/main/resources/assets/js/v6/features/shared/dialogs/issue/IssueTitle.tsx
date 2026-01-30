import {cn} from '@enonic/ui';
import {forwardRef, type ComponentPropsWithoutRef, type ReactElement} from 'react';

export type IssueTitleProps = {
    className?: string;
    editing: boolean;
    displayValue: string;
    onStartEdit?: () => void;
    onCommit?: () => void;
} & ComponentPropsWithoutRef<'input'>;

const ISSUE_TITLE_NAME = 'IssueTitle';

export const IssueTitle = forwardRef<HTMLInputElement, IssueTitleProps>(({
    className,
    editing,
    displayValue,
    onStartEdit,
    onCommit,
    onBlur,
    onKeyDown,
    disabled,
    ...props
}, ref): ReactElement => {
    const handleKeyDown: ComponentPropsWithoutRef<'input'>['onKeyDown'] = (event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) {
            return;
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            event.currentTarget.blur();
        }
    };

    const handleBlur: ComponentPropsWithoutRef<'input'>['onBlur'] = (event) => {
        onBlur?.(event);
        if (event.defaultPrevented) {
            return;
        }
        onCommit?.();
    };

    const handleDisplayKeyDown: ComponentPropsWithoutRef<'h2'>['onKeyDown'] = (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
            return;
        }
        event.preventDefault();
        onStartEdit?.();
    };

    const canEdit = !disabled && !!onStartEdit;
    const baseClassName = cn(
        'min-w-0 w-full text-2xl font-semibold bg-transparent px-1 py-0',
        'border border-transparent rounded-sm',
        'focus:border-bdr-solid focus:outline-none focus:ring-3 focus:ring-ring',
        'focus:ring-offset-3 focus:ring-offset-ring-offset transition-highlight',
        'hover:border-bdr-subtle focus-within:border-bdr-strong',
    );

    if (!editing) {
        return (
            <h2
                className={cn(
                    baseClassName,
                    canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-50',
                )}
                tabIndex={canEdit ? 0 : -1}
                onClick={canEdit ? onStartEdit : undefined}
                onFocus={canEdit ? onStartEdit : undefined}
                onKeyDown={canEdit ? handleDisplayKeyDown : undefined}
            >
                {displayValue}
            </h2>
        );
    }

    return (
        <input
            ref={ref}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            disabled={disabled}
            className={cn(
                baseClassName,
                disabled ? 'cursor-not-allowed opacity-50' : 'cursor-text',
                className,
            )}
            {...props}
        />
    );
});

IssueTitle.displayName = ISSUE_TITLE_NAME;
