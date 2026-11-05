import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { atom } from 'nanostores';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ComponentPath } from '../../../../../../app/page/region/ComponentPath';
import { PageNavigationEvent } from '../../../../../../app/wizard/PageNavigationEvent';
import {
    PageNavigationEventData,
    PageNavigationEventSource,
} from '../../../../../../app/wizard/PageNavigationEventData';
import { PageNavigationEventType } from '../../../../../../app/wizard/PageNavigationEventType';
import { PageNavigationMediator } from '../../../../../../app/wizard/PageNavigationMediator';
import { createEmptyState, type FlatNode } from '../../../../../shared/lib/tree-store';
import { $inspectedPath } from '../../../../../widgets/inspectors/model/page-editor/store';
import { PageComponentsContextMenu } from './PageComponentsContextMenu';
import type { PageComponentNodeData } from './types';

const { remove } = vi.hoisted(() => ({ remove: vi.fn() }));

vi.mock('@enonic/ui', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@enonic/ui')>()),
    getIsMobile: () => false,
}));
vi.mock('../../../../../../app/wizard/action/SaveAsTemplateAction', () => ({
    SaveAsTemplateAction: { get: vi.fn() },
}));
vi.mock('../../../../../shared/lib/hooks/useI18n', () => ({
    useI18n: (key: string) => key,
}));
vi.mock('../../../../../shared/lib/url/navigation', () => ({
    openEditContentTab: vi.fn(),
}));
vi.mock('../../../../../widgets/inspectors/model/page-editor/commands', () => ({
    requestComponentAdd: vi.fn(),
    requestComponentCreateFragment: vi.fn(),
    requestComponentDetachFragment: vi.fn(),
    requestComponentDuplicate: vi.fn(),
    requestComponentRemove: remove,
    requestComponentReset: vi.fn(),
    requestPageReset: vi.fn(),
}));
vi.mock('../../../../../widgets/inspectors/model/page-editor/store', () => ({
    $contentContext: atom(null),
    $inspectedPath: atom<string | null>(null),
    $isFragment: atom(false),
    $page: atom(null),
    isComponentEmpty: () => true,
}));
vi.mock('../../../../../widgets/inspectors/model/fragment-inspection.store', () => ({
    $areFragmentOptionsResolved: atom(true),
    $fragmentOptions: atom([]),
}));
vi.mock('../../../../../widgets/inspectors/model/component-inspection.store', () => ({
    isComponentReferenceMissing: () => false,
}));
vi.mock('./pageComponents.store', () => ({
    $componentsTreeState: atom(createEmptyState()),
    expandComponentNode: vi.fn(),
    hasLayoutAncestor: () => false,
    rebuildComponentsTree: vi.fn(),
}));

const node: FlatNode<PageComponentNodeData> = {
    id: '/main/0',
    parentId: '/main',
    level: 1,
    hasChildren: false,
    isExpanded: false,
    isLoading: false,
    isLoadingData: false,
    nodeType: 'node',
    data: {
        dragId: '/main/0',
        displayName: 'Hero',
        nodeType: 'part',
        draggable: true,
        layoutFragment: false,
        hasDescriptor: true,
    },
};

function selectInEditor(path: string): void {
    act(() => {
        PageNavigationMediator.get().notify(
            new PageNavigationEvent(
                PageNavigationEventType.SELECT,
                new PageNavigationEventData(ComponentPath.fromString(path), PageNavigationEventSource.EDITOR),
            ),
        );
    });
}

function renderComponents(nodes: FlatNode<PageComponentNodeData>[] = [node]): void {
    render(
        <PageComponentsContextMenu nodes={nodes}>
            <div role="tree">
                {nodes.map((item) => (
                    <div key={item.id} role="treeitem" tabIndex={0}>
                        {item.data.displayName}
                    </div>
                ))}
            </div>
        </PageComponentsContextMenu>,
    );
}

afterEach(() => {
    cleanup();
    $inspectedPath.set(null);
    vi.clearAllMocks();
});

describe('PageComponentsContextMenu editor dismissal', () => {
    it.each(['/main/0', '/main/1'])('closes on an editor right-click at %s', async (path) => {
        renderComponents();
        selectInEditor('/main/0');
        fireEvent.contextMenu(screen.getByText('Hero'), { clientX: 10, clientY: 10 });
        await screen.findByRole('menu');

        // LiveEditPageProxy forwards this SELECT even when the path has not changed.
        selectInEditor(path);

        await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    });
});

it('uses the focused component for a keyboard-origin contextmenu event when another component is selected', async () => {
    const nodes = [node, { ...node, id: '/main/1', data: { ...node.data, dragId: '/main/1', displayName: 'Other' } }];
    $inspectedPath.set(nodes[0].id);
    renderComponents(nodes);

    const focused = screen.getAllByRole('treeitem')[1];
    focused.focus();
    // Shared UI translates the shortcut into this event; row targeting belongs to Content Studio.
    fireEvent.contextMenu(focused, { button: 0 });
    fireEvent.click(await screen.findByRole('menuitem', { name: 'action.component.remove' }));

    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove.mock.calls[0][0].toString()).toBe(nodes[1].id);
    expect($inspectedPath.get()).toBe(nodes[0].id);
});
