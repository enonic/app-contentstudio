import { act, renderHook } from '@testing-library/preact';
import { atom, type WritableAtom } from 'nanostores';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { sendAndParseMock } = vi.hoisted(() => ({ sendAndParseMock: vi.fn() }));

vi.mock('@enonic/lib-admin-ui/DefaultErrorHandler', () => ({
    DefaultErrorHandler: { handle: vi.fn() },
}));

vi.mock('@enonic/lib-admin-ui/notify/MessageBus', () => ({
    showWarning: vi.fn(),
}));

vi.mock('../../../../../../../../app/content/ContentId', () => ({
    ContentId: class {
        constructor(private readonly value: string) {}
        toString(): string {
            return this.value;
        }
    },
}));

vi.mock('../../../../../../../../app/page/region/FragmentComponent', () => ({
    FragmentComponent: class {},
}));

vi.mock('../../../../../../../../app/page/region/LayoutComponent', () => ({
    LayoutComponent: class {},
}));

vi.mock('../../../../../../../../app/page/region/LayoutComponentType', () => ({
    LayoutComponentType: class {},
}));

vi.mock('../../../../../../../../app/resource/GetContentByIdRequest', () => ({
    GetContentByIdRequest: class {
        sendAndParse = sendAndParseMock;
    },
}));

vi.mock('../../../../../model/page-editor', () => ({
    $inspectedItem: atom<unknown>(null),
    $pageEditorLifecycle: atom({ isPageLocked: false }),
    requestSetFragmentComponent: vi.fn(),
}));

vi.mock('../../../../../model/page-editor/store', () => ({
    $pageVersion: atom(0),
}));

vi.mock('../../../../../model/fragment-inspection.store', () => ({
    $fragmentOptions: atom<unknown[]>([]),
    $isFragmentInspectionLoading: atom<boolean>(false),
    $selectedFragmentId: atom<string | null>(null),
}));

vi.mock('../../../../../../../shared/lib/hooks/useI18n', () => ({
    useI18n: (key: string): string => {
        if (key === 'text.noDescription') return 'No description';
        if (key === 'notify.fragment.component.content.notfound') return 'Fragment not found';
        if (key === 'notify.nestedLayouts') return 'Nested layouts are not allowed';
        return key;
    },
}));

import { showWarning } from '@enonic/lib-admin-ui/notify/MessageBus';
import { FragmentComponent } from '../../../../../../../../app/page/region/FragmentComponent';
import { LayoutComponent } from '../../../../../../../../app/page/region/LayoutComponent';
import { LayoutComponentType } from '../../../../../../../../app/page/region/LayoutComponentType';
import * as fragmentInspectionStore from '../../../../../model/fragment-inspection.store';
import { $inspectedItem, requestSetFragmentComponent } from '../../../../../model/page-editor';
import { useFragmentContentSelector } from './useFragmentContentSelector';

const $inspected = $inspectedItem as unknown as WritableAtom<unknown>;
const $options = fragmentInspectionStore.$fragmentOptions as unknown as WritableAtom<unknown[]>;
const $selectedId = fragmentInspectionStore.$selectedFragmentId as unknown as WritableAtom<string | null>;

function makeFragmentSummary(id: string, displayName: string, path = `/fragments/${id}`): unknown {
    return {
        getId: () => id,
        getDisplayName: () => displayName,
        getPath: () => ({ toString: () => path }),
    };
}

function makeInspectedFragment(parent: unknown = null): unknown {
    const fragment = Object.create(FragmentComponent.prototype) as object;

    return Object.assign(fragment, {
        getParent: () => parent,
        getPath: () => 'fragment-path',
        getName: () => null,
    });
}

function makeLayoutParentRegion(): unknown {
    const layout = Object.create(LayoutComponent.prototype) as object;

    return { getParent: () => layout };
}

function makeContent(displayName: string, fragmentType: unknown): unknown {
    return {
        getDisplayName: () => displayName,
        getPage: () => ({
            getFragment: () => ({ getType: () => fragmentType }),
        }),
    };
}

describe('useFragmentContentSelector', () => {
    afterEach(() => {
        $inspected.set(null);
        $options.set([]);
        $selectedId.set(null);
        vi.clearAllMocks();
    });

    describe('placeholder option for a missing fragment', () => {
        it('should synthesize an invalid option when the selected id is not among the loaded fragments', () => {
            $selectedId.set('missing-id');
            $options.set([makeFragmentSummary('other-id', 'Other Fragment')]);

            const { result } = renderHook(() => useFragmentContentSelector());

            const invalid = result.current.filteredOptions.find((o) => o.key === 'missing-id');
            expect(invalid).toEqual({
                key: 'missing-id',
                label: 'missing-id',
                description: 'Fragment not found',
                isInvalid: true,
            });
            expect(result.current.selectedOption?.isInvalid).toBe(true);
        });

        it('should not synthesize anything when the selected id matches a loaded fragment', () => {
            $selectedId.set('frag-a');
            $options.set([makeFragmentSummary('frag-a', 'Fragment A')]);

            const { result } = renderHook(() => useFragmentContentSelector());

            expect(result.current.filteredOptions).toHaveLength(1);
            expect(result.current.filteredOptions[0].isInvalid).toBeUndefined();
            expect(result.current.selectedOption?.label).toBe('Fragment A');
        });

        it('should report empty when there is no selection and no options', () => {
            const { result } = renderHook(() => useFragmentContentSelector());

            expect(result.current.filteredOptions).toHaveLength(0);
            expect(result.current.isEmpty).toBe(true);
        });
    });

    describe('selection change', () => {
        it('should pass the selected option display name to requestSetFragmentComponent', () => {
            $inspected.set(makeInspectedFragment());
            $selectedId.set('frag-a');
            $options.set([
                makeFragmentSummary('frag-a', 'Fragment A'),
                makeFragmentSummary('frag-b', 'Fragment B'),
            ]);

            const { result } = renderHook(() => useFragmentContentSelector());

            act(() => result.current.handleSelectionChange(['frag-b']));

            expect(requestSetFragmentComponent).toHaveBeenCalledWith('fragment-path', 'frag-b', 'Fragment B');
        });

        it('should do nothing when the selected id is unchanged', () => {
            $inspected.set(makeInspectedFragment());
            $selectedId.set('frag-a');
            $options.set([makeFragmentSummary('frag-a', 'Fragment A')]);

            const { result } = renderHook(() => useFragmentContentSelector());

            act(() => result.current.handleSelectionChange(['frag-a']));

            expect(requestSetFragmentComponent).not.toHaveBeenCalled();
        });

        it('should do nothing when no fragment component is inspected', () => {
            $options.set([makeFragmentSummary('frag-a', 'Fragment A')]);

            const { result } = renderHook(() => useFragmentContentSelector());

            act(() => result.current.handleSelectionChange(['frag-a']));

            expect(requestSetFragmentComponent).not.toHaveBeenCalled();
        });
    });

    describe('selection change inside a layout', () => {
        it('should fetch the content and pass its display name', async () => {
            $inspected.set(makeInspectedFragment(makeLayoutParentRegion()));
            $options.set([makeFragmentSummary('frag-b', 'Stale Label')]);
            sendAndParseMock.mockResolvedValue(makeContent('Fresh Server Name', {}));

            const { result } = renderHook(() => useFragmentContentSelector());

            await act(async () => result.current.handleSelectionChange(['frag-b']));

            expect(requestSetFragmentComponent).toHaveBeenCalledWith('fragment-path', 'frag-b', 'Fresh Server Name');
        });

        it('should warn and not set the fragment when the selected fragment is a layout', async () => {
            $inspected.set(makeInspectedFragment(makeLayoutParentRegion()));
            $options.set([makeFragmentSummary('frag-b', 'Fragment B')]);
            const layoutType = Object.create(LayoutComponentType.prototype) as object;
            sendAndParseMock.mockResolvedValue(makeContent('Nested Layout', layoutType));

            const { result } = renderHook(() => useFragmentContentSelector());

            await act(async () => result.current.handleSelectionChange(['frag-b']));

            expect(showWarning).toHaveBeenCalledWith('Nested layouts are not allowed');
            expect(requestSetFragmentComponent).not.toHaveBeenCalled();
        });
    });
});
