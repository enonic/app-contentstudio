import {
    type DropNode,
    type DropProjection,
    projectTreeDrop,
    type SortableDragInfo,
    type SortableDropHint,
    SortableList,
    type SortableListItemContext,
} from '@enonic/lib-admin-ui/form2/components';
import { cn } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ComponentPath } from '../../../../../../app/page/region/ComponentPath';
import { PageNavigationEvent } from '../../../../../../app/wizard/PageNavigationEvent';
import { PageNavigationEventData } from '../../../../../../app/wizard/PageNavigationEventData';
import { PageNavigationEventType } from '../../../../../../app/wizard/PageNavigationEventType';
import { PageNavigationMediator } from '../../../../../../app/wizard/PageNavigationMediator';
import { useI18n } from '../../../../../shared/lib/hooks/useI18n';
import { useSelectedPageOption } from '../../../../../widgets/inspectors/lib/usePageOptions';
import type { FlatNode } from '../../../../../shared/lib/tree-store';
import { inspectItem, requestComponentMove } from '../../../../../widgets/inspectors/model/page-editor';
import {
    $fragmentOptions,
    $isFragmentInspectionLoading,
} from '../../../../../widgets/inspectors/model/fragment-inspection.store';
import {
    $isComponentInspectionLoading,
    $layoutDescriptorOptions,
    $partDescriptorOptions,
    isComponentReferenceMissing,
} from '../../../../../widgets/inspectors/model/component-inspection.store';
import { $inspectedPath, $page, $pageVersion } from '../../../../../widgets/inspectors/model/page-editor/store';
import { $wizardReadOnly } from '../../../model/wizardContent.store';
import { $invalidComponentPaths, $validationVisibility } from '../../../model/wizardValidation.store';
import { EditLockOverlay } from '../../../../../shared/ui/EditLockOverlay';
import { PageComponentsContextMenu } from './PageComponentsContextMenu';
import { calcSpacerWidth, PageComponentsItem, type PageComponentPageMetadata } from './PageComponentsItem';
import {
    $componentsFlatNodes,
    $componentsTreeState,
    collapseComponentNode,
    computeMovedItemPath,
    expandPathToComponent,
    hasLayoutAncestor,
    rebuildComponentsTree,
    remapExpandedIdsAfterMove,
    toggleComponentExpand,
} from './pageComponents.store';
import type { PageComponentNodeData } from './types';

const PAGE_COMPONENTS_VIEW_NAME = 'PageComponentsView';

// ? Only animate displaced items during an active drag.
// ? After the drop, items snap to their new positions, preventing
// ? dnd-kit from replaying a layout-shift animation when the
// ? tree is rebuilt with changed positional keys.
const animateLayoutChanges = ({ isSorting }: { isSorting: boolean }): boolean => isSorting;

export type PageComponentsViewProps = {
    showTitle?: boolean;
};

export const PageComponentsView = ({ showTitle = false }: PageComponentsViewProps = {}): ReactElement => {
    const containerRef = useRef<HTMLDivElement>(null);
    const componentsLabel = useI18n('field.components');
    const pageVersion = useStore($pageVersion);
    const page = useStore($page);
    const fragmentOptions = useStore($fragmentOptions);
    const isFragmentLoading = useStore($isFragmentInspectionLoading);
    const partDescriptorOptions = useStore($partDescriptorOptions);
    const layoutDescriptorOptions = useStore($layoutDescriptorOptions);
    const isComponentLoading = useStore($isComponentInspectionLoading);
    const invalidComponentPaths = useStore($invalidComponentPaths);
    const validationVisibility = useStore($validationVisibility);
    const readOnly = useStore($wizardReadOnly);
    const showErrors = validationVisibility === 'all';
    const inspectedPath = useStore($inspectedPath);
    const descriptors = useMemo(
        () => [...partDescriptorOptions, ...layoutDescriptorOptions],
        [partDescriptorOptions, layoutDescriptorOptions],
    );
    const referenceLoading = isFragmentLoading || isComponentLoading;
    const [flatNodes, setFlatNodes] = useState(() => [...$componentsFlatNodes.get()]);
    const selectedPageOption = useSelectedPageOption();
    const pageMetadata = useMemo<PageComponentPageMetadata | undefined>(() => {
        if (selectedPageOption == null) {
            return undefined;
        }

        return {
            displayName: selectedPageOption.label,
            Icon: selectedPageOption.icon,
        };
    }, [selectedPageOption]);

    useEffect(() => {
        setFlatNodes([...$componentsFlatNodes.get()]);
        return $componentsFlatNodes.listen((nodes) => setFlatNodes([...nodes]));
    }, []);

    useEffect(() => {
        rebuildComponentsTree();
    }, [pageVersion]);

    useEffect(() => {
        if (inspectedPath == null) return;
        expandPathToComponent(inspectedPath);
        const handle = requestAnimationFrame(() => {
            const el = containerRef.current?.querySelector<HTMLElement>(
                `[data-node-id="${CSS.escape(inspectedPath)}"]`,
            );
            el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        });
        return () => cancelAnimationFrame(handle);
    }, [inspectedPath]);

    const resolveProjection = useCallback(
        (info: SortableDragInfo): DropProjection | null => {
            const sourceNode = flatNodes[info.activeIndex];
            const overNode = flatNodes[info.overIndex];
            if (sourceNode?.data == null || overNode == null || !sourceNode.data.draggable) {
                return null;
            }

            const treeState = $componentsTreeState.get();
            const isLayoutDrag =
                sourceNode.data.nodeType === 'layout' ||
                (sourceNode.data.nodeType === 'fragment' && sourceNode.data.layoutFragment);

            return projectTreeDrop({
                nodes: toDropNodes(flatNodes),
                activeId: sourceNode.id,
                overId: overNode.id,
                side: info.side,
                direction: info.direction,
                isContainerAllowed: (containerId) => !(isLayoutDrag && hasLayoutAncestor(treeState, containerId)),
            });
        },
        [flatNodes],
    );

    const resolveDrop = useCallback(
        (info: SortableDragInfo): SortableDropHint | null => {
            const projection = resolveProjection(info);
            if (projection == null) {
                return null;
            }
            return { indent: calcSpacerWidth(projection.depth), allowed: projection.allowed };
        },
        [resolveProjection],
    );

    const handleMove = useCallback(
        (_fromIndex: number, _toIndex: number, info?: SortableDragInfo): void => {
            if (info == null) {
                return;
            }
            const sourceNode = flatNodes[info.activeIndex];
            if (sourceNode?.data == null) {
                return;
            }

            const projection = resolveProjection(info);
            if (projection == null || !projection.allowed) {
                return;
            }

            const targetComponentPath = `${projection.containerId}/${projection.index}`;
            const fromPath = ComponentPath.fromString(sourceNode.id);
            const toPath = ComponentPath.fromString(targetComponentPath);

            if (fromPath.equals(toPath)) {
                return;
            }

            requestComponentMove(fromPath, toPath);
            remapExpandedIdsAfterMove(sourceNode.id, targetComponentPath);
            rebuildComponentsTree();

            const movedPath = ComponentPath.fromString(computeMovedItemPath(sourceNode.id, targetComponentPath));
            inspectItem(movedPath);
            PageNavigationMediator.get().notify(
                new PageNavigationEvent(PageNavigationEventType.SELECT, new PageNavigationEventData(movedPath)),
            );
        },
        [flatNodes, resolveProjection],
    );

    const handleDragStart = useCallback(
        (index: number): void => {
            const node = flatNodes[index];
            if (node?.isExpanded) {
                collapseComponentNode(node.id);
            }
        },
        [flatNodes],
    );

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

    const itemClassName = useCallback(
        (context: SortableListItemContext<FlatNode<PageComponentNodeData>>): string => {
            const isSelected = context.item.id === inspectedPath;
            return cn(
                'w-full px-2.5 select-none cursor-pointer',
                isSelected ? 'bg-surface-selected text-alt [&>button]:text-alt' : 'hover:bg-surface-neutral-hover',
            );
        },
        [inspectedPath],
    );

    const renderItem = useCallback(
        (context: SortableListItemContext<FlatNode<PageComponentNodeData>>): ReactElement | null => {
            const isSelected = context.item.id === inspectedPath;
            const referenceMissing = isComponentReferenceMissing(
                context.item.id,
                page,
                fragmentOptions,
                descriptors,
                referenceLoading,
            );
            const isInvalid = showErrors && (invalidComponentPaths.has(context.item.id) || referenceMissing);

            return (
                <PageComponentsContextMenu node={context.item}>
                    <PageComponentsItem
                        context={context}
                        pageMetadata={pageMetadata}
                        selected={isSelected}
                        invalid={isInvalid}
                        onToggle={toggleComponentExpand}
                        onSelect={handleSelect}
                    />
                </PageComponentsContextMenu>
            );
        },
        [
            handleSelect,
            inspectedPath,
            pageMetadata,
            showErrors,
            invalidComponentPaths,
            page,
            fragmentOptions,
            descriptors,
            referenceLoading,
        ],
    );

    return (
        <EditLockOverlay locked={readOnly}>
            <div ref={containerRef} data-component={PAGE_COMPONENTS_VIEW_NAME} className="flex flex-col gap-1 py-2">
                {showTitle && <h3 className="text-base font-semibold">{componentsLabel}</h3>}
                <SortableList
                    items={flatNodes}
                    keyExtractor={(node) => node.id}
                    onDragStart={handleDragStart}
                    onMove={handleMove}
                    enabled={flatNodes.length > 1}
                    fullRowDraggable
                    isItemMovable={isItemMovable}
                    resolveDrop={resolveDrop}
                    animateLayoutChanges={animateLayoutChanges}
                    itemClassName={itemClassName}
                    renderItem={renderItem}
                    className="flex flex-col gap-1.5"
                />
            </div>
        </EditLockOverlay>
    );
};

PageComponentsView.displayName = PAGE_COMPONENTS_VIEW_NAME;

//
// * Internal
//

// Projects the flattened tree onto the drop model: regions are containers, every
// other node (page, parts, layouts, text, fragments) is a draggable item.
function toDropNodes(flatNodes: FlatNode<PageComponentNodeData>[]): DropNode[] {
    const dropNodes: DropNode[] = [];
    for (const node of flatNodes) {
        if (node.data == null) continue;
        dropNodes.push({
            id: node.id,
            parentId: node.parentId,
            depth: node.level,
            kind: node.data.nodeType === 'region' ? 'container' : 'item',
        });
    }
    return dropNodes;
}
