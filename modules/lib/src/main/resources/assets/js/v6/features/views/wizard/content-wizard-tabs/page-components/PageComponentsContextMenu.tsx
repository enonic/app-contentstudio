import {ContextMenu} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {Box, Columns2, PenLine, Puzzle} from 'lucide-react';
import {type ReactElement, type ReactNode, useCallback, useState} from 'react';
import {SaveAsTemplateAction} from '../../../../../../app/wizard/action/SaveAsTemplateAction';
import {ComponentPath} from '../../../../../../app/page/region/ComponentPath';
import {ComponentType} from '../../../../../../app/page/region/ComponentType';
import {PageNavigationEvent} from '../../../../../../app/wizard/PageNavigationEvent';
import {PageNavigationEventData} from '../../../../../../app/wizard/PageNavigationEventData';
import {PageNavigationEventType} from '../../../../../../app/wizard/PageNavigationEventType';
import {PageNavigationMediator} from '../../../../../../app/wizard/PageNavigationMediator';
import type {FlatNode} from '../../../../lib/tree-store';
import {getNode} from '../../../../lib/tree-store';
import {useI18n} from '../../../../hooks/useI18n';
import {ConfirmationDialog} from '../../../../shared/dialogs/ConfirmationDialog';
import {
    executePageReset,
    inspectItem,
    requestComponentAdd,
    requestComponentCreateFragment,
    requestComponentDuplicate,
    requestComponentRemove,
    requestComponentReset,
} from '../../../../store/page-editor/commands';
import {$contentContext, $isFragment} from '../../../../store/page-editor/store';
import {$componentsTreeState, expandComponentNode, hasLayoutAncestor, rebuildComponentsTree} from './pageComponents.store';
import type {PageComponentNodeData} from './types';

//
// * Types
//

export type PageComponentsContextMenuProps = {
    node: FlatNode<PageComponentNodeData>;
    children: ReactNode;
};

//
// * Component
//

const PAGE_COMPONENTS_CONTEXT_MENU_NAME = 'PageComponentsContextMenu';
const ROOT_NODE_ID = '/';

export const PageComponentsContextMenu = ({node, children}: PageComponentsContextMenuProps): ReactElement => {
    const data = node.data;
    const isFragment = useStore($isFragment);
    const contentContext = useStore($contentContext);
    const [confirmResetOpen, setConfirmResetOpen] = useState(false);

    const selectParentLabel = useI18n('action.component.select.parent');
    const insertLabel = useI18n('widget.components.insert');
    const inspectLabel = useI18n('action.component.inspect');
    const resetLabel = useI18n('action.component.reset');
    const removeLabel = useI18n('action.component.remove');
    const duplicateLabel = useI18n('action.component.duplicate');
    const saveAsFragmentLabel = useI18n('action.component.create.fragment');
    const saveAsTemplateLabel = useI18n('action.saveAsTemplate');
    const resetConfirmation = useI18n('dialog.page.reset.confirmation');

    if (data == null) {
        return <>{children}</>;
    }

    const isPageRoot = data.nodeType === 'page' || node.id === ROOT_NODE_ID;

    if (isPageRoot) {
        const handleReset = isFragment
            ? () => requestComponentReset(ComponentPath.fromString(ROOT_NODE_ID))
            : () => setConfirmResetOpen(true);

        return (
            <>
                <ContextMenu data-component={PAGE_COMPONENTS_CONTEXT_MENU_NAME}>
                    <ContextMenu.Trigger className="flex-1 min-w-0">{children}</ContextMenu.Trigger>
                    <ContextMenu.Portal>
                        <ContextMenu.Content className="min-w-48">
                            <InspectItem nodeId={ROOT_NODE_ID} label={inspectLabel} />
                            <PageResetItem label={resetLabel} onSelect={handleReset} />
                            {!isFragment && !contentContext?.isPageTemplate && (
                                <SaveAsTemplateItem label={saveAsTemplateLabel} />
                            )}
                        </ContextMenu.Content>
                    </ContextMenu.Portal>
                </ContextMenu>

                {!isFragment && (
                    <ConfirmationDialog.Root open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
                        <ConfirmationDialog.Portal>
                            <ConfirmationDialog.Overlay />
                            <ConfirmationDialog.Content>
                                <ConfirmationDialog.Body>{resetConfirmation}</ConfirmationDialog.Body>
                                <ConfirmationDialog.Footer
                                    intent="danger"
                                    onConfirm={() => {
                                        executePageReset();
                                        setConfirmResetOpen(false);
                                    }}
                                    onCancel={() => setConfirmResetOpen(false)}
                                />
                            </ConfirmationDialog.Content>
                        </ConfirmationDialog.Portal>
                    </ConfirmationDialog.Root>
                )}
            </>
        );
    }

    const isRegion = data.nodeType === 'region';
    const isComponent = !isRegion;
    const isFragmentComponent = data.nodeType === 'fragment';

    return (
        <ContextMenu data-component={PAGE_COMPONENTS_CONTEXT_MENU_NAME}>
            <ContextMenu.Trigger className="flex-1 min-w-0">{children}</ContextMenu.Trigger>
            <ContextMenu.Portal>
                <ContextMenu.Content className="min-w-48">
                    <SelectParentItem nodeId={node.id} label={selectParentLabel} />
                    <InsertSubMenu nodeId={node.id} label={insertLabel} />
                    {isComponent && (
                        <>
                            <InspectItem nodeId={node.id} label={inspectLabel} />
                            <ResetItem nodeId={node.id} label={resetLabel} />
                            <RemoveItem nodeId={node.id} label={removeLabel} />
                            <DuplicateItem nodeId={node.id} label={duplicateLabel} />
                            {!isFragmentComponent && <SaveAsFragmentItem nodeId={node.id} label={saveAsFragmentLabel} />}
                        </>
                    )}
                </ContextMenu.Content>
            </ContextMenu.Portal>
        </ContextMenu>
    );
};

PageComponentsContextMenu.displayName = PAGE_COMPONENTS_CONTEXT_MENU_NAME;

//
// * Page root menu items
//

type PageResetItemProps = {
    label: string;
    onSelect: () => void;
};

const PageResetItem = ({label, onSelect}: PageResetItemProps): ReactElement => {
    return (
        <ContextMenu.Item onSelect={onSelect}>
            {label}
        </ContextMenu.Item>
    );
};

PageResetItem.displayName = 'PageResetItem';

const SaveAsTemplateItem = ({label}: {label: string}): ReactElement => {
    const handleSelect = useCallback(() => {
        SaveAsTemplateAction.get().execute();
    }, []);

    return (
        <ContextMenu.Item onSelect={handleSelect}>
            {label}
        </ContextMenu.Item>
    );
};

SaveAsTemplateItem.displayName = 'SaveAsTemplateItem';

//
// * Component menu items
//

type MenuItemProps = {
    nodeId: string;
    label: string;
};

const SelectParentItem = ({nodeId, label}: MenuItemProps): ReactElement | null => {
    const treeState = $componentsTreeState.get();
    const treeNode = getNode(treeState, nodeId);

    const handleSelect = useCallback(() => {
        if (treeNode?.parentId != null) {
            const path = ComponentPath.fromString(treeNode.parentId);
            inspectItem(path);
            PageNavigationMediator.get().notify(
                new PageNavigationEvent(PageNavigationEventType.SELECT, new PageNavigationEventData(path)),
            );
        }
    }, [treeNode]);

    if (treeNode?.parentId == null) {
        return null;
    }

    return (
        <ContextMenu.Item onSelect={handleSelect}>
            {label}
        </ContextMenu.Item>
    );
};

SelectParentItem.displayName = 'SelectParentItem';

const InspectItem = ({nodeId, label}: MenuItemProps): ReactElement => {
    const handleSelect = useCallback(() => {
        const path = ComponentPath.fromString(nodeId);
        inspectItem(path);
        PageNavigationMediator.get().notify(
            new PageNavigationEvent(PageNavigationEventType.SELECT, new PageNavigationEventData(path)),
        );
    }, [nodeId]);

    return (
        <ContextMenu.Item onSelect={handleSelect}>
            {label}
        </ContextMenu.Item>
    );
};

InspectItem.displayName = 'InspectItem';

const ResetItem = ({nodeId, label}: MenuItemProps): ReactElement => {
    const handleSelect = useCallback(() => {
        requestComponentReset(ComponentPath.fromString(nodeId));
    }, [nodeId]);

    return (
        <ContextMenu.Item onSelect={handleSelect}>
            {label}
        </ContextMenu.Item>
    );
};

ResetItem.displayName = 'ResetItem';

const RemoveItem = ({nodeId, label}: MenuItemProps): ReactElement => {
    const handleSelect = useCallback(() => {
        requestComponentRemove(ComponentPath.fromString(nodeId));
        rebuildComponentsTree();
    }, [nodeId]);

    return (
        <ContextMenu.Item onSelect={handleSelect}>
            {label}
        </ContextMenu.Item>
    );
};

RemoveItem.displayName = 'RemoveItem';

const DuplicateItem = ({nodeId, label}: MenuItemProps): ReactElement => {
    const handleSelect = useCallback(() => {
        requestComponentDuplicate(ComponentPath.fromString(nodeId));
        rebuildComponentsTree();
    }, [nodeId]);

    return (
        <ContextMenu.Item onSelect={handleSelect}>
            {label}
        </ContextMenu.Item>
    );
};

DuplicateItem.displayName = 'DuplicateItem';

const SaveAsFragmentItem = ({nodeId, label}: MenuItemProps): ReactElement => {
    const handleSelect = useCallback(() => {
        requestComponentCreateFragment(ComponentPath.fromString(nodeId));
    }, [nodeId]);

    return (
        <ContextMenu.Item onSelect={handleSelect}>
            {label}
        </ContextMenu.Item>
    );
};

SaveAsFragmentItem.displayName = 'SaveAsFragmentItem';

//
// * Insert submenu
//

const InsertSubMenu = ({nodeId, label}: MenuItemProps): ReactElement => {
    const treeState = $componentsTreeState.get();
    const insideLayout = hasLayoutAncestor(treeState, nodeId);

    const partLabel = useI18n('field.part');
    const layoutLabel = useI18n('field.layout');
    const textLabel = useI18n('field.text');
    const fragmentLabel = useI18n('field.fragment');

    const handleInsert = useCallback((typeShortName: string) => {
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

        inspectItem(insertPath);
        PageNavigationMediator.get().notify(
            new PageNavigationEvent(PageNavigationEventType.SELECT, new PageNavigationEventData(insertPath)),
        );

        const regionId = isRegion ? nodeId : path.getParentPath()?.toString();
        if (regionId != null) {
            expandComponentNode(regionId);
        }
    }, [nodeId]);

    const items = [
        {type: 'part', Icon: Box, label: partLabel, disabled: false},
        {type: 'layout', Icon: Columns2, label: layoutLabel, disabled: insideLayout},
        {type: 'text', Icon: PenLine, label: textLabel, disabled: false},
        {type: 'fragment', Icon: Puzzle, label: fragmentLabel, disabled: false},
    ];

    return (
        <ContextMenu.Sub>
            <ContextMenu.SubTrigger>{label}</ContextMenu.SubTrigger>
            <ContextMenu.Portal>
                <ContextMenu.SubContent className="min-w-48">
                    {items.map(({type, Icon, label: itemLabel, disabled}) => (
                        <ContextMenu.Item
                            key={type}
                            disabled={disabled}
                            onSelect={() => handleInsert(type)}
                        >
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
