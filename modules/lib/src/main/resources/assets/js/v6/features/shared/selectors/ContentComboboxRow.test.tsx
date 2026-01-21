import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/preact';
import type {ContentComboboxFlatNode} from '../../hooks/useContentComboboxData';

// Mock @enonic/ui
vi.mock('@enonic/ui', () => {
    const createMockComponent = (name: string) => {
        const Component = ({children, ...props}: {children?: React.ReactNode;[key: string]: unknown}) => (
            <div data-testid={name} {...props}>{children}</div>
        );
        Component.displayName = name;
        return Component;
    };

    const MockListItem = Object.assign(
        ({children, className, ...props}: {children?: React.ReactNode; className?: string;[key: string]: unknown}) => (
            <div data-testid='list-item' className={className} {...props}>{children}</div>
        ),
        {
            Left: ({children, className}: {children?: React.ReactNode; className?: string}) => (
                <div data-testid='list-item-left' className={className}>{children}</div>
            ),
            Right: ({children, className}: {children?: React.ReactNode; className?: string}) => (
                <div data-testid='list-item-right' className={className}>{children}</div>
            ),
        },
    );

    const MockVirtualizedTreeList = Object.assign(
        createMockComponent('virtualized-tree-list'),
        {
            Row: ({children, ...props}: {children?: React.ReactNode;[key: string]: unknown}) => (
                <div data-testid='tree-row' {...props}>{children}</div>
            ),
            RowLeft: ({children, ...props}: {children?: React.ReactNode;[key: string]: unknown}) => (
                <div data-testid='row-left' {...props}>{children}</div>
            ),
            RowContent: ({children, ...props}: {children?: React.ReactNode;[key: string]: unknown}) => (
                <div data-testid='row-content' {...props}>{children}</div>
            ),
            RowRight: ({children, ...props}: {children?: React.ReactNode;[key: string]: unknown}) => (
                <div data-testid='row-right' {...props}>{children}</div>
            ),
            RowLoading: ({children, level, className}: {children?: React.ReactNode; level?: number; className?: string}) => (
                <div data-testid='row-loading' data-level={level} className={className}>{children}</div>
            ),
            RowLevelSpacer: ({level}: {level?: number}) => (
                <span data-testid='row-level-spacer' data-level={level} />
            ),
            RowExpandControl: ({rowId, expanded, hasChildren, onToggle, selected}: {
                rowId?: string;
                expanded?: boolean;
                hasChildren?: boolean;
                onToggle?: () => void;
                selected?: boolean;
            }) => (
                <button
                    data-testid='row-expand-control'
                    data-row-id={rowId}
                    data-expanded={expanded}
                    data-has-children={hasChildren}
                    onClick={onToggle}
                />
            ),
            RowSelectionControl: ({rowId}: {rowId?: string}) => (
                <div data-testid='row-selection-control' data-row-id={rowId} />
            ),
        },
    );

    return {
        ListItem: MockListItem,
        VirtualizedTreeList: MockVirtualizedTreeList,
    };
});

// Mock lucide-react
vi.mock('lucide-react', () => ({
    Loader2: ({className}: {className?: string}) => (
        <span data-testid='loader-icon' className={className} />
    ),
}));

// Mock ContentLabel
vi.mock('../content/ContentLabel', () => ({
    ContentLabel: ({content, variant, className}: {content: unknown; variant?: string; className?: string}) => (
        <span data-testid='content-label' className={className}>Content Label</span>
    ),
}));

// Mock StatusBadge
vi.mock('../status/StatusBadge', () => ({
    StatusBadge: ({status}: {status?: string}) => (
        <span data-testid='status-badge' data-status={status}>Status</span>
    ),
}));

// Now import the component
import {ContentComboboxRow, type ContentComboboxRowProps} from './ContentComboboxRow';

// Helper to create mock flat node
function createMockNode(
    id: string,
    options: {
        nodeType?: 'node' | 'loading';
        selectable?: boolean;
        level?: number;
        hasChildren?: boolean;
        isExpanded?: boolean;
        isLoading?: boolean;
        /** Set to true to create a skeleton node (nodeType: 'node' with data: null) */
        skeleton?: boolean;
    } = {},
): ContentComboboxFlatNode {
    const {
        nodeType = 'node',
        selectable = true,
        level = 1,
        hasChildren = false,
        isExpanded = false,
        isLoading = false,
        skeleton = false,
    } = options;

    if (nodeType === 'loading') {
        return {
            id: `__loading__${id}`,
            data: null,
            level,
            parentId: id === 'root' ? null : id,
            hasChildren: false,
            isExpanded: false,
            isLoading,
            isLoadingData: false,
            nodeType: 'loading',
        };
    }

    // Skeleton is a regular node with null data
    if (skeleton) {
        return {
            id,
            data: null,
            level,
            parentId: null,
            hasChildren: false,
            isExpanded: false,
            isLoading: false,
            isLoadingData: false,
            nodeType: 'node',
        };
    }

    const mockContent = {
        getId: () => id,
        getPublishStatus: () => 'ONLINE',
    };

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
            item: mockContent as never,
            selectable,
        },
        level,
        parentId: null,
        hasChildren,
        isExpanded,
        isLoading: false,
        isLoadingData: false,
        nodeType: 'node',
    };
}

// Helper to create default item props
function createItemProps(overrides: Partial<ContentComboboxRowProps['itemProps']> = {}): ContentComboboxRowProps['itemProps'] {
    return {
        role: 'option',
        selected: false,
        active: false,
        ...overrides,
    } as ContentComboboxRowProps['itemProps'];
}

describe('ContentComboboxRow', () => {
    const defaultProps: ContentComboboxRowProps = {
        node: createMockNode('1'),
        itemProps: createItemProps(),
        showExpandControl: true,
        showStatusBadge: true,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('loading node', () => {
        it('renders LoadingRow when nodeType="loading"', () => {
            const loadingNode = createMockNode('root', {nodeType: 'loading', isLoading: true});

            render(
                <ContentComboboxRow
                    {...defaultProps}
                    node={loadingNode}
                />,
            );

            expect(screen.getByTestId('row-loading')).toBeDefined();
            expect(screen.queryByTestId('tree-row')).toBeNull();
        });

        it('shows spinner only when isLoading=true', () => {
            const loadingNode = createMockNode('root', {nodeType: 'loading', isLoading: true});

            render(
                <ContentComboboxRow
                    {...defaultProps}
                    node={loadingNode}
                />,
            );

            expect(screen.getByTestId('loader-icon')).toBeDefined();
        });

        it('hides spinner when isLoading=false', () => {
            const loadingNode = createMockNode('root', {nodeType: 'loading', isLoading: false});

            render(
                <ContentComboboxRow
                    {...defaultProps}
                    node={loadingNode}
                />,
            );

            expect(screen.queryByTestId('loader-icon')).toBeNull();
        });

        it('respects showExpandControl for margin', () => {
            const loadingNode = createMockNode('root', {nodeType: 'loading', isLoading: true});

            const {rerender} = render(
                <ContentComboboxRow
                    {...defaultProps}
                    node={loadingNode}
                    showExpandControl
                />,
            );

            const iconWithExpand = screen.getByTestId('loader-icon');
            expect(iconWithExpand.className).toContain('ml-7.5');

            rerender(
                <ContentComboboxRow
                    {...defaultProps}
                    node={loadingNode}
                    showExpandControl={false}
                />,
            );

            const iconWithoutExpand = screen.getByTestId('loader-icon');
            expect(iconWithoutExpand.className).toContain('ml-2');
        });
    });

    describe('skeleton node', () => {
        it('renders SkeletonRow when data=null', () => {
            const skeletonNode = createMockNode('1', {skeleton: true});

            render(
                <ContentComboboxRow
                    {...defaultProps}
                    node={skeletonNode}
                />,
            );

            expect(screen.getByTestId('tree-row')).toBeDefined();
            // Skeleton has pulse animation
            expect(screen.getByText((_, el) => el?.className?.includes('animate-pulse') ?? false)).toBeDefined();
        });

        it('shows RowLeft when showExpandControl=true', () => {
            const skeletonNode: ContentComboboxFlatNode = {
                id: '1',
                data: null,
                level: 1,
                parentId: null,
                hasChildren: false,
                isExpanded: false,
                isLoading: false,
                isLoadingData: false,
                nodeType: 'node', // regular node with null data = skeleton
            };

            render(
                <ContentComboboxRow
                    {...defaultProps}
                    node={skeletonNode}
                    showExpandControl
                />,
            );

            expect(screen.getByTestId('row-left')).toBeDefined();
        });

        it('hides RowLeft when showExpandControl=false', () => {
            const skeletonNode: ContentComboboxFlatNode = {
                id: '1',
                data: null,
                level: 1,
                parentId: null,
                hasChildren: false,
                isExpanded: false,
                isLoading: false,
                isLoadingData: false,
                nodeType: 'node', // regular node with null data = skeleton
            };

            render(
                <ContentComboboxRow
                    {...defaultProps}
                    node={skeletonNode}
                    showExpandControl={false}
                />,
            );

            expect(screen.queryByTestId('row-left')).toBeNull();
        });
    });

    describe('normal node', () => {
        it('renders content with ContentLabel', () => {
            render(<ContentComboboxRow {...defaultProps} />);

            expect(screen.getByTestId('content-label')).toBeDefined();
        });

        it('shows RowLeft when showExpandControl=true', () => {
            render(
                <ContentComboboxRow
                    {...defaultProps}
                    showExpandControl
                />,
            );

            expect(screen.getByTestId('row-left')).toBeDefined();
            expect(screen.getByTestId('row-expand-control')).toBeDefined();
        });

        it('hides RowLeft when showExpandControl=false', () => {
            render(
                <ContentComboboxRow
                    {...defaultProps}
                    showExpandControl={false}
                />,
            );

            expect(screen.queryByTestId('row-left')).toBeNull();
            expect(screen.queryByTestId('row-expand-control')).toBeNull();
        });

        it('shows selection control when selectable=true', () => {
            const selectableNode = createMockNode('1', {selectable: true});

            render(
                <ContentComboboxRow
                    {...defaultProps}
                    node={selectableNode}
                />,
            );

            expect(screen.getByTestId('row-selection-control')).toBeDefined();
        });

        it('hides selection control when selectable=false', () => {
            const nonSelectableNode = createMockNode('1', {selectable: false});

            render(
                <ContentComboboxRow
                    {...defaultProps}
                    node={nonSelectableNode}
                />,
            );

            expect(screen.queryByTestId('row-selection-control')).toBeNull();
        });

        it('shows StatusBadge when showStatusBadge=true', () => {
            render(
                <ContentComboboxRow
                    {...defaultProps}
                    showStatusBadge
                />,
            );

            expect(screen.getByTestId('status-badge')).toBeDefined();
        });

        it('hides StatusBadge when showStatusBadge=false', () => {
            render(
                <ContentComboboxRow
                    {...defaultProps}
                    showStatusBadge={false}
                />,
            );

            expect(screen.queryByTestId('status-badge')).toBeNull();
        });
    });

    describe('expand/collapse', () => {
        it('calls onExpand when expand control clicked (collapsed)', () => {
            const onExpand = vi.fn();
            const node = createMockNode('1', {hasChildren: true, isExpanded: false});

            render(
                <ContentComboboxRow
                    {...defaultProps}
                    node={node}
                    onExpand={onExpand}
                />,
            );

            const expandControl = screen.getByTestId('row-expand-control');
            fireEvent.click(expandControl);

            expect(onExpand).toHaveBeenCalledWith('1');
        });

        it('calls onCollapse when expand control clicked (expanded)', () => {
            const onCollapse = vi.fn();
            const node = createMockNode('1', {hasChildren: true, isExpanded: true});

            render(
                <ContentComboboxRow
                    {...defaultProps}
                    node={node}
                    onCollapse={onCollapse}
                />,
            );

            const expandControl = screen.getByTestId('row-expand-control');
            fireEvent.click(expandControl);

            expect(onCollapse).toHaveBeenCalledWith('1');
        });

        it('passes correct expanded state to RowExpandControl', () => {
            const expandedNode = createMockNode('1', {hasChildren: true, isExpanded: true});

            render(
                <ContentComboboxRow
                    {...defaultProps}
                    node={expandedNode}
                />,
            );

            const expandControl = screen.getByTestId('row-expand-control');
            expect(expandControl.getAttribute('data-expanded')).toBe('true');
        });

        it('passes correct hasChildren to RowExpandControl', () => {
            const nodeWithChildren = createMockNode('1', {hasChildren: true});

            render(
                <ContentComboboxRow
                    {...defaultProps}
                    node={nodeWithChildren}
                />,
            );

            const expandControl = screen.getByTestId('row-expand-control');
            expect(expandControl.getAttribute('data-has-children')).toBe('true');
        });
    });

    describe('level handling', () => {
        it('passes level to RowLevelSpacer', () => {
            const node = createMockNode('1', {level: 3});

            render(
                <ContentComboboxRow
                    {...defaultProps}
                    node={node}
                />,
            );

            const spacer = screen.getByTestId('row-level-spacer');
            expect(spacer.getAttribute('data-level')).toBe('3');
        });

        it('passes level to LoadingRow', () => {
            const loadingNode = createMockNode('parent', {nodeType: 'loading', level: 2, isLoading: true});

            render(
                <ContentComboboxRow
                    {...defaultProps}
                    node={loadingNode}
                />,
            );

            const loadingRow = screen.getByTestId('row-loading');
            expect(loadingRow.getAttribute('data-level')).toBe('2');
        });
    });
});
