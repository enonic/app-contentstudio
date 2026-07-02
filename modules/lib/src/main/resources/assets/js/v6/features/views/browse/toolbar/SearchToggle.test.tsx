import { act, render, screen } from '@testing-library/preact';
import { cloneElement, forwardRef, isValidElement, type ReactElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Action } from '@enonic/lib-admin-ui/ui/Action';
import { setContentFilterOpen } from '../../../store/contentFilter.store';

vi.mock('@enonic/ui', () => {
    type MockToggleProps = {
        pressed?: boolean;
        onPressedChange?: (pressed: boolean) => void;
        startIcon?: unknown;
        iconStrokeWidth?: number;
        size?: string;
        className?: string;
    } & Record<string, unknown>;

    const Toggle = forwardRef<HTMLButtonElement, MockToggleProps>(
        (
            {
                pressed,
                onPressedChange,
                startIcon: _startIcon,
                iconStrokeWidth: _iconStrokeWidth,
                size: _size,
                className,
                ...props
            },
            ref,
        ) => (
            <button
                ref={ref}
                type="button"
                aria-pressed={pressed}
                className={className}
                onClick={() => onPressedChange?.(!pressed)}
                {...props}
            />
        ),
    );
    Toggle.displayName = 'Toggle';

    // Mimics the roving tabindex state where the item is not the active one
    const ToolbarItem = ({ children, disabled = false }: { children: ReactElement; disabled?: boolean }) => {
        if (!isValidElement(children)) {
            return <>{children}</>;
        }

        const child = children as ReactElement<{ disabled?: boolean; tabIndex?: number }>;

        return cloneElement(child, {
            disabled: disabled || Boolean(child.props.disabled),
            tabIndex: -1,
        });
    };

    return {
        Toggle,
        Toolbar: {
            Item: ToolbarItem,
        },
        Tooltip: ({ children }: { children?: ReactNode }) => <>{children}</>,
        cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
    };
});

vi.mock('../../../../shared/lib/hooks/useI18n', () => ({
    useI18n: (key: string) => key,
}));

vi.mock('lucide-react', () => ({
    Search: () => null,
}));

import { SearchToggle } from './SearchToggle';

const createAction = (enabled = true) => {
    const action = new Action('Search');
    action.setEnabled(enabled);

    return action;
};

// useStore from @nanostores/preact batches re-renders via setTimeout
const flushStoreUpdates = async () => {
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
    });
};

describe('SearchToggle', () => {
    beforeEach(() => {
        setContentFilterOpen(false);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should not grab focus on mount', async () => {
        render(<SearchToggle action={createAction()} />);
        await flushStoreUpdates();

        expect(document.activeElement).not.toBe(screen.getByRole('button'));
    });

    it('should not grab focus when the filter panel opens', async () => {
        render(<SearchToggle action={createAction()} />);

        setContentFilterOpen(true);
        await flushStoreUpdates();

        expect(document.activeElement).not.toBe(screen.getByRole('button'));
    });

    it('should focus the toggle button when the filter panel closes', async () => {
        render(<SearchToggle action={createAction()} />);

        setContentFilterOpen(true);
        await flushStoreUpdates();

        setContentFilterOpen(false);
        await flushStoreUpdates();

        expect(document.activeElement).toBe(screen.getByRole('button'));
    });

    it('should focus the toggle button even when roving tabindex marks it inactive', async () => {
        render(<SearchToggle action={createAction()} />);

        const toggle = screen.getByRole('button');
        expect(toggle.tabIndex).toBe(-1);

        setContentFilterOpen(true);
        await flushStoreUpdates();

        setContentFilterOpen(false);
        await flushStoreUpdates();

        expect(document.activeElement).toBe(toggle);
    });

    it('should not focus the toggle button when the panel was never open', async () => {
        render(<SearchToggle action={createAction()} />);

        setContentFilterOpen(false);
        await flushStoreUpdates();

        expect(document.activeElement).not.toBe(screen.getByRole('button'));
    });
});
