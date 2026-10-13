import { act, fireEvent, render } from '@testing-library/preact';
import { atom, computed } from 'nanostores';
import { ok, type Result } from 'neverthrow';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Descriptor } from '../../../../../../app/page/Descriptor';
import type { PageEditorContentContext } from '../../../../../widgets/inspectors/model/page-editor/types';
import { deferred, inspectionContext as context } from '../../../../../widgets/inspectors/model/inspectionTestUtils';

const { loadComponentDescriptors, loadComponentDescriptor } = vi.hoisted(() => ({
    loadComponentDescriptors: vi.fn(),
    loadComponentDescriptor: vi.fn(),
}));

vi.mock('../../../../../widgets/inspectors/api/componentInspection.api', () => ({
    loadComponentDescriptors,
    loadComponentDescriptor,
}));

vi.mock('../../../../../widgets/inspectors/model/page-editor/store', () => {
    const $contentContext = atom<PageEditorContentContext | null>(null);
    return {
        $contentContext,
        $contentScopeKey: computed($contentContext, (ctx) =>
            ctx ? `${ctx.contentId.toString()}:${ctx.sitePath}` : null,
        ),
        $inspectedItem: atom(null),
        $inspectedPath: atom<string | null>('/main/0'),
        $page: atom(null),
        $pageVersion: atom(0),
    };
});

vi.mock('../../../../../widgets/inspectors/lib/usePageOptions', () => ({
    useSelectedPageOption: () => undefined,
}));
vi.mock('../../../../../widgets/inspectors/model/page-editor', () => ({
    requestComponentMove: vi.fn(),
}));
vi.mock('../../../model/wizardContent.store', () => ({
    $wizardReadOnly: atom(false),
}));
vi.mock('../../../model/wizardValidation.store', () => ({
    $invalidComponentPaths: atom(new Set<string>()),
    $validationVisibility: atom('all'),
}));
vi.mock('../../../../../shared/ui/EditLockOverlay', () => ({
    EditLockOverlay: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('./PageComponentsContextMenu', () => ({
    PageComponentsContextMenu: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('./pageComponents.store', () => ({
    $componentsFlatNodes: atom([
        {
            id: '/main/0',
            parentId: '/main',
            level: 1,
            hasChildren: false,
            isExpanded: false,
            isLoading: false,
            isLoadingData: false,
            nodeType: 'node',
            data: {
                dragId: 'part-row',
                displayName: 'Hero',
                nodeType: 'part',
                draggable: true,
                layoutFragment: false,
                hasDescriptor: true,
                descriptorKey: 'app:hero',
            },
        },
    ]),
    $componentsTreeState: atom({}),
    collapseComponentNode: vi.fn(),
    computeMovedItemPath: vi.fn(),
    expandPathToComponent: vi.fn(),
    hasLayoutAncestor: vi.fn(),
    rebuildComponentsTree: vi.fn(),
    remapExpandedIdsAfterMove: vi.fn(),
    toggleComponentExpand: vi.fn(),
}));
vi.mock('@enonic/lib-admin-ui/form2/components', () => ({
    projectTreeDrop: vi.fn(),
    SortableList: ({
        items,
        renderItem,
        getItemProps,
        keyExtractor,
    }: {
        items: { id: string }[];
        renderItem: (context: unknown) => React.ReactNode;
        getItemProps: (context: unknown) => Record<string, unknown>;
        keyExtractor: (item: { id: string }) => string;
    }) => (
        <div>
            {items.map((item, index) => {
                const context = {
                    item,
                    index,
                    isDragging: false,
                    isDragActive: false,
                    isFocused: false,
                    isMovable: true,
                };
                return (
                    <div key={keyExtractor(item)} {...getItemProps(context)}>
                        {renderItem(context)}
                    </div>
                );
            })}
        </div>
    ),
}));
vi.mock('@enonic/ui', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@enonic/ui')>()),
    getIsMobile: () => false,
}));

import { $contentContext } from '../../../../../widgets/inspectors/model/page-editor/store';
import {
    cleanupComponentInspection,
    initComponentInspectionService,
} from '../../../../../widgets/inspectors/model/component-inspection.store';
import { PageComponentsView } from './PageComponentsView';

describe('PageComponentsView inspection wiring', () => {
    afterEach(() => {
        cleanupComponentInspection();
        $contentContext.set(null);
        vi.unstubAllGlobals();
        loadComponentDescriptors.mockReset();
        loadComponentDescriptor.mockReset();
    });

    it('keeps the selected part and custom image through same-scope and site renames', async () => {
        const part = {
            getKey: () => ({ toString: () => 'app:hero' }),
            getIcon: () => '/hero.svg',
        } as Descriptor;
        loadComponentDescriptors.mockImplementation((type: string) =>
            Promise.resolve(ok(type === 'part' ? [part] : [])),
        );
        loadComponentDescriptor.mockReturnValue({ unwrapOr: async () => undefined });
        vi.stubGlobal('requestAnimationFrame', () => 1);
        vi.stubGlobal('cancelAnimationFrame', vi.fn());

        $contentContext.set(context());
        initComponentInspectionService();
        const { container } = render(<PageComponentsView />);
        await vi.waitFor(() => expect(container.querySelector('img[src="/hero.svg"]')).toBeTruthy());
        const image = container.querySelector('img[src="/hero.svg"]');
        expect(container.querySelector('[aria-selected="true"]')).toBeTruthy();
        if (image) {
            fireEvent.load(image);
        }

        // Renaming non-site content leaves the site path and inspection scope unchanged.
        act(() => {
            $contentContext.set(context());
            initComponentInspectionService();
        });

        expect(container.querySelector('img[src="/hero.svg"]')).toBe(image);
        expect(container.querySelector('[aria-selected="true"]')).toBeTruthy();
        expect(loadComponentDescriptors).toHaveBeenCalledTimes(2);

        const pendingPart = deferred<Result<Descriptor[], Error>>();
        loadComponentDescriptors.mockImplementation((type: string) =>
            type === 'part' ? pendingPart.promise : Promise.resolve(ok([])),
        );
        act(() => $contentContext.set(context('content-id', '/renamed-site')));

        expect(container.querySelector('img[src="/hero.svg"]')).toBe(image);
        expect(container.querySelector('[aria-selected="true"]')).toBeTruthy();
        await vi.waitFor(() => expect(loadComponentDescriptors).toHaveBeenCalledTimes(4));
        await act(async () => pendingPart.resolve(ok([part])));
        expect(container.querySelector('img[src="/hero.svg"]')).toBe(image);
    });
});
