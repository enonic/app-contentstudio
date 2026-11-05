import { ContextMenu, getIsMobile } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { Box, Columns2, PenLine, Puzzle } from 'lucide-react';
import { type MouseEvent, type ReactElement, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { SaveAsTemplateAction } from '../../../../../../app/wizard/action/SaveAsTemplateAction';
import { FragmentComponent } from '../../../../../../app/page/region/FragmentComponent';
import { ComponentPath } from '../../../../../../app/page/region/ComponentPath';
import { ComponentType } from '../../../../../../app/page/region/ComponentType';
import { PageNavigationEvent } from '../../../../../../app/wizard/PageNavigationEvent';
import {
    PageNavigationEventData,
    PageNavigationEventSource,
} from '../../../../../../app/wizard/PageNavigationEventData';
import { PageNavigationEventType } from '../../../../../../app/wizard/PageNavigationEventType';
import type { PageNavigationHandler } from '../../../../../../app/wizard/PageNavigationHandler';
import { PageNavigationMediator } from '../../../../../../app/wizard/PageNavigationMediator';
import type { FlatNode } from '../../../../../shared/lib/tree-store';
import { getNode } from '../../../../../shared/lib/tree-store';
import { useI18n } from '../../../../../shared/lib/hooks/useI18n';
import { openEditContentTab } from '../../../../../shared/lib/url/navigation';
import {
    requestComponentAdd,
    requestComponentCreateFragment,
    requestComponentDetachFragment,
    requestComponentDuplicate,
    requestComponentRemove,
    requestComponentReset,
    requestPageReset,
} from '../../../../../widgets/inspectors/model/page-editor/commands';
import { $config } from '../../../../../shared/config/config.store';
import {
    $areFragmentOptionsResolved,
    $fragmentOptions,
} from '../../../../../widgets/inspectors/model/fragment-inspection.store';
import { isComponentReferenceMissing } from '../../../../../widgets/inspectors/model/component-inspection.store';
import {
    $contentContext,
    $isFragment,
    $page,
    isComponentEmpty,
} from '../../../../../widgets/inspectors/model/page-editor/store';
import {
    $componentsTreeState,
    expandComponentNode,
    hasLayoutAncestor,
    rebuildComponentsTree,
} from './pageComponents.store';
import type { PageComponentNodeData } from './types';
import { getPageComponentsRow, getPageComponentsRowIndex } from './pageComponentsKeyboardNavigation';

//
// * Types
//

export type PageComponentsContextMenuProps = {
    nodes: FlatNode<PageComponentNodeData>[];
    children: ReactNode;
};

//
// * Component
//

const PAGE_COMPONENTS_CONTEXT_MENU_NAME = 'PageComponentsContextMenu';
const ROOT_NODE_ID = '/';

export const PageComponentsContextMenu = ({ nodes, children }: PageComponentsContextMenuProps): ReactElement => {
    const [open, setOpen] = useState(false);
    const [node, setNode] = useState<FlatNode<PageComponentNodeData> | null>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        const mediator = PageNavigationMediator.get();
        const handler: PageNavigationHandler = {
            handle(event: PageNavigationEvent): void {
                // Iframe interactions do not bubble to the host. Listen to each editor selection,
                // including right-clicks on the already selected component.
                if (
                    event.getType() === PageNavigationEventType.SELECT &&
                    event.getData().getSource() === PageNavigationEventSource.EDITOR
                ) {
                    setOpen(false);
                }
            },
        };
        mediator.addPageNavigationHandler(handler);
        return () => mediator.removePageNavigationItem(handler);
    }, [open]);

    const handleContextMenu = (event: MouseEvent<HTMLDivElement>): void => {
        const row = getPageComponentsRow(event.currentTarget, event.target);
        setNode(row == null ? null : (nodes[getPageComponentsRowIndex(event.currentTarget, row)] ?? null));
    };

    const handlePointerDownOutside = useCallback((event: PointerEvent): void => {
        if (getIsMobile()) {
            event.preventDefault();
        }
    }, []);

    return (
        <ContextMenu
            open={open && node?.data != null}
            onOpenChange={setOpen}
            data-component={PAGE_COMPONENTS_CONTEXT_MENU_NAME}
        >
            <ContextMenu.Trigger className="min-w-0" onContextMenu={handleContextMenu}>
                {children}
            </ContextMenu.Trigger>
            <ContextMenu.Portal>
                {node?.data != null && (
                    <>
                        {getIsMobile() && (
                            <div
                                aria-hidden
                                className="fixed inset-0 z-40"
                                onPointerDown={(event) => event.stopPropagation()}
                                onClick={() => setOpen(false)}
                            />
                        )}
                        <ContextMenu.Content className="min-w-48" onPointerDownOutside={handlePointerDownOutside}>
                            <PageComponentsContextMenuItems node={node} />
                        </ContextMenu.Content>
                    </>
                )}
            </ContextMenu.Portal>
        </ContextMenu>
    );
};

PageComponentsContextMenu.displayName = PAGE_COMPONENTS_CONTEXT_MENU_NAME;

const PageComponentsContextMenuItems = ({ node }: { node: FlatNode<PageComponentNodeData> }): ReactElement => {
    const data = node.data;
    const contentContext = useStore($contentContext);
    const page = useStore($page);
    const fragmentOptions = useStore($fragmentOptions);
    const areFragmentsResolved = useStore($areFragmentOptionsResolved);

    const selectParentLabel = useI18n('action.component.select.parent');
    const insertLabel = useI18n('widget.components.insert');
    const inspectLabel = useI18n('action.component.inspect');
    const resetLabel = useI18n('action.component.reset');
    const removeLabel = useI18n('action.component.remove');
    const duplicateLabel = useI18n('action.component.duplicate');
    const saveAsFragmentLabel = useI18n('action.component.create.fragment');
    const detachFragmentLabel = useI18n('action.component.detach.fragment');
    const editFragmentLabel = useI18n('action.editFragment');
    const saveAsTemplateLabel = useI18n('action.saveAsTemplate');

    const fragmentRemoved = useMemo(
        () => isComponentReferenceMissing(node.id, page, fragmentOptions, [], areFragmentsResolved),
        [node.id, page, fragmentOptions, areFragmentsResolved],
    );

    const isPageRoot = data.nodeType === 'page' || node.id === ROOT_NODE_ID;
    if (isPageRoot) {
        return (
            <>
                <InspectItem nodeId={ROOT_NODE_ID} label={inspectLabel} />
                <PageResetItem label={resetLabel} onSelect={requestPageReset} />
                <SaveAsTemplateItem label={saveAsTemplateLabel} />
            </>
        );
    }

    const isComponent = data.nodeType !== 'region';
    const isFragmentComponent = data.nodeType === 'fragment';
    const isEmpty = isComponentEmpty(node.id);

    return (
        <>
            <SelectParentItem nodeId={node.id} label={selectParentLabel} />
            <InsertSubMenu nodeId={node.id} label={insertLabel} />
            {isComponent && (
                <>
                    <InspectItem nodeId={node.id} label={inspectLabel} />
                    {!isEmpty && <ResetItem nodeId={node.id} label={resetLabel} />}
                    <RemoveItem nodeId={node.id} label={removeLabel} />
                    <DuplicateItem nodeId={node.id} label={duplicateLabel} />
                    {!isEmpty && !isFragmentComponent && !contentContext?.isPageTemplate && (
                        <SaveAsFragmentItem nodeId={node.id} label={saveAsFragmentLabel} />
                    )}
                    {isFragmentComponent && !isEmpty && (
                        <DetachFragmentItem nodeId={node.id} label={detachFragmentLabel} disabled={fragmentRemoved} />
                    )}
                    {isFragmentComponent && (
                        <EditFragmentItem nodeId={node.id} label={editFragmentLabel} disabled={fragmentRemoved} />
                    )}
                </>
            )}
        </>
    );
};

PageComponentsContextMenuItems.displayName = 'PageComponentsContextMenuItems';

//
// * Page root menu items
//

type PageResetItemProps = {
    label: string;
    onSelect: () => void;
};

const PageResetItem = ({ label, onSelect }: PageResetItemProps): ReactElement => {
    const isFragment = useStore($isFragment);
    const isEmpty = $page.get()?.getFragment()?.isEmpty();

    if (isFragment && isEmpty) {
        return null;
    }

    return <ContextMenu.Item onSelect={onSelect}>{label}</ContextMenu.Item>;
};

PageResetItem.displayName = 'PageResetItem';

const SaveAsTemplateItem = ({ label }: { label: string }): ReactElement => {
    const isFragment = useStore($isFragment);
    const contentContext = useStore($contentContext);

    const handleSelect = useCallback(() => {
        SaveAsTemplateAction.get().execute();
    }, []);

    if (isFragment || contentContext?.isPageTemplate) {
        return null;
    }

    return <ContextMenu.Item onSelect={handleSelect}>{label}</ContextMenu.Item>;
};

SaveAsTemplateItem.displayName = 'SaveAsTemplateItem';

//
// * Component menu items
//

type MenuItemProps = {
    nodeId: string;
    label: string;
    disabled?: boolean;
};

const SelectParentItem = ({ nodeId, label }: MenuItemProps): ReactElement | null => {
    const treeState = $componentsTreeState.get();
    const treeNode = getNode(treeState, nodeId);

    const handleSelect = useCallback(() => {
        if (treeNode?.parentId != null) {
            const path = ComponentPath.fromString(treeNode.parentId);
            PageNavigationMediator.get().notify(
                new PageNavigationEvent(PageNavigationEventType.SELECT, new PageNavigationEventData(path)),
            );
        }
    }, [treeNode]);

    if (treeNode?.parentId == null) {
        return null;
    }

    return <ContextMenu.Item onSelect={handleSelect}>{label}</ContextMenu.Item>;
};

SelectParentItem.displayName = 'SelectParentItem';

const InspectItem = ({ nodeId, label }: MenuItemProps): ReactElement => {
    const handleSelect = useCallback(() => {
        const path = ComponentPath.fromString(nodeId);
        PageNavigationMediator.get().notify(
            new PageNavigationEvent(PageNavigationEventType.INSPECT, new PageNavigationEventData(path)),
        );
    }, [nodeId]);

    return <ContextMenu.Item onSelect={handleSelect}>{label}</ContextMenu.Item>;
};

InspectItem.displayName = 'InspectItem';

const ResetItem = ({ nodeId, label }: MenuItemProps): ReactElement => {
    const handleSelect = useCallback(() => {
        requestComponentReset(ComponentPath.fromString(nodeId));
    }, [nodeId]);

    return <ContextMenu.Item onSelect={handleSelect}>{label}</ContextMenu.Item>;
};

ResetItem.displayName = 'ResetItem';

const RemoveItem = ({ nodeId, label }: MenuItemProps): ReactElement => {
    const handleSelect = useCallback(() => {
        requestComponentRemove(ComponentPath.fromString(nodeId));
        rebuildComponentsTree();
    }, [nodeId]);

    return <ContextMenu.Item onSelect={handleSelect}>{label}</ContextMenu.Item>;
};

RemoveItem.displayName = 'RemoveItem';

const DuplicateItem = ({ nodeId, label }: MenuItemProps): ReactElement => {
    const handleSelect = useCallback(() => {
        requestComponentDuplicate(ComponentPath.fromString(nodeId));
        rebuildComponentsTree();
    }, [nodeId]);

    return <ContextMenu.Item onSelect={handleSelect}>{label}</ContextMenu.Item>;
};

DuplicateItem.displayName = 'DuplicateItem';

const SaveAsFragmentItem = ({ nodeId, label }: MenuItemProps): ReactElement => {
    const handleSelect = useCallback(() => {
        requestComponentCreateFragment(ComponentPath.fromString(nodeId));
    }, [nodeId]);

    return <ContextMenu.Item onSelect={handleSelect}>{label}</ContextMenu.Item>;
};

SaveAsFragmentItem.displayName = 'SaveAsFragmentItem';

const DetachFragmentItem = ({ nodeId, label, disabled }: MenuItemProps): ReactElement => {
    const handleSelect = useCallback(() => {
        requestComponentDetachFragment(ComponentPath.fromString(nodeId));
    }, [nodeId]);

    return (
        <ContextMenu.Item disabled={disabled} onSelect={handleSelect}>
            {label}
        </ContextMenu.Item>
    );
};

DetachFragmentItem.displayName = 'DetachFragmentItem';

const EditFragmentItem = ({ nodeId, label, disabled }: MenuItemProps): ReactElement | null => {
    const page = $page.get();
    const component = page?.getComponentByPath(ComponentPath.fromString(nodeId)) ?? null;
    const fragmentId = component instanceof FragmentComponent ? component.getFragment() : null;

    const handleSelect = useCallback(() => {
        if (fragmentId) {
            openEditContentTab(fragmentId.toString());
        }
    }, [fragmentId]);

    if (!fragmentId) return null;

    return (
        <ContextMenu.Item disabled={disabled} onSelect={handleSelect}>
            {label}
        </ContextMenu.Item>
    );
};

EditFragmentItem.displayName = 'EditFragmentItem';

//
// * Insert submenu
//

const InsertSubMenu = ({ nodeId, label }: MenuItemProps): ReactElement => {
    const treeState = $componentsTreeState.get();
    const insideLayout = hasLayoutAncestor(treeState, nodeId);

    const { enableTextComponent } = useStore($config, { keys: ['enableTextComponent'] });

    const partLabel = useI18n('field.part');
    const layoutLabel = useI18n('field.layout');
    const textLabel = useI18n('field.text');
    const fragmentLabel = useI18n('field.fragment');

    const handleInsert = useCallback(
        (typeShortName: string) => {
            const currentState = $componentsTreeState.get();
            const treeNode = getNode(currentState, nodeId);
            const isRegion = treeNode?.data?.nodeType === 'region';
            const path = ComponentPath.fromString(nodeId);
            const componentType = ComponentType.byShortName(typeShortName);

            const insertPath = isRegion
                ? new ComponentPath(treeNode?.childIds.length ?? 0, path)
                : new ComponentPath(Number(path.getPath()) + 1, path.getParentPath());

            requestComponentAdd(insertPath, componentType);
            rebuildComponentsTree();

            PageNavigationMediator.get().notify(
                new PageNavigationEvent(PageNavigationEventType.SELECT, new PageNavigationEventData(insertPath)),
            );
            if (getIsMobile()) {
                PageNavigationMediator.get().notify(
                    new PageNavigationEvent(PageNavigationEventType.INSPECT, new PageNavigationEventData(insertPath)),
                );
            }

            const regionId = isRegion ? nodeId : path.getParentPath()?.toString();
            if (regionId != null) {
                expandComponentNode(regionId);
            }
        },
        [nodeId],
    );

    const items = [
        { type: 'part', Icon: Box, label: partLabel, disabled: false },
        { type: 'layout', Icon: Columns2, label: layoutLabel, disabled: insideLayout },
        ...(enableTextComponent ? [{ type: 'text', Icon: PenLine, label: textLabel, disabled: false }] : []),
        { type: 'fragment', Icon: Puzzle, label: fragmentLabel, disabled: false },
    ];

    return (
        <ContextMenu.Sub>
            <ContextMenu.SubTrigger>{label}</ContextMenu.SubTrigger>
            <ContextMenu.Portal>
                <ContextMenu.SubContent className="min-w-48">
                    {items.map(({ type, Icon, label: itemLabel, disabled }) => (
                        <ContextMenu.Item key={type} disabled={disabled} onSelect={() => handleInsert(type)}>
                            <Icon className="size-4 me-2 shrink-0" />
                            {itemLabel}
                        </ContextMenu.Item>
                    ))}
                </ContextMenu.SubContent>
            </ContextMenu.Portal>
        </ContextMenu.Sub>
    );
};

InsertSubMenu.displayName = 'InsertSubMenu';
