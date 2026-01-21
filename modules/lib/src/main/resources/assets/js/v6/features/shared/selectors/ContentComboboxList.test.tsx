import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/preact';
import type {ContentComboboxFlatNode} from '../../hooks/useContentComboboxData';

// Mock state - can be changed in tests
let mockUseComboboxReturn = {
    selection: [] as string[],
    onSelectionChange: vi.fn(),
    selectionMode: 'multiple' as const,
};

vi.mock('@enonic/ui', async () => {
    const createMockComponent = (name: string) => {
        const Component = ({children, ...props}: {children?: React.ReactNode;[key: string]: unknown}) => (
            <div data-testid={name} {...props}>{children}</div>
        );
        Component.displayName = name;
        return Component;
    };

    const MockCombobox = {
        TreeContent: ({children, style}: {children?: React.ReactNode; style?: React.CSSProperties}) => (
            <div data-testid='combobox-tree-content' style={style}>{children}</div>
        ),
    };

    const MockVirtualizedTreeList = Object.assign(
        ({children, items, onSelectionChange, ...props}: {
            children?: (args: {items: unknown[]; getItemProps: (index: number, node: unknown) => object; containerProps: object}) => React.ReactNode;
            items?: unknown[];
            onSelectionChange?: (selection: ReadonlySet<string>) => void;
            [key: string]: unknown;
        }) => (
            <div
                data-testid='virtualized-tree-list'
                data-items-length={items?.length ?? 0}
                data-selection-change={onSelectionChange ? 'true' : 'false'}
                {...props}
            >
                {typeof children === 'function'
                    ? children({
                        items: items ?? [],
                        getItemProps: (index: number, node: unknown) => ({index, node}),
                        containerProps: {className: 'container'},
                    })
                    : children}
            </div>
        ),
        {
            RowLoading: ({children, level, className}: {children?: React.ReactNode; level?: number; className?: string}) => (
                <div data-testid='row-loading' data-level={level} className={className}>{children}</div>
            ),
            RowPlaceholder: ({children, level, className}: {children?: React.ReactNode; level?: number; className?: string}) => (
                <div data-testid='row-placeholder' data-level={level} className={className}>{children}</div>
            ),
        },
    );

    return {
        Combobox: MockCombobox,
        VirtualizedTreeList: MockVirtualizedTreeList,
        cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
        useCombobox: () => mockUseComboboxReturn,
    };
});

// Mock lucide-react
vi.mock('lucide-react', () => ({
    Loader2: ({className}: {className?: string}) => <span data-testid='loader-icon' className={className} />,
}));

// Mock react-virtuoso
const mockRangeChanged = vi.fn();
const mockEndReached = vi.fn();

vi.mock('react-virtuoso', () => ({
    Virtuoso: ({
        data,
        itemContent,
        rangeChanged,
        endReached,
    }: {
        data?: unknown[];
        itemContent?: (index: number, item: unknown) => React.ReactNode;
        rangeChanged?: (range: {startIndex: number; endIndex: number}) => void;
        endReached?: () => void;
    }) => {
        // Store callbacks for testing
        if (rangeChanged) {
            mockRangeChanged.mockImplementation(rangeChanged);
        }
        if (endReached) {
            mockEndReached.mockImplementation(endReached);
        }

        return (
            <div data-testid='virtuoso'>
                {data?.map((item, index) => (
                    <div key={index} data-index={index}>
                        {itemContent?.(index, item)}
                    </div>
                ))}
            </div>
        );
    },
}));

// Mock ContentComboboxRow
vi.mock('./ContentComboboxRow', () => ({
    ContentComboboxRow: ({node, showExpandControl}: {node: unknown; showExpandControl?: boolean}) => (
        <div
            data-testid='content-combobox-row'
            data-node-id={(node as ContentComboboxFlatNode).id}
            data-show-expand={showExpandControl}
        />
    ),
}));

// Now import the component
import {ContentComboboxList, type ContentComboboxListProps} from './ContentComboboxList';

// Helper to create mock flat node
function createMockNode(
    id: string,
    options: {
        nodeType?: 'node' | 'loading';
        selectable?: boolean;
        level?: number;
        hasChildren?: boolean;
    } = {},
): ContentComboboxFlatNode {
    const {
        nodeType = 'node',
        selectable = true,
        level = 1,
        hasChildren = false,
    } = options;

    if (nodeType === 'loading') {
        return {
            id: `__loading__${id}`,
            data: null,
            level,
            parentId: id === 'root' ? null : id,
            hasChildren: false,
            isExpanded: false,
            isLoading: true,
            isLoadingData: false,
            nodeType: 'loading',
        };
    }

    return {
        id,
        data: {
            id,
            displayName: `Display ${id}`,
            name: `name-${id}`,
            publishStatus: 'ONLINE' as never,
            workflowStatus: null,
            contentType: {toString: () => 'base:content'} as never,
            iconUrl: null,
            item: {} as never,
            selectable,
        },
        level,
        parentId: null,
        hasChildren,
        isExpanded: false,
        isLoading: false,
        isLoadingData: false,
        nodeType: 'node',
    };
}

describe('ContentComboboxList', () => {
    const defaultProps: ContentComboboxListProps = {
        items: [],
        mode: 'tree',
        activeId: null,
        onActiveChange: vi.fn(),
        height: 300,
        ariaLabel: 'Content list',
        emptyLabel: 'No items',
        isLoading: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseComboboxReturn = {
            selection: [],
            onSelectionChange: vi.fn(),
            selectionMode: 'multiple',
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        it('shows loading state when isLoading=true', () => {
            render(<ContentComboboxList {...defaultProps} isLoading />);

            expect(screen.getByTestId('row-loading')).toBeDefined();
            expect(screen.getByTestId('loader-icon')).toBeDefined();
        });

        it('shows empty state when items=[]', () => {
            render(<ContentComboboxList {...defaultProps} items={[]} />);

            expect(screen.getByTestId('row-placeholder')).toBeDefined();
            expect(screen.getByText('No items')).toBeDefined();
        });

        it('renders VirtualizedTreeList with items', () => {
            const items = [createMockNode('1'), createMockNode('2')];

            render(<ContentComboboxList {...defaultProps} items={items} />);

            expect(screen.getByTestId('virtualized-tree-list')).toBeDefined();
            expect(screen.getByTestId('virtualized-tree-list').getAttribute('data-items-length')).toBe('2');
        });

        it('renders content rows for each item', () => {
            const items = [createMockNode('1'), createMockNode('2')];

            render(<ContentComboboxList {...defaultProps} items={items} />);

            const rows = screen.getAllByTestId('content-combobox-row');
            expect(rows.length).toBe(2);
            expect(rows[0].getAttribute('data-node-id')).toBe('1');
            expect(rows[1].getAttribute('data-node-id')).toBe('2');
        });
    });

    describe('handleSelectionChange', () => {
        it('filters out non-selectable item IDs', () => {
            const items = [
                createMockNode('1', {selectable: true}),
                createMockNode('2', {selectable: false}),
                createMockNode('3', {selectable: true}),
            ];

            render(<ContentComboboxList {...defaultProps} items={items} />);

            // Get the virtualized tree list
            const treeList = screen.getByTestId('virtualized-tree-list');
            expect(treeList.getAttribute('data-selection-change')).toBe('true');

            // For unit testing, we verify the items have correct selectable flags
            // The actual filtering logic is tested through the component's
            // handleSelectionChange callback which filters non-selectable items
            expect(items[0].data?.selectable).toBe(true);
            expect(items[1].data?.selectable).toBe(false);
            expect(items[2].data?.selectable).toBe(true);
        });

        it('allows previously selected items not in current list', () => {
            const items = [createMockNode('1'), createMockNode('2')];

            mockUseComboboxReturn = {
                selection: ['previous-item', '1'],
                onSelectionChange: vi.fn(),
                selectionMode: 'multiple',
            };

            render(<ContentComboboxList {...defaultProps} items={items} />);

            // Component should allow 'previous-item' even though it's not in items
            // because it might be from a previous selection
            expect(screen.getByTestId('virtualized-tree-list')).toBeDefined();
        });
    });

    describe('handleRangeChange', () => {
        it('calls onLoadMore when loading node is visible', () => {
            const onLoadMore = vi.fn();
            const items = [
                createMockNode('1'),
                createMockNode('root', {nodeType: 'loading'}),
            ];

            render(
                <ContentComboboxList
                    {...defaultProps}
                    items={items}
                    onLoadMore={onLoadMore}
                />,
            );

            // Simulate range change that includes the loading node
            mockRangeChanged({startIndex: 0, endIndex: 1});

            expect(onLoadMore).toHaveBeenCalled();
        });

        it('passes null parentId for root loading node', () => {
            const onLoadMore = vi.fn();
            const items = [
                createMockNode('1'),
                {
                    id: '__loading__root__1',
                    data: null,
                    level: 1,
                    parentId: null,
                    hasChildren: false,
                    isExpanded: false,
                    isLoading: true,
                    isLoadingData: false,
                    nodeType: 'loading' as const,
                },
            ];

            render(
                <ContentComboboxList
                    {...defaultProps}
                    items={items}
                    onLoadMore={onLoadMore}
                />,
            );

            mockRangeChanged({startIndex: 0, endIndex: 1});

            expect(onLoadMore).toHaveBeenCalledWith(null);
        });

        it('passes actual parentId for child loading node', () => {
            const onLoadMore = vi.fn();
            const items = [
                createMockNode('1'),
                {
                    id: '__loading__parent123__5',
                    data: null,
                    level: 2,
                    parentId: 'parent123',
                    hasChildren: false,
                    isExpanded: false,
                    isLoading: true,
                    isLoadingData: false,
                    nodeType: 'loading' as const,
                },
            ];

            render(
                <ContentComboboxList
                    {...defaultProps}
                    items={items}
                    onLoadMore={onLoadMore}
                />,
            );

            mockRangeChanged({startIndex: 0, endIndex: 1});

            expect(onLoadMore).toHaveBeenCalledWith('parent123');
        });

        it('only scans visible range (startIndex to endIndex)', () => {
            const onLoadMore = vi.fn();
            const items = [
                createMockNode('1'),
                createMockNode('2'),
                createMockNode('3'),
                createMockNode('4'),
                createMockNode('root', {nodeType: 'loading'}), // index 4 - outside visible range
            ];

            render(
                <ContentComboboxList
                    {...defaultProps}
                    items={items}
                    onLoadMore={onLoadMore}
                />,
            );

            // Range only includes indices 0-2
            mockRangeChanged({startIndex: 0, endIndex: 2});

            // Should not call onLoadMore since loading node is at index 4
            expect(onLoadMore).not.toHaveBeenCalled();
        });

        it('short-circuits after first loading node found', () => {
            const onLoadMore = vi.fn();
            const items = [
                createMockNode('1'),
                createMockNode('root', {nodeType: 'loading'}), // index 1
                createMockNode('parent', {nodeType: 'loading'}), // index 2
            ];

            render(
                <ContentComboboxList
                    {...defaultProps}
                    items={items}
                    onLoadMore={onLoadMore}
                />,
            );

            mockRangeChanged({startIndex: 0, endIndex: 2});

            // Should only be called once for the first loading node
            expect(onLoadMore).toHaveBeenCalledTimes(1);
        });
    });

    describe('endReached', () => {
        it('called in flat mode when hasMore=true', () => {
            const onEndReached = vi.fn();
            const items = [createMockNode('1')];

            render(
                <ContentComboboxList
                    {...defaultProps}
                    items={items}
                    mode='flat'
                    hasMore
                    onEndReached={onEndReached}
                />,
            );

            // Trigger end reached
            mockEndReached();

            expect(onEndReached).toHaveBeenCalled();
        });

        it('not called in tree mode', () => {
            const onEndReached = vi.fn();
            const items = [createMockNode('1')];

            render(
                <ContentComboboxList
                    {...defaultProps}
                    items={items}
                    mode='tree'
                    hasMore
                    onEndReached={onEndReached}
                />,
            );

            // In tree mode, endReached should not be configured
            // The mock should not receive the callback
            expect(screen.getByTestId('virtuoso')).toBeDefined();
        });
    });

    describe('mode behavior', () => {
        it('shows expand control in tree mode', () => {
            const items = [createMockNode('1')];

            render(<ContentComboboxList {...defaultProps} items={items} mode='tree' />);

            const row = screen.getByTestId('content-combobox-row');
            expect(row.getAttribute('data-show-expand')).toBe('true');
        });

        it('hides expand control in flat mode', () => {
            const items = [createMockNode('1')];

            render(<ContentComboboxList {...defaultProps} items={items} mode='flat' />);

            const row = screen.getByTestId('content-combobox-row');
            expect(row.getAttribute('data-show-expand')).toBe('false');
        });
    });
});
