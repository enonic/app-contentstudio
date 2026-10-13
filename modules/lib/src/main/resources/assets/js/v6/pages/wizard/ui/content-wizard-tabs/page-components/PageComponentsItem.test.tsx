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

    it('keeps the old icon visible while a replacement fails, then retries on a descriptor refresh', () => {
        const preloads: { onload: (() => void) | null; onerror: (() => void) | null }[] = [];

        class ImageMock {
            onload: (() => void) | null = null;
            onerror: (() => void) | null = null;
            src = '';

            constructor() {
                preloads.push(this);
            }
        }

        vi.stubGlobal('Image', ImageMock);
        try {
            const view = (iconUrl: string, iconRefreshVersion: number) => (
                <PageComponentsItem
                    context={context}
                    iconUrl={iconUrl}
                    iconRefreshVersion={iconRefreshVersion}
                    onToggle={noop}
                    onSelect={noop}
                />
            );
            const { container, rerender } = render(view('/heading.svg', 1));
            const visibleImage = container.querySelector('img');
            if (visibleImage) {
                fireEvent.load(visibleImage);
            }

            rerender(view('/updated.svg', 1));
            expect(container.querySelector('img')).toBe(visibleImage);
            expect(visibleImage?.getAttribute('src')).toBe('/heading.svg');
            act(() => preloads[0].onerror?.());
            expect(container.querySelector('img')?.getAttribute('src')).toBe('/heading.svg');

            rerender(view('/updated.svg', 2));
            expect(preloads).toHaveLength(2);
            act(() => preloads[1].onload?.());
            expect(container.querySelector('img')).toBe(visibleImage);
            expect(visibleImage?.getAttribute('src')).toBe('/updated.svg');
            expect(screen.queryByTestId('icon-box')).toBeNull();
        } finally {
            vi.unstubAllGlobals();
        }
    });
});
