import {renderHook} from '@testing-library/preact';
import {atom, type WritableAtom} from 'nanostores';
import {afterEach, describe, expect, it, vi} from 'vitest';
import type {Descriptor} from '../../../../../../../../../app/page/Descriptor';

vi.mock('../../../../../../../store/page-editor', () => ({
    $inspectedItem: atom<unknown>(null),
    requestSetComponentDescriptor: vi.fn(),
}));

vi.mock('../../../../../../../store/component-inspection.store', () => ({
    $partDescriptorOptions: atom<Descriptor[]>([]),
    $layoutDescriptorOptions: atom<Descriptor[]>([]),
    $componentConfigDescriptor: atom<Descriptor | null>(null),
    $isComponentInspectionLoading: atom<boolean>(false),
    $selectedComponentDescriptorKey: atom<string | null>(null),
}));

vi.mock('../../../../../../../hooks/useI18n', () => ({
    useI18n: (key: string): string => {
        if (key === 'text.noDescription') return 'No description';
        if (key === 'notify.component.descriptor.notfound') return 'Descriptor not found';
        return key;
    },
}));

import * as componentInspectionStore from '../../../../../../../store/component-inspection.store';
import {useComponentDescriptorSelector} from './useComponentDescriptorSelector';

// `$selectedComponentDescriptorKey` is a computed in the real store but a writable atom in the mock above.
const $selectedKey = componentInspectionStore.$selectedComponentDescriptorKey as unknown as WritableAtom<string | null>;
const $partOptions = componentInspectionStore.$partDescriptorOptions;
const $layoutOptions = componentInspectionStore.$layoutDescriptorOptions;
const $cachedDescriptor = componentInspectionStore.$componentConfigDescriptor;
const $loading = componentInspectionStore.$isComponentInspectionLoading;

function makeDescriptor(key: string, displayName: string, description = ''): Descriptor {
    return {
        getKey: () => ({toString: () => key}),
        getDisplayName: () => displayName,
        getDescription: () => description,
    } as unknown as Descriptor;
}

describe('useComponentDescriptorSelector', () => {
    afterEach(() => {
        $partOptions.set([]);
        $layoutOptions.set([]);
        $cachedDescriptor.set(null);
        $loading.set(false);
        $selectedKey.set(null);
        vi.restoreAllMocks();
    });

    describe('persisted key references a missing application', () => {
        it('should synthesize an invalid option when no descriptors are loaded', () => {
            $selectedKey.set('tutorial.nxp:heading');
            $partOptions.set([]);

            const {result} = renderHook(() => useComponentDescriptorSelector('part'));

            expect(result.current.filteredOptions).toHaveLength(1);
            expect(result.current.filteredOptions[0]).toEqual({
                key: 'tutorial.nxp:heading',
                label: 'heading',
                description: 'Descriptor not found',
                isInvalid: true,
            });
            expect(result.current.selectedOption?.isInvalid).toBe(true);
            expect(result.current.isEmpty).toBe(false);
        });

        it('should keep unrelated descriptors and include the invalid one when other apps are connected', () => {
            $selectedKey.set('tutorial.nxp:heading');
            $partOptions.set([
                makeDescriptor('other.app:button', 'Button', 'A button'),
                makeDescriptor('other.app:card', 'Card', 'A card'),
            ]);

            const {result} = renderHook(() => useComponentDescriptorSelector('part'));

            expect(result.current.filteredOptions).toHaveLength(3);
            const invalid = result.current.filteredOptions.find(o => o.key === 'tutorial.nxp:heading');
            expect(invalid?.isInvalid).toBe(true);
            const others = result.current.filteredOptions.filter(o => o.key !== 'tutorial.nxp:heading');
            expect(others.map(o => o.key).toSorted()).toEqual([
                'other.app:button',
                'other.app:card',
            ]);
            expect(others.every(o => !o.isInvalid)).toBe(true);
            expect(result.current.selectedOption?.isInvalid).toBe(true);
            expect(result.current.isEmpty).toBe(false);
        });

        it('should use the cached descriptor display name when available (mid-session removal)', () => {
            $selectedKey.set('tutorial.nxp:heading');
            $partOptions.set([]);
            $cachedDescriptor.set(
                makeDescriptor('tutorial.nxp:heading', 'Heading', 'Renders an h1'),
            );

            const {result} = renderHook(() => useComponentDescriptorSelector('part'));

            expect(result.current.filteredOptions[0].label).toBe('Heading');
            expect(result.current.filteredOptions[0].isInvalid).toBe(true);
        });

        it('should ignore a cached descriptor whose key does not match the persisted key', () => {
            $selectedKey.set('tutorial.nxp:heading');
            $partOptions.set([]);
            $cachedDescriptor.set(
                makeDescriptor('other.app:button', 'Button'),
            );

            const {result} = renderHook(() => useComponentDescriptorSelector('part'));

            expect(result.current.filteredOptions[0].label).toBe('heading');
            expect(result.current.filteredOptions[0].isInvalid).toBe(true);
        });
    });

    describe('persisted key matches a loaded descriptor', () => {
        it('should not synthesize an invalid option', () => {
            $selectedKey.set('tutorial.nxp:heading');
            $partOptions.set([
                makeDescriptor('tutorial.nxp:heading', 'Heading', 'Renders an h1'),
            ]);

            const {result} = renderHook(() => useComponentDescriptorSelector('part'));

            expect(result.current.filteredOptions).toHaveLength(1);
            expect(result.current.filteredOptions[0].isInvalid).toBeUndefined();
            expect(result.current.filteredOptions[0].label).toBe('Heading');
            expect(result.current.selectedOption?.label).toBe('Heading');
            expect(result.current.isEmpty).toBe(false);
        });
    });

    describe('no persisted key', () => {
        it('should report empty when no key and no options', () => {
            $selectedKey.set(null);
            $partOptions.set([]);

            const {result} = renderHook(() => useComponentDescriptorSelector('part'));

            expect(result.current.filteredOptions).toHaveLength(0);
            expect(result.current.selectedOption).toBeUndefined();
            expect(result.current.isEmpty).toBe(true);
        });

        it('should not synthesize anything when key is null but options exist', () => {
            $selectedKey.set(null);
            $partOptions.set([
                makeDescriptor('other.app:button', 'Button'),
            ]);

            const {result} = renderHook(() => useComponentDescriptorSelector('part'));

            expect(result.current.filteredOptions).toHaveLength(1);
            expect(result.current.filteredOptions[0].isInvalid).toBeUndefined();
            expect(result.current.selectedOption).toBeUndefined();
            expect(result.current.isEmpty).toBe(false);
        });
    });

    describe('layout component type', () => {
        it('should read from $layoutDescriptorOptions when type is "layout"', () => {
            $selectedKey.set('tutorial.nxp:two-column');
            $partOptions.set([
                makeDescriptor('other.app:button', 'Button'),
            ]);
            $layoutOptions.set([]);

            const {result} = renderHook(() => useComponentDescriptorSelector('layout'));

            expect(result.current.filteredOptions).toHaveLength(1);
            expect(result.current.filteredOptions[0].key).toBe('tutorial.nxp:two-column');
            expect(result.current.filteredOptions[0].isInvalid).toBe(true);
            expect(result.current.filteredOptions[0].label).toBe('two-column');
        });
    });
});
