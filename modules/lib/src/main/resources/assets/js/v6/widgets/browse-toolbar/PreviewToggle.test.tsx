import { act, fireEvent, render, screen } from '@testing-library/preact';
import { cloneElement, isValidElement, type ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    $isMobilePreviewOpen,
    setContextLayoutMetrics,
    setMobilePreviewOpen,
} from '../../shared/app-state/browsePanels.store';

vi.mock('@enonic/ui', () => {
    type MockToggleProps = {
        pressed?: boolean;
        onPressedChange?: (pressed: boolean) => void;
        startIcon?: unknown;
        size?: string;
        className?: string;
    } & Record<string, unknown>;

    const Toggle = ({
        pressed,
        onPressedChange,
        startIcon: _startIcon,
        size: _size,
        className,
        ...props
    }: MockToggleProps) => (
        <button
            type="button"
            aria-pressed={pressed}
            className={className}
            onClick={() => onPressedChange?.(!pressed)}
            {...props}
        />
    );

    const ToolbarItem = ({ children, disabled = false }: { children: ReactElement; disabled?: boolean }) => {
        if (!isValidElement(children)) {
            return <>{children}</>;
        }

        return cloneElement(children as ReactElement<{ disabled?: boolean }>, { disabled });
    };

    return {
        Toggle,
        Toolbar: {
            Item: ToolbarItem,
        },
        cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
    };
});

vi.mock('../../shared/lib/hooks/useI18n', () => ({
    useI18n: (key: string) => key,
}));

vi.mock('../../entities/content', async () => {
    const { atom } = await import('nanostores');

    return { $currentItem: atom<unknown>(null) };
});

import { $currentItem } from '../../entities/content';
import { PreviewToggle } from './PreviewToggle';

const currentItemStore = $currentItem as typeof $currentItem & { set(value: unknown): void };

const flushStoreUpdates = async (): Promise<void> => {
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
    });
};

describe('PreviewToggle', () => {
    beforeEach(() => {
        currentItemStore.set(null);
        setMobilePreviewOpen(false);
        setContextLayoutMetrics({ totalWidth: 720, contextWidth: 360, windowWidth: 720 });
    });

    it('renders only in mobile mode', async () => {
        const { rerender } = render(<PreviewToggle />);

        expect(screen.getByRole('button')).toBeDefined();

        act(() => setContextLayoutMetrics({ totalWidth: 1700, contextWidth: 360, windowWidth: 1700 }));
        await flushStoreUpdates();
        rerender(<PreviewToggle />);

        expect(screen.queryByRole('button')).toBeNull();
    });

    it('is disabled without a current item', () => {
        render(<PreviewToggle />);

        expect(screen.getByRole<HTMLButtonElement>('button').disabled).toBe(true);
    });

    it('toggles mobile preview for the current item', async () => {
        currentItemStore.set({ getId: () => 'content-id' });
        render(<PreviewToggle />);

        const toggle = screen.getByRole<HTMLButtonElement>('button');
        expect(toggle.disabled).toBe(false);

        fireEvent.click(toggle);
        await flushStoreUpdates();

        expect($isMobilePreviewOpen.get()).toBe(true);
        expect(toggle.getAttribute('aria-pressed')).toBe('true');
    });

    it('closes mobile preview when the current item disappears', async () => {
        currentItemStore.set({ getId: () => 'content-id' });
        setMobilePreviewOpen(true);
        render(<PreviewToggle />);

        act(() => currentItemStore.set(null));
        await flushStoreUpdates();

        expect($isMobilePreviewOpen.get()).toBe(false);
        expect(screen.getByRole<HTMLButtonElement>('button').disabled).toBe(true);
    });
});
