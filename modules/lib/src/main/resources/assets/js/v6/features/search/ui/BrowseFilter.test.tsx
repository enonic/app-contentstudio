import { fireEvent, render, screen } from '@testing-library/preact';
import { forwardRef, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    $contentFilterState,
    $isContentFilterOpen,
    resetContentFilter,
    setContentFilterOpen,
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
        setContentFilterOpen(true);
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
        expect(screen.getByText('0 results')).toBeTruthy();
    });

    it('keeps plain text while the filter is untouched', () => {
        resetContentFilter();

        render(<BrowseFilter hits={3} bucketAggregations={[]} />);

        expect(screen.queryByRole('button', { name: /results/ })).toBeNull();
        expect(screen.getByText('3 results')).toBeTruthy();
    });

    it('keeps plain text on desktop', () => {
        mocks.breakpoints = { sm: true };

        render(<BrowseFilter hits={3} bucketAggregations={[]} />);

        expect(screen.queryByRole('button', { name: /results/ })).toBeNull();
        expect(screen.getByText('3 results')).toBeTruthy();
    });

    it('hides the export action on mobile', () => {
        render(<BrowseFilter hits={3} bucketAggregations={[]} exportOptions={{ label: 'Export', action: vi.fn() }} />);

        expect(screen.getByRole('button', { name: 'Export' }).className).toContain('max-sm:hidden');
    });
});
