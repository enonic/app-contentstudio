import type { SortableListItemContext } from '@enonic/lib-admin-ui/form2/components';
import { act, fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import type { FlatNode } from '../../../../../shared/lib/tree-store';
import { PageComponentsItem } from './PageComponentsItem';
import type { PageComponentNodeData } from './types';

vi.mock('lucide-react', () => ({
    Box: (props: Record<string, unknown>) => <svg data-testid="icon-box" {...props} />,
    ChevronRight: (props: Record<string, unknown>) => <svg data-testid="icon-chevron" {...props} />,
    Columns2: (props: Record<string, unknown>) => <svg data-testid="icon-columns" {...props} />,
    Globe: (props: Record<string, unknown>) => <svg data-testid="icon-globe" {...props} />,
    OctagonAlert: (props: Record<string, unknown>) => <svg data-testid="icon-alert" {...props} />,
    PenLine: (props: Record<string, unknown>) => <svg data-testid="icon-pen" {...props} />,
    Puzzle: (props: Record<string, unknown>) => <svg data-testid="icon-puzzle" {...props} />,
}));

const context: SortableListItemContext<FlatNode<PageComponentNodeData>> = {
    item: {
        id: '/main/0',
        parentId: '/main',
        level: 1,
        hasChildren: false,
        isExpanded: false,
        isLoading: false,
        isLoadingData: false,
        nodeType: 'node',
        data: {
            dragId: 'drag-part',
            displayName: 'Heading',
            nodeType: 'part',
            draggable: true,
            layoutFragment: false,
            hasDescriptor: true,
            descriptorKey: 'app:heading',
        },
    },
    index: 0,
    isDragging: false,
    isDragActive: false,
    isFocused: false,
    isMovable: true,
};

const noop = (): void => undefined;

type PreloadImage = { onload: (() => void) | null; onerror: (() => void) | null; src: string };

function stubImagePreloads(): PreloadImage[] {
    const preloads: PreloadImage[] = [];

    class ImageMock {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src = '';

        constructor() {
            preloads.push(this);
        }
    }

    vi.stubGlobal('Image', ImageMock);
    return preloads;
}

describe('PageComponentsItem', () => {
    it('should render a custom part icon and fall back when it fails', () => {
        const { container } = render(
            <PageComponentsItem context={context} iconUrl="/heading.svg" onToggle={noop} onSelect={noop} />,
        );

        const image = container.querySelector('img');
        expect(image).toBeInstanceOf(HTMLImageElement);
        expect(image?.getAttribute('src')).toBe('/heading.svg');
        expect(screen.queryByTestId('icon-box')).toBeNull();

        if (image) fireEvent.error(image);

        expect(container.querySelector('img')).toBeNull();
        expect(screen.getByTestId('icon-box')).toBeDefined();
    });

    it('keeps a loaded custom icon while its replacement URL loads', () => {
        stubImagePreloads();
        try {
            const { container, rerender } = render(
                <PageComponentsItem context={context} iconUrl="/heading.svg" onToggle={noop} onSelect={noop} />,
            );
            const image = container.querySelector('img');
            if (image) {
                fireEvent.load(image);
            }

            rerender(<PageComponentsItem context={context} iconUrl="/updated.svg" onToggle={noop} onSelect={noop} />);
            expect(container.querySelector('img')?.getAttribute('src')).toBe('/heading.svg');
            expect(screen.queryByTestId('icon-box')).toBeNull();
            const visibleImage = container.querySelector('img');
            if (visibleImage) {
                fireEvent.error(visibleImage);
            }
            expect(container.querySelector('img')?.getAttribute('src')).toBe('/heading.svg');
            expect(screen.queryByTestId('icon-box')).toBeNull();

            const otherPart = {
                ...context,
                item: { ...context.item, data: { ...context.item.data, descriptorKey: 'app:other' } },
            };
            rerender(<PageComponentsItem context={otherPart} onToggle={noop} onSelect={noop} />);
            expect(container.querySelector('img')).toBeNull();
            expect(screen.getByTestId('icon-box')).toBeDefined();
        } finally {
            vi.unstubAllGlobals();
        }
    });

    it('retries a failed replacement after the descriptor list refreshes', () => {
        const preloads = stubImagePreloads();

        try {
            const firstRefresh = {};
            const { container, rerender } = render(
                <PageComponentsItem
                    context={context}
                    iconUrl="/heading.svg"
                    iconRefreshToken={firstRefresh}
                    onToggle={noop}
                    onSelect={noop}
                />,
            );
            const image = container.querySelector('img');
            if (image) {
                fireEvent.load(image);
            }

            rerender(
                <PageComponentsItem
                    context={context}
                    iconUrl="/updated.svg"
                    iconRefreshToken={firstRefresh}
                    onToggle={noop}
                    onSelect={noop}
                />,
            );
            expect(preloads).toHaveLength(1);
            act(() => preloads[0].onerror?.());
            expect(container.querySelector('img')?.getAttribute('src')).toBe('/heading.svg');

            rerender(
                <PageComponentsItem
                    context={context}
                    iconUrl="/updated.svg"
                    iconRefreshToken={{}}
                    onToggle={noop}
                    onSelect={noop}
                />,
            );
            expect(preloads).toHaveLength(2);
            act(() => preloads[1].onload?.());
            expect(container.querySelector('img')?.getAttribute('src')).toBe('/updated.svg');
        } finally {
            vi.unstubAllGlobals();
        }
    });
});
