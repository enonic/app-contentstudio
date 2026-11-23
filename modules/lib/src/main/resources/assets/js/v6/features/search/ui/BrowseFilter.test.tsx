import { act, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { forwardRef, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    $contentFilterState,
    $isContentFilterOpen,
    resetContentFilter,
    setContentFilterOpen,
    setDependencySearchPending,
} from '../model/contentFilter.store';

const mocks = vi.hoisted(() => ({ breakpoints: { sm: false } }));

vi.mock('@enonic/ui', () => ({
    // Mirrors the real Button: aria-label defaults to label, then caller props override it
    Button: ({
        children,
        label,
        className,
        onClick,
        ...props
    }: {
        children?: ReactNode;
        label?: string;
        className?: string;
        onClick?: () => void;
    } & Record<string, unknown>) => (
        <button type="button" aria-label={label} className={className} onClick={onClick} {...props}>
            {children}
            {label}
        </button>
    ),
    SearchField: {
        Root: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
        Input: forwardRef<HTMLInputElement>((_, ref) => <input ref={ref} />),
        Clear: () => null,
    },
}));

vi.mock('../../../shared/lib/hooks/useBreakpoints', () => ({
    useBreakpoints: () => mocks.breakpoints,
}));

vi.mock('../../../shared/lib/hooks/useI18n', () => ({
    useI18n: (key: string, hits?: number) => {
        if (key === 'field.search.show.results') {
            return `Show ${hits} results`;
        }
        if (key === 'field.search.results') {
            return `${hits} results`;
        }
        return key;
    },
}));

vi.mock('../../../shared/ui/LegacyElement', () => ({
    LegacyElement: class {},
}));

vi.mock('../../shared/buckets/FilterableBucketAggregation', () => ({
    FilterableBucketAggregation: () => null,
}));

vi.mock('../../shared/buckets/StaticBucketAggregation', () => ({
    StaticBucketAggregation: () => null,
}));

import { BrowseFilter } from './BrowseFilter';

describe('BrowseFilter', () => {
    beforeEach(() => {
        mocks.breakpoints = { sm: false };
        resetContentFilter();
        $contentFilterState.setKey('value', 'query');
        setDependencySearchPending(false);
        setContentFilterOpen(true);
    });

    it('keeps focus out of hidden filter and restores it if the dependency query fails', async () => {
        setDependencySearchPending(true);
        render(<BrowseFilter hits={3} bucketAggregations={[]} />);

        const input = screen.getByRole('textbox');
        expect(document.activeElement).not.toBe(input);

        act(() => setDependencySearchPending(false));
        await waitFor(() => expect(document.activeElement).toBe(input));
    });

    it('names the mobile results action by its visible label', () => {
        render(<BrowseFilter hits={3} bucketAggregations={[]} />);

        expect(screen.getByRole('button', { name: 'Show 3 results' })).toBeTruthy();
    });

    it('collapses the filter panel when the mobile results action is clicked', () => {
        render(<BrowseFilter hits={3} bucketAggregations={[]} />);

        fireEvent.click(screen.getByRole('button', { name: 'Show 3 results' }));

        expect($isContentFilterOpen.get()).toBe(false);
    });

    it('keeps plain text when nothing was found', () => {
        render(<BrowseFilter hits={0} bucketAggregations={[]} />);

        expect(screen.queryByRole('button', { name: /results/ })).toBeNull();
        expect(screen.getByText('0 results', { ignore: '.sr-only' })).toBeTruthy();
    });

    it('keeps plain text while the filter is untouched', () => {
        resetContentFilter();

        render(<BrowseFilter hits={3} bucketAggregations={[]} />);

        expect(screen.queryByRole('button', { name: /results/ })).toBeNull();
        expect(screen.getByText('3 results', { ignore: '.sr-only' })).toBeTruthy();
    });

    it('keeps plain text on desktop', () => {
        mocks.breakpoints = { sm: true };

        render(<BrowseFilter hits={3} bucketAggregations={[]} />);

        expect(screen.queryByRole('button', { name: /results/ })).toBeNull();
        expect(screen.getByText('3 results', { ignore: '.sr-only' })).toBeTruthy();
    });

    it('hides the export action on mobile', () => {
        render(<BrowseFilter hits={3} bucketAggregations={[]} exportOptions={{ label: 'Export', action: vi.fn() }} />);

        expect(screen.getByRole('button', { name: 'Export' }).className).toContain('max-sm:hidden');
    });

    it('updates only the result count in the same polite region without moving focus', async () => {
        const { rerender } = render(<BrowseFilter hits={3} bucketAggregations={[]} />);
        const input = screen.getByRole('textbox');
        const region = screen.getByRole('status');
        await waitFor(() => expect(document.activeElement).toBe(input));
        expect(region.getAttribute('aria-live')).toBe('polite');
        expect(region.getAttribute('aria-atomic')).toBe('true');
        expect(region.classList.contains('sr-only')).toBe(true);

        rerender(<BrowseFilter hits={0} bucketAggregations={[]} />);
        await waitFor(() => expect(region.textContent).toBe('0 results'));
        expect(document.activeElement).toBe(input);

        const changes: MutationRecord[] = [];
        const observer = new MutationObserver((records) => changes.push(...records));
        observer.observe(region, { subtree: true, childList: true, characterData: true });
        await act(async () => rerender(<BrowseFilter hits={0} bucketAggregations={[]} />));
        observer.disconnect();
        expect(changes).toHaveLength(0);
        expect(screen.getByRole('status')).toBe(region);
    });

    it('announces each completed search even when consecutive result counts match', async () => {
        const { rerender } = render(<BrowseFilter hits={0} resultVersion={1} bucketAggregations={[]} />);
        const region = screen.getByRole('status');
        await waitFor(() => expect(region.textContent).toBe('0 results'));
        const previousMessage = region.firstChild;

        rerender(<BrowseFilter hits={0} resultVersion={2} bucketAggregations={[]} />);
        expect(region.textContent).toBe('\u00a0');
        await waitFor(() => expect(region.textContent).toBe('0 results'));
        expect(region.firstChild).not.toBe(previousMessage);
        expect(screen.getByRole('status')).toBe(region);
        expect(document.activeElement).toBe(screen.getByRole('textbox'));
    });

    it('keeps result counts empty while the filter is closed or dependency search is pending', async () => {
        setDependencySearchPending(true);
        const { rerender } = render(<BrowseFilter hits={3} bucketAggregations={[]} />);
        const region = screen.getByRole('status');
        rerender(<BrowseFilter hits={7} bucketAggregations={[]} />);
        expect(region.textContent).toBe('');

        act(() => setDependencySearchPending(false));
        await waitFor(() => expect(region.textContent).toBe('7 results'));
        act(() => setContentFilterOpen(false));
        await waitFor(() => expect(region.textContent).toBe(''));
        rerender(<BrowseFilter hits={9} bucketAggregations={[]} />);
        expect(region.textContent).toBe('');
    });
});
