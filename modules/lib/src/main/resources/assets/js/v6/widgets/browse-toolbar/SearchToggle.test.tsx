import { act, render, screen } from '@testing-library/preact';
import { cloneElement, forwardRef, isValidElement, type ReactElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Action } from '@enonic/lib-admin-ui/ui/Action';
import {
    resetContentFilter,
    setContentFilterOpen,
    setContentFilterValue,
    setDependencySearchPending,
} from '../../features/search/model/contentFilter.store';
import { setFilterActive } from '../../entities/content/model/active-tree.store';

vi.mock('@enonic/ui', () => {
    type MockToggleProps = {
        pressed?: boolean;
        onPressedChange?: (pressed: boolean) => void;
        startIcon?: unknown;
        startIconClassName?: string;
        iconStrokeWidth?: number;
        size?: string;
        className?: string;
    } & Record<string, unknown>;

    const Toggle = forwardRef<HTMLButtonElement, MockToggleProps>(
        (
            {
                pressed,
                onPressedChange,
                startIcon,
                startIconClassName: _startIconClassName,
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
                data-icon={(startIcon as { displayName?: string })?.displayName}
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

vi.mock('../../shared/lib/hooks/useI18n', () => ({
    useI18n: (key: string) => key,
}));

vi.mock('lucide-react', () => ({
    Search: Object.assign(() => null, { displayName: 'Search' }),
    ZoomIn: Object.assign(() => null, { displayName: 'ZoomIn' }),
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
        resetContentFilter();
        setDependencySearchPending(false);
        setFilterActive(false);
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

    it('keeps focus on results when a pending dependency closes the filter', async () => {
        render(<SearchToggle action={createAction()} />);
        const resultsHeading = document.createElement('h4');
        resultsHeading.tabIndex = -1;
        document.body.appendChild(resultsHeading);

        try {
            setDependencySearchPending(true);
            setContentFilterOpen(true);
            await flushStoreUpdates();
            resultsHeading.focus();

            setContentFilterOpen(false);
            setDependencySearchPending(false);
            await flushStoreUpdates();

            expect(document.activeElement).toBe(resultsHeading);
        } finally {
            resultsHeading.remove();
        }
    });

    it('restores normal focus behavior after a canceled dependency closes immediately', async () => {
        render(<SearchToggle action={createAction()} />);

        setDependencySearchPending(true);
        setContentFilterOpen(true);
        setContentFilterOpen(false);
        setDependencySearchPending(false);
        await flushStoreUpdates();

        setContentFilterOpen(true);
        await flushStoreUpdates();
        setContentFilterOpen(false);
        await flushStoreUpdates();

        expect(document.activeElement).toBe(screen.getByRole('button'));
    });

    it('should show the plain search icon while the filter is untouched', async () => {
        render(<SearchToggle action={createAction()} />);
        await flushStoreUpdates();

        expect(screen.getByRole('button').getAttribute('data-icon')).toBe('Search');
    });

    it('should show the plus icon once the filter is changed', async () => {
        render(<SearchToggle action={createAction()} />);

        setContentFilterValue('query');
        await flushStoreUpdates();

        expect(screen.getByRole('button').getAttribute('data-icon')).toBe('ZoomIn');
    });

    it('should show the plus icon for dependency results without text or facet filters', async () => {
        render(<SearchToggle action={createAction()} />);

        setFilterActive(true);
        await flushStoreUpdates();

        expect(screen.getByRole('button').getAttribute('data-icon')).toBe('ZoomIn');
    });

    it('should not focus the toggle button when the panel was never open', async () => {
        render(<SearchToggle action={createAction()} />);

        setContentFilterOpen(false);
        await flushStoreUpdates();

        expect(document.activeElement).not.toBe(screen.getByRole('button'));
    });
});
