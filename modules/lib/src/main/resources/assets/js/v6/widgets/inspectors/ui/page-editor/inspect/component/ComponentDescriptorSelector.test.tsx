import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentOption } from './hooks/useComponentDescriptorSelector';

// Mock @enonic/ui — render structural slots so popup content is observable
vi.mock('@enonic/ui', () => {
    const passthrough = (name: string) =>
        Object.assign(
            ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
                <div data-testid={name} {...props}>
                    {children}
                </div>
            ),
            { displayName: name },
        );

    const MockCombobox = {
        Root: passthrough('combobox-root'),
        Content: passthrough('combobox-content'),
        Control: passthrough('combobox-control'),
        Search: passthrough('combobox-search'),
        Input: ({ placeholder, ...props }: { placeholder?: string; [key: string]: unknown }) => (
            <input role="combobox" placeholder={placeholder} {...props} />
        ),
        Toggle: passthrough('combobox-toggle'),
        Value: passthrough('combobox-value'),
        Portal: passthrough('combobox-portal'),
        Popup: passthrough('combobox-popup'),
    };

    const MockListbox = {
        Content: passthrough('listbox-content'),
        Item: passthrough('listbox-item'),
    };

    return {
        cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
        Combobox: MockCombobox,
        Listbox: MockListbox,
    };
});

// Mock lucide-react icons used by the component type map
vi.mock('lucide-react', () => ({
    Box: () => <span data-testid="icon-box" />,
    Columns2: () => <span data-testid="icon-columns" />,
}));

// Mock useI18n — return readable English strings for asserted keys
vi.mock('../../../../../../shared/lib/hooks/useI18n', () => ({
    useI18n: vi.fn((key: string) => {
        const translations: Record<string, string> = {
            'field.part': 'Part',
            'field.layout': 'Layout',
            'field.option.placeholder': 'Type to search...',
            'field.descriptors.notFound': 'No descriptors found',
            'field.option.noitems': 'No matching items',
        };
        return translations[key] ?? key;
    }),
}));

// Mock the selector hook so component state is fully controllable
let mockSelectorState: {
    filteredOptions: ComponentOption[];
    selectedOption: ComponentOption | undefined;
    searchValue: string | undefined;
    setSearchValue: (value: string | undefined) => void;
    selection: string[];
    handleSelectionChange: (selection: readonly string[]) => void;
    isLoading: boolean;
    isEmpty: boolean;
};

vi.mock('./hooks/useComponentDescriptorSelector', () => ({
    useComponentDescriptorSelector: () => mockSelectorState,
}));

import { render, screen } from '@testing-library/preact';
import { ComponentDescriptorSelector } from './ComponentDescriptorSelector';

const buildOption = (key: string, label: string): ComponentOption => ({
    key,
    label,
    description: `${label} description`,
});

describe('ComponentDescriptorSelector', () => {
    beforeEach(() => {
        mockSelectorState = {
            filteredOptions: [buildOption('app:part-1', 'Hero Part')],
            selectedOption: undefined,
            searchValue: undefined,
            setSearchValue: vi.fn(),
            selection: [],
            handleSelectionChange: vi.fn(),
            isLoading: false,
            isEmpty: false,
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should display "No matching items" when the search filters out all options', () => {
        mockSelectorState.filteredOptions = [];
        mockSelectorState.searchValue = 'zzz';

        render(<ComponentDescriptorSelector componentType="part" />);

        expect(screen.getByText('No matching items')).toBeDefined();
        expect(screen.queryAllByTestId('listbox-item')).toHaveLength(0);
    });

    it('should render the options instead of the empty message when results match', () => {
        render(<ComponentDescriptorSelector componentType="part" />);

        expect(screen.getByText('Hero Part')).toBeDefined();
        expect(screen.queryByText('No matching items')).toBeNull();
    });

    it('should show the not-found label and no popup when there are no descriptors at all', () => {
        mockSelectorState.filteredOptions = [];
        mockSelectorState.isEmpty = true;

        render(<ComponentDescriptorSelector componentType="part" />);

        expect(screen.getByText('No descriptors found')).toBeDefined();
        expect(screen.queryByText('No matching items')).toBeNull();
        expect(screen.queryByTestId('combobox-popup')).toBeNull();
    });
});
