import {SortableList, type SortableListItemContext} from '@enonic/lib-admin-ui/form2/components';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {cn} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {type ReactElement, useCallback, useEffect, useState} from 'react';
import {ComponentPath} from '../../../../../../app/page/region/ComponentPath';
import {PageNavigationEvent} from '../../../../../../app/wizard/PageNavigationEvent';
import {PageNavigationEventData} from '../../../../../../app/wizard/PageNavigationEventData';
import {PageNavigationEventType} from '../../../../../../app/wizard/PageNavigationEventType';
import {PageNavigationMediator} from '../../../../../../app/wizard/PageNavigationMediator';
import type {FlatNode} from '../../../../lib/tree-store';
import {getNode} from '../../../../lib/tree-store';
import {inspectItem, requestComponentMove} from '../../../../store/page-editor/commands';
import {$inspectedPath, $pageVersion} from '../../../../store/page-editor/store';
import {$invalidComponentPaths, $validationVisibility} from '../../../../store/wizardValidation.store';
import {PageComponentsContextMenu} from './PageComponentsContextMenu';
import {PageComponentsItem} from './PageComponentsItem';
import {
    $componentsFlatNodes,
    $componentsTreeState,
    collapseComponentNode,
    computeMovedItemPath,
    hasLayoutAncestor,
    rebuildComponentsTree,
    remapExpandedIdsAfterMove,
    toggleComponentExpand,
} from './pageComponents.store';
import type {PageComponentNodeData} from './types';

const PAGE_COMPONENTS_VIEW_NAME = 'PageComponentsView';

// ? Only animate displaced items during an active drag.
// ? After the drop, items snap to their new positions, preventing
// ? dnd-kit from replaying a layout-shift animation when the
// ? tree is rebuilt with changed positional keys.
const animateLayoutChanges = ({isSorting}: {isSorting: boolean}): boolean => isSorting;

export const PageComponentsView = (): ReactElement => {
    const pageVersion = useStore($pageVersion);
    const invalidComponentPaths = useStore($invalidComponentPaths);
    const validationVisibility = useStore($validationVisibility);
    const showErrors = validationVisibility === 'all';
    const [flatNodes, setFlatNodes] = useState(() => [...$componentsFlatNodes.get()]);
    useEffect(() => {
        setFlatNodes([...$componentsFlatNodes.get()]);
        return $componentsFlatNodes.listen((nodes) => setFlatNodes([...nodes]));
    }, []);
    const inspectedPath = useStore($inspectedPath);

    useEffect(() => {
        rebuildComponentsTree();
    }, [pageVersion]);

    const handleMove = useCallback((fromIndex: number, toIndex: number): void => {
        const sourceNode = flatNodes[fromIndex];
        const targetNode = flatNodes[toIndex];
        if (sourceNode?.data == null || targetNode?.data == null) {
            return;
        }

        if (!sourceNode.data.draggable) {
            return;
        }

        const treeState = $componentsTreeState.get();

        const target = resolveTargetPath(sourceNode, targetNode, fromIndex, toIndex);
        if (target == null) {
            return;
        }

        const isLayoutDrag = sourceNode.data.nodeType === 'layout'
            || (sourceNode.data.nodeType === 'fragment' && sourceNode.data.layoutFragment);

        if (isLayoutDrag && hasLayoutAncestor(treeState, target.regionPath)) {
            return;
        }

        const fromPath = ComponentPath.fromString(sourceNode.id);
        const toPath = ComponentPath.fromString(target.componentPath);

        if (fromPath.equals(toPath)) {
            return;
        }

        requestComponentMove(fromPath, toPath);
        remapExpandedIdsAfterMove(sourceNode.id, target.componentPath);
        rebuildComponentsTree();

        const movedPath = ComponentPath.fromString(computeMovedItemPath(sourceNode.id, target.componentPath));
        inspectItem(movedPath);
        PageNavigationMediator.get().notify(
            new PageNavigationEvent(PageNavigationEventType.SELECT, new PageNavigationEventData(movedPath)),
        );
    }, [flatNodes]);

    const handleDragStart = useCallback((index: number): void => {
        const node = flatNodes[index];
        if (node?.isExpanded) {
            collapseComponentNode(node.id);
        }
    }, [flatNodes]);

    const handleSelect = useCallback((nodeId: string): void => {
        const path = ComponentPath.fromString(nodeId);
        inspectItem(path);
        PageNavigationMediator.get().notify(
            new PageNavigationEvent(PageNavigationEventType.SELECT, new PageNavigationEventData(path)),
        );
    }, []);

    const isItemMovable = useCallback((node: FlatNode<PageComponentNodeData>): boolean => {
        return node.data?.draggable ?? false;
    }, []);

    const isDropAllowed = useCallback((fromIndex: number, toIndex: number): boolean => {
        const sourceNode = flatNodes[fromIndex];
        const targetNode = flatNodes[toIndex];
        if (sourceNode?.data == null || targetNode?.data == null) return false;
        if (!sourceNode.data.draggable) return false;

        const target = resolveTargetPath(sourceNode, targetNode, fromIndex, toIndex);
        if (target == null) return false;

        const isLayoutDrag = sourceNode.data.nodeType === 'layout'
            || (sourceNode.data.nodeType === 'fragment' && sourceNode.data.layoutFragment);

        if (isLayoutDrag && hasLayoutAncestor($componentsTreeState.get(), target.regionPath)) return false;

        return true;
    }, [flatNodes]);

    const itemClassName = useCallback((
        context: SortableListItemContext<FlatNode<PageComponentNodeData>>,
    ): string => {
        const isSelected = context.item.id === inspectedPath;
        return cn(
            'w-full px-2.5 select-none cursor-pointer',
            isSelected ? 'bg-surface-selected text-alt [&>button]:text-alt' : 'hover:bg-surface-neutral-hover',
        );
    }, [inspectedPath]);

    const renderItem = useCallback((
        context: SortableListItemContext<FlatNode<PageComponentNodeData>>,
    ): ReactElement | null => {
        const isSelected = context.item.id === inspectedPath;
        const isInvalid = showErrors && invalidComponentPaths.has(context.item.id);
        return (
            <PageComponentsContextMenu node={context.item}>
                <PageComponentsItem
                    context={context}
                    selected={isSelected}
                    invalid={isInvalid}
                    onToggle={toggleComponentExpand}
                    onSelect={handleSelect}
                />
            </PageComponentsContextMenu>
        );
    }, [handleSelect, inspectedPath, showErrors, invalidComponentPaths]);

    return (
        <div data-component={PAGE_COMPONENTS_VIEW_NAME} className="flex flex-col gap-1 py-2">
            <h3 className="text-base font-semibold">{i18n('field.components')}</h3>
            <SortableList
                items={flatNodes}
                keyExtractor={(node) => node.id}
                onDragStart={handleDragStart}
                onMove={handleMove}
                enabled={flatNodes.length > 1}
                fullRowDraggable
                isItemMovable={isItemMovable}
                isDropAllowed={isDropAllowed}
                animateLayoutChanges={animateLayoutChanges}
                itemClassName={itemClassName}
                renderItem={renderItem}
                className="flex flex-col gap-1.5"
            />
        </div>
    );
};

PageComponentsView.displayName = PAGE_COMPONENTS_VIEW_NAME;

//
// * Internal
//

function resolveTargetPath(
    sourceNode: FlatNode<PageComponentNodeData>,
    targetNode: FlatNode<PageComponentNodeData>,
    fromIndex: number,
    toIndex: number,
): {regionPath: string; componentPath: string} | null {
    const targetData = targetNode.data;
    if (targetData == null) {
        return null;
    }

    const treeState = $componentsTreeState.get();

    if (targetData.nodeType === 'region') {
        // Dragging up past a region header → place at end of the previous sibling region
        if (fromIndex > toIndex && targetNode.parentId != null) {
            const parentNode = getNode(treeState, targetNode.parentId);
            if (parentNode != null) {
                const regionIdx = parentNode.childIds.indexOf(targetNode.id);
                if (regionIdx > 0) {
                    const prevRegionId = parentNode.childIds[regionIdx - 1];
                    const prevRegion = getNode(treeState, prevRegionId);
                    const childCount = prevRegion?.childIds.length ?? 0;
                    return {
                        regionPath: prevRegionId,
                        componentPath: `${prevRegionId}/${childCount}`,
                    };
                }
                return null;
            }
        }

        const regionNode = getNode(treeState, targetNode.id);
        const childCount = regionNode?.childIds.length ?? 0;
        return {
            regionPath: targetNode.id,
            componentPath: `${targetNode.id}/${childCount}`,
        };
    }

    if (targetData.nodeType === 'page') {
        return null;
    }

    const treeNode = getNode(treeState, targetNode.id);
    if (treeNode?.parentId == null) {
        return null;
    }

    const parentNode = getNode(treeState, treeNode.parentId);
    if (parentNode?.data?.nodeType !== 'region') {
        return null;
    }

    const siblingIndex = parentNode.childIds.indexOf(targetNode.id);
    if (siblingIndex === -1) {
        return null;
    }

    // ! When dragging down within the same region, the backend removes the
    // ! source first (shifting indices down), then inserts at the target index.
    // ! Using siblingIndex + 1 would overshoot by one in that case.
    const sourceTreeNode = getNode(treeState, sourceNode.id);
    const sameRegion = sourceTreeNode?.parentId === parentNode.id;
    const index = fromIndex < toIndex
        ? (sameRegion ? siblingIndex : siblingIndex + 1)
        : siblingIndex;

    return {
        regionPath: parentNode.id,
        componentPath: `${parentNode.id}/${index}`,
    };
}
