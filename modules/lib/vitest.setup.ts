import {vi} from 'vitest';
import jQuery from 'jquery';

// Expose jQuery globally for jquery-ui and other plugins that expect it
(globalThis as unknown as {jQuery: typeof jQuery}).jQuery = jQuery;
(globalThis as unknown as {$: typeof jQuery}).$ = jQuery;

// Also set on window for browser-like environment
if (typeof window !== 'undefined') {
    (window as unknown as {jQuery: typeof jQuery}).jQuery = jQuery;
    (window as unknown as {$: typeof jQuery}).$ = jQuery;
}

// Mock @enonic/ui globally to prevent ESM/CJS interop issues with preact/compat
// This mock is applied to all tests to avoid bundled @enonic/ui trying to import from 'react'
vi.mock('@enonic/ui', () => {
    const createMockComponent = (name: string) => {
        const Component = ({children, ...props}: {children?: unknown;[key: string]: unknown}) => {
            return {type: 'div', props: {'data-testid': name, ...props, children}};
        };
        Component.displayName = name;
        return Component;
    };

    const MockCombobox = {
        Root: createMockComponent('combobox-root'),
        Content: createMockComponent('combobox-content'),
        Control: createMockComponent('combobox-control'),
        Search: createMockComponent('combobox-search'),
        SearchIcon: createMockComponent('combobox-search-icon'),
        Input: createMockComponent('combobox-input'),
        Toggle: createMockComponent('combobox-toggle'),
        Popup: createMockComponent('combobox-popup'),
        TreeContent: createMockComponent('combobox-tree-content'),
        Portal: createMockComponent('combobox-portal'),
        Apply: createMockComponent('combobox-apply'),
    };

    const MockListbox = {
        Root: createMockComponent('listbox-root'),
        Content: createMockComponent('listbox-content'),
        Item: createMockComponent('listbox-item'),
    };

    const MockListItem = Object.assign(createMockComponent('list-item'), {
        Left: createMockComponent('list-item-left'),
        Right: createMockComponent('list-item-right'),
    });

    const MockVirtualizedTreeList = Object.assign(createMockComponent('virtualized-tree-list'), {
        Row: createMockComponent('virtualized-tree-list-row'),
        RowContent: createMockComponent('virtualized-tree-list-row-content'),
        RowLeft: createMockComponent('virtualized-tree-list-row-left'),
        RowRight: createMockComponent('virtualized-tree-list-row-right'),
        RowLoading: createMockComponent('virtualized-tree-list-row-loading'),
        RowPlaceholder: createMockComponent('virtualized-tree-list-row-placeholder'),
        RowLevelSpacer: createMockComponent('virtualized-tree-list-row-level-spacer'),
        RowExpandControl: createMockComponent('virtualized-tree-list-row-expand-control'),
        RowSelectionControl: createMockComponent('virtualized-tree-list-row-selection-control'),
    });

    return {
        Combobox: MockCombobox,
        Listbox: MockListbox,
        ListItem: MockListItem,
        Toggle: createMockComponent('toggle'),
        Tooltip: createMockComponent('tooltip'),
        VirtualizedTreeList: MockVirtualizedTreeList,
        cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
        useCombobox: () => ({
            selection: [],
            onSelectionChange: () => {},
            selectionMode: 'multiple',
        }),
    };
});
