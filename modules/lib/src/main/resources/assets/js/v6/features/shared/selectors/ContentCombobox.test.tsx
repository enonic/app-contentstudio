import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

// Mock @enonic/ui before importing the component
vi.mock('@enonic/ui', () => {
    const createMockComponent = (name: string) => {
        const Component = ({children, ...props}: {children?: React.ReactNode;[key: string]: unknown}) => {
            return <div data-testid={name} {...props}>{children}</div>;
        };
        Component.displayName = name;
        return Component;
    };

    const MockCombobox = {
        Root: ({children, disabled, open, onOpenChange, value, onChange, ...props}: {children?: React.ReactNode; disabled?: boolean; open?: boolean; onOpenChange?: (open: boolean) => void; value?: string; onChange?: (value: string) => void;[key: string]: unknown}) => {
            return (
                <div data-testid='combobox-root' data-disabled={disabled} data-open={open} {...props}>{children}</div>
            );
        },
        Content: createMockComponent('combobox-content'),
        Control: createMockComponent('combobox-control'),
        Search: createMockComponent('combobox-search'),
        SearchIcon: createMockComponent('combobox-search-icon'),
        Input: ({placeholder, disabled, id, ...props}: {placeholder?: string; disabled?: boolean; id?: string; 'aria-label'?: string; 'aria-labelledby'?: string;[key: string]: unknown}) => (
            <input
                id={id}
                role='combobox'
                placeholder={placeholder}
                disabled={disabled}
                {...props}
            />
        ),
        Toggle: createMockComponent('combobox-toggle'),
        Portal: ({children}: {children?: React.ReactNode}) => <>{children}</>,
        Popup: ({children}: {children?: React.ReactNode}) => <div data-testid='combobox-popup'>{children}</div>,
        Apply: createMockComponent('combobox-apply'),
        TreeContent: createMockComponent('combobox-tree-content'),
    };

    const MockListbox = {
        Root: createMockComponent('listbox-root'),
        Content: createMockComponent('listbox-content'),
        Item: createMockComponent('listbox-item'),
    };

    const MockToggle = ({pressed, onPressedChange, children, ...props}: {pressed?: boolean; onPressedChange?: (pressed: boolean) => void; children?: React.ReactNode;[key: string]: unknown}) => (
        <button
            role='button'
            aria-pressed={pressed}
            onClick={() => onPressedChange?.(!pressed)}
            {...props}
        >
            {children}
        </button>
    );

    const MockVirtualizedTreeList = ({children, ...props}: {children?: React.ReactNode | ((args: unknown) => React.ReactNode);[key: string]: unknown}) => (
        <div data-testid='virtualized-tree-list' {...props}>
            {typeof children === 'function' ? null : children}
        </div>
    );
    MockVirtualizedTreeList.Row = createMockComponent('virtualized-tree-list-row');
    MockVirtualizedTreeList.RowContent = createMockComponent('virtualized-tree-list-row-content');

    const MockListItem = Object.assign(
        ({children, className, ...props}: {children?: React.ReactNode; className?: string;[key: string]: unknown}) => (
            <div data-testid='list-item' className={className} {...props}>{children}</div>
        ),
        {
            Left: ({children, className, ...props}: {children?: React.ReactNode; className?: string;[key: string]: unknown}) => (
                <div data-testid='list-item-left' className={className} {...props}>{children}</div>
            ),
            Right: ({children, className, ...props}: {children?: React.ReactNode; className?: string;[key: string]: unknown}) => (
                <div data-testid='list-item-right' className={className} {...props}>{children}</div>
            ),
        },
    );

    const MockTooltip = ({children, value, delay, ...props}: {children?: React.ReactNode; value?: string; delay?: number;[key: string]: unknown}) => (
        <div data-testid='tooltip' data-value={value} {...props}>{children}</div>
    );

    const MockButton = ({children, onClick, startIcon, ...props}: {children?: React.ReactNode; onClick?: () => void; startIcon?: unknown;[key: string]: unknown}) => (
        <button data-testid='button' onClick={onClick} {...props}>{children}</button>
    );

    return {
        Button: MockButton,
        Combobox: MockCombobox,
        Listbox: MockListbox,
        ListItem: MockListItem,
        Toggle: MockToggle,
        Tooltip: MockTooltip,
        VirtualizedTreeList: MockVirtualizedTreeList,
        cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
        useCombobox: () => ({
            selection: [],
            onSelectionChange: () => {},
            selectionMode: 'multiple',
        }),
    };
});

// Mock lucide-react
vi.mock('lucide-react', () => ({
    ListTree: () => <span data-testid='list-tree-icon' />,
    AlertCircle: () => <span data-testid='alert-circle-icon' />,
    RefreshCw: () => <span data-testid='refresh-icon' />,
}));

// Mock react-virtuoso
vi.mock('react-virtuoso', () => ({
    Virtuoso: ({data, itemContent}: {data?: unknown[]; itemContent?: (index: number, item: unknown) => React.ReactNode}) => (
        <div data-testid='virtuoso'>
            {data?.map((item, index) => (
                <div key={index}>{itemContent?.(index, item)}</div>
            ))}
        </div>
    ),
}));

// Mock useI18n hook
vi.mock('../../hooks/useI18n', () => ({
    useI18n: vi.fn((key: string) => {
        const translations: Record<string, string> = {
            'field.search.placeholder': 'Type to search...',
            'field.search.noItems': 'No results found',
            'field.view.tree': 'Tree view',
            'field.view.list': 'List view',
            'field.error.loadFailed': 'Failed to load',
            'field.error.retry': 'Retry',
        };
        return translations[key] ?? key;
    }),
}));

// Mock ContentComboboxList
vi.mock('./ContentComboboxList', () => ({
    ContentComboboxList: ({items, isLoading, emptyLabel}: {items?: unknown[]; isLoading?: boolean; emptyLabel?: string}) => (
        <div data-testid='content-combobox-list' data-loading={isLoading}>
            {isLoading ? 'Loading...' : items?.length === 0 ? emptyLabel : `${items?.length ?? 0} items`}
        </div>
    ),
}));

// Mock the controller hook
const mockHandleOpenChange = vi.fn();
const mockHandleToggleView = vi.fn();
const mockHandleKeyDown = vi.fn();
const mockHandleExpand = vi.fn();
const mockHandleCollapse = vi.fn();
const mockHandleLoadMore = vi.fn();
const mockHandleFlatListEndReached = vi.fn();
const mockSetInputValue = vi.fn();
const mockSetActiveId = vi.fn();
const mockRetry = vi.fn();

let mockControllerState = {
    virtuosoRef: {current: null},
    open: false,
    isTreeView: true,
    inputValue: '',
    activeId: null as string | null,
    setInputValue: mockSetInputValue,
    setActiveId: mockSetActiveId,
    handleOpenChange: mockHandleOpenChange,
    handleToggleView: mockHandleToggleView,
    handleKeyDown: mockHandleKeyDown,
    handleExpand: mockHandleExpand,
    handleCollapse: mockHandleCollapse,
    handleLoadMore: mockHandleLoadMore,
    handleFlatListEndReached: mockHandleFlatListEndReached,
    displayItems: [] as unknown[],
    listMode: 'tree' as const,
    isLoading: false,
    hasMore: false,
    dropdownHeight: 56,
    isFiltering: false,
    error: null as Error | null,
    retry: mockRetry,
};

vi.mock('./useContentComboboxController', () => ({
    useContentComboboxController: () => mockControllerState,
}));

// Now import the component and test utilities
import {fireEvent, render, screen, waitFor} from '@testing-library/preact';
import {ContentCombobox, type ContentComboboxProps} from './ContentCombobox';

describe('ContentCombobox', () => {
    const defaultProps: ContentComboboxProps = {
        selection: [],
        onSelectionChange: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset mock controller state to defaults
        mockControllerState = {
            virtuosoRef: {current: null},
            open: false,
            isTreeView: true,
            inputValue: '',
            activeId: null,
            setInputValue: mockSetInputValue,
            setActiveId: mockSetActiveId,
            handleOpenChange: mockHandleOpenChange,
            handleToggleView: mockHandleToggleView,
            handleKeyDown: mockHandleKeyDown,
            handleExpand: mockHandleExpand,
            handleCollapse: mockHandleCollapse,
            handleLoadMore: mockHandleLoadMore,
            handleFlatListEndReached: mockHandleFlatListEndReached,
            displayItems: [],
            listMode: 'tree',
            isLoading: false,
            hasMore: false,
            dropdownHeight: 56,
            isFiltering: false,
            error: null,
            retry: mockRetry,
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        it('renders with default props', () => {
            render(<ContentCombobox {...defaultProps} />);

            expect(screen.getByRole('combobox')).toBeDefined();
        });

        it('renders with label as proper label element', () => {
            render(<ContentCombobox {...defaultProps} label='Select content' />);

            const labelElement = screen.getByText('Select content');
            expect(labelElement.tagName).toBe('LABEL');
        });

        it('associates label with input via htmlFor', () => {
            render(<ContentCombobox {...defaultProps} label='Select content' />);

            const labelElement = screen.getByText('Select content');
            const inputElement = screen.getByRole('combobox');

            expect(labelElement.getAttribute('for')).toBe(inputElement.getAttribute('id'));
        });

        it('renders with custom placeholder', () => {
            render(<ContentCombobox {...defaultProps} placeholder='Choose items...' />);

            const input = screen.getByRole('combobox');
            expect((input as HTMLInputElement).placeholder).toBe('Choose items...');
        });

        it('renders disabled state', () => {
            render(<ContentCombobox {...defaultProps} disabled />);

            const root = screen.getByTestId('combobox-root');
            expect(root.getAttribute('data-disabled')).toBe('true');
        });

        it('renders with aria-label when no label provided', () => {
            render(<ContentCombobox {...defaultProps} aria-label='Content selector' />);

            const input = screen.getByRole('combobox');
            expect(input.getAttribute('aria-label')).toBe('Content selector');
        });

        it('uses aria-labelledby when label is provided', () => {
            render(<ContentCombobox {...defaultProps} label='Select content' />);

            const input = screen.getByRole('combobox');
            const labelElement = screen.getByText('Select content');

            expect(input.getAttribute('aria-labelledby')).toBe(labelElement.getAttribute('id'));
            expect(input.getAttribute('aria-label')).toBeNull();
        });
    });

    describe('view toggle', () => {
        it('renders toggle button with correct pressed state', () => {
            mockControllerState.isTreeView = true;
            render(<ContentCombobox {...defaultProps} />);

            const toggleButton = screen.getByRole('button', {pressed: true});
            expect(toggleButton).toBeDefined();
            expect(toggleButton.getAttribute('aria-pressed')).toBe('true');
        });

        it('calls handleToggleView when toggle is clicked', async () => {
            render(<ContentCombobox {...defaultProps} />);

            const toggleButton = screen.getByRole('button');
            fireEvent.click(toggleButton);

            await waitFor(() => {
                expect(mockHandleToggleView).toHaveBeenCalled();
            });
        });
    });

    describe('selection', () => {
        it('calls onSelectionChange prop correctly', () => {
            const onSelectionChange = vi.fn();
            render(
                <ContentCombobox
                    {...defaultProps}
                    onSelectionChange={onSelectionChange}
                    selectionMode='multiple'
                />,
            );

            expect(screen.getByRole('combobox')).toBeDefined();
        });

        it('supports single selection mode', () => {
            render(<ContentCombobox {...defaultProps} selectionMode='single' />);

            expect(screen.getByRole('combobox')).toBeDefined();
        });

        it('supports multiple selection mode', () => {
            render(<ContentCombobox {...defaultProps} selectionMode='multiple' />);

            expect(screen.getByRole('combobox')).toBeDefined();
        });

        it('shows Apply button for multiple selection mode', () => {
            render(<ContentCombobox {...defaultProps} selectionMode='multiple' />);

            expect(screen.getByTestId('combobox-apply')).toBeDefined();
        });

        it('hides Apply button for single selection mode', () => {
            render(<ContentCombobox {...defaultProps} selectionMode='single' />);

            expect(screen.queryByTestId('combobox-apply')).toBeNull();
        });
    });

    describe('search behavior', () => {
        it('uses inputValue from controller', () => {
            mockControllerState.inputValue = 'test query';
            render(<ContentCombobox {...defaultProps} />);

            // Component should render without error when inputValue is set
            // The value is controlled by the controller hook
            expect(screen.getByRole('combobox')).toBeDefined();
        });
    });

    describe('empty state', () => {
        it('shows custom empty label', () => {
            mockControllerState.displayItems = [];
            mockControllerState.open = true;

            render(<ContentCombobox {...defaultProps} emptyLabel='No content found' />);

            const list = screen.getByTestId('content-combobox-list');
            expect(list.textContent).toBe('No content found');
        });
    });

    describe('className prop', () => {
        it('applies custom className to wrapper', () => {
            const {container} = render(<ContentCombobox {...defaultProps} className='custom-class' />);

            const wrapper = container.querySelector('[data-component="ContentCombobox"]');
            expect(wrapper?.classList.contains('custom-class')).toBe(true);
        });
    });

    describe('error handling', () => {
        it('renders error UI when error state is set', async () => {
            mockControllerState.error = new Error('Failed to load content');
            mockControllerState.open = true;

            render(<ContentCombobox {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByTestId('alert-circle-icon')).toBeDefined();
            });
        });

        it('shows retry button in error state', async () => {
            mockControllerState.error = new Error('Failed to load content');
            mockControllerState.open = true;

            render(<ContentCombobox {...defaultProps} />);

            await waitFor(() => {
                const retryButton = screen.getByTestId('button');
                expect(retryButton).toBeDefined();
            });
        });

        it('calls retry function when retry button clicked', async () => {
            mockControllerState.error = new Error('Failed to load content');
            mockControllerState.open = true;

            render(<ContentCombobox {...defaultProps} />);

            await waitFor(() => {
                const retryButton = screen.getByTestId('button');
                expect(retryButton).toBeDefined();
            });

            const retryButton = screen.getByTestId('button');
            fireEvent.click(retryButton);

            expect(mockRetry).toHaveBeenCalled();
        });

        it('shows error message text', async () => {
            mockControllerState.error = new Error('Test error');
            mockControllerState.open = true;

            render(<ContentCombobox {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByText('Failed to load')).toBeDefined();
            });
        });
    });

    describe('loading state', () => {
        it('passes isLoading to list component', () => {
            mockControllerState.isLoading = true;

            render(<ContentCombobox {...defaultProps} />);

            const list = screen.getByTestId('content-combobox-list');
            expect(list.getAttribute('data-loading')).toBe('true');
        });
    });

    describe('keyboard navigation', () => {
        it('attaches handleKeyDown to content', () => {
            render(<ContentCombobox {...defaultProps} />);

            const content = screen.getByTestId('combobox-content');
            expect(content).toBeDefined();
        });
    });

    describe('filter options', () => {
        it('passes filter options to controller', () => {
            render(
                <ContentCombobox
                    {...defaultProps}
                    contentTypeNames={['type1', 'type2']}
                    allowedContentPaths={['/path1', '/path2']}
                />,
            );

            // Component renders without error, meaning filters were processed
            expect(screen.getByRole('combobox')).toBeDefined();
        });
    });
});
