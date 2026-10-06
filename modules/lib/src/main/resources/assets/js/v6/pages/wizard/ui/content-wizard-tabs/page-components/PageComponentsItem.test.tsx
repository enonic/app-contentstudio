import type { SortableListItemContext } from '@enonic/lib-admin-ui/form2/components';
import { fireEvent, render, screen } from '@testing-library/preact';
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

const context = {
    item: {
        id: '/main/0',
        parentId: '/main',
        level: 1,
        hasChildren: false,
        isExpanded: false,
        data: {
            dragId: 'drag-part',
            displayName: 'Heading',
            nodeType: 'part',
            draggable: true,
            layoutFragment: false,
            hasDescriptor: true,
        },
    },
    isMovable: true,
} as SortableListItemContext<FlatNode<PageComponentNodeData>>;

const noop = (): void => undefined;

describe('PageComponentsItem', () => {
    it('should render a custom part icon and fall back when it fails', () => {
        const { container } = render(
            <PageComponentsItem context={context} iconUrl="/heading.svg" onToggle={noop} onSelect={noop} />,
        );

        const image = container.querySelector('img') as HTMLImageElement;
        expect(image.getAttribute('src')).toBe('/heading.svg');
        expect(screen.queryByTestId('icon-box')).toBeNull();

        fireEvent.error(image);

        expect(container.querySelector('img')).toBeNull();
        expect(screen.getByTestId('icon-box')).toBeDefined();
    });
});
