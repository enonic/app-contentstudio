import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {atom, computed} from 'nanostores';
import type {Page} from '../../../../../../app/page/Page';
import type {Component} from '../../../../../../app/page/region/Component';
import {DescriptorBasedComponent} from '../../../../../../app/page/region/DescriptorBasedComponent';
import {LayoutComponent} from '../../../../../../app/page/region/LayoutComponent';
import type {Region} from '../../../../../../app/page/region/Region';
import {TextComponent} from '../../../../../../app/page/region/TextComponent';
import {
    type CreateNodeOptions,
    type TreeNode,
    type TreeState,
    collapse,
    createEmptyState,
    expand,
    expandToNode,
    flattenTree,
    getAncestorIds,
    getNode,
    setNodes,
    setRootIds,
    toggle,
} from '../../../../lib/tree-store';
import {$page, $pageVersion} from '../../../../store/page-editor/store';
import type {PageComponentNodeData, PageComponentNodeType} from './types';

//
// * State
//

export const $componentsTreeState = atom<TreeState<PageComponentNodeData>>(createEmptyState());

//
// * Computed
//

export const $componentsFlatNodes = computed($componentsTreeState, flattenTree);

//
// * Actions
//

let lastRebuildVersion = -1;
let lastLayoutsByPath = new Map<string, LayoutComponent>();

export function rebuildComponentsTree(preserveExpanded = true): void {
    const currentVersion = $pageVersion.get();
    if (currentVersion === lastRebuildVersion) return;
    lastRebuildVersion = currentVersion;

    const page = $page.get();
    const currentState = $componentsTreeState.get();
    const isRebuild = preserveExpanded && currentState.nodes.size > 0;

    const layoutsByPath = collectLayouts(page);
    const layoutDiff = isRebuild
        ? diffLayouts(lastLayoutsByPath, layoutsByPath)
        : EMPTY_LAYOUT_DIFF;

    lastLayoutsByPath = layoutsByPath;

    const expandedIds = preserveExpanded
        ? remapExpandedAfterDiff(currentState.expandedIds, layoutDiff)
        : undefined;

    const newState = buildTreeFromPage(page, expandedIds, isRebuild, layoutDiff.added);
    $componentsTreeState.set(newState);
}

export function toggleComponentExpand(id: string): void {
    $componentsTreeState.set(toggle($componentsTreeState.get(), id));
}

export function expandComponentNode(id: string): void {
    $componentsTreeState.set(expand($componentsTreeState.get(), id));
}

export function collapseComponentNode(id: string): void {
    $componentsTreeState.set(collapse($componentsTreeState.get(), id));
}

export function expandPathToComponent(id: string): void {
    $componentsTreeState.set(expandToNode($componentsTreeState.get(), id));
}

export function computeMovedItemPath(fromPath: string, toPath: string): string {
    const sourceRegion = parentOfPath(fromPath);
    const sourceIndex = lastPathIndex(fromPath);
    const targetRegion = parentOfPath(toPath);
    const targetIndex = lastPathIndex(toPath);

    if (sourceRegion == null || targetRegion == null) return toPath;

    const sameRegion = sourceRegion === targetRegion;

    if (sameRegion) {
        return `${sourceRegion}/${targetIndex}`;
    }

    const adjustedTargetRegion = adjustChildIndex(targetRegion, sourceRegion, (idx) =>
        idx > sourceIndex ? idx - 1 : idx,
    );
    return `${adjustedTargetRegion}/${targetIndex}`;
}

export function remapExpandedIdsAfterMove(fromPath: string, toPath: string): void {
    const state = $componentsTreeState.get();
    const remapped = remapExpandedIds(state.expandedIds, fromPath, toPath);

    // Expand the target region so the dropped item is visible
    const targetRegion = parentOfPath(toPath);
    if (targetRegion != null) {
        const sourceRegion = parentOfPath(fromPath);
        const sameRegion = sourceRegion === targetRegion;
        const adjustedRegion = sameRegion
            ? targetRegion
            : adjustChildIndex(targetRegion, sourceRegion ?? '', (idx) =>
                idx > lastPathIndex(fromPath) ? idx - 1 : idx,
            );
        remapped.add(adjustedRegion);
    }

    $componentsTreeState.set({...state, expandedIds: remapped});
}

//
// * Selectors
//

export function hasLayoutAncestor(treeState: TreeState<PageComponentNodeData>, nodeId: string): boolean {
    const ancestors = getAncestorIds(treeState, nodeId);
    return ancestors.some((ancestorId) => {
        const node = getNode(treeState, ancestorId);
        return node?.data?.nodeType === 'layout';
    });
}

//
// * Internal
//

const PAGE_ROOT_ID = '/';

function getComponentNodeType(component: Component): PageComponentNodeType {
    return component.getType().getShortName() as PageComponentNodeType;
}

function buildTreeFromPage(
    page: Page | null,
    preserveExpandedIds: Set<string> | undefined,
    isRebuild: boolean,
    newLayoutPaths: Set<string>,
): TreeState<PageComponentNodeData> {
    if (page == null) {
        return createEmptyState();
    }

    const nodes: CreateNodeOptions<PageComponentNodeData>[] = [];

    if (page.isFragment()) {
        buildFragmentTree(page, nodes);
    } else {
        buildPageTree(page, nodes);
    }

    let state = createEmptyState<PageComponentNodeData>();
    state = setNodes(state, nodes);
    state = setRootIds(state, [PAGE_ROOT_ID]);

    const expandedIds = new Set<string>(isRebuild ? newLayoutPaths : undefined);

    if (isRebuild) {
        if (preserveExpandedIds != null) {
            for (const id of preserveExpandedIds) {
                if (state.nodes.has(id)) {
                    expandedIds.add(id);
                }
            }
        }
    } else {
        for (const [id, node] of state.nodes) {
            if (isDefaultCollapsed(node)) continue;
            if (node.hasChildren || node.childIds.length > 0) {
                expandedIds.add(id);
            }
        }
    }

    return {...state, expandedIds};
}

function isDefaultCollapsed(node: TreeNode<PageComponentNodeData>): boolean {
    const type = node.data?.nodeType;
    return type === 'region' || (type === 'layout' && node.parentId !== null);
}

function collectLayouts(page: Page | null): Map<string, LayoutComponent> {
    const layouts = new Map<string, LayoutComponent>();
    if (page == null) return layouts;

    let rootRegions: Region[];
    if (page.isFragment()) {
        const fragment = page.getFragment();
        if (!(fragment instanceof LayoutComponent)) return layouts;
        layouts.set(PAGE_ROOT_ID, fragment);
        rootRegions = fragment.getRegions()?.getRegions() ?? [];
    } else {
        rootRegions = page.getRegions()?.getRegions() ?? [];
    }

    for (const region of rootRegions) {
        collectLayoutsFromRegion(region, PAGE_ROOT_ID, layouts);
    }
    return layouts;
}

function collectLayoutsFromRegion(
    region: Region,
    parentPath: string,
    layouts: Map<string, LayoutComponent>,
): void {
    const regionPath = buildRegionPath(parentPath, region.getName());
    region.getComponents().forEach((component, index) => {
        if (!(component instanceof LayoutComponent)) return;
        const componentPath = buildComponentPath(regionPath, index);
        layouts.set(componentPath, component);
        for (const inner of component.getRegions()?.getRegions() ?? []) {
            collectLayoutsFromRegion(inner, componentPath, layouts);
        }
    });
}

type LayoutDiff = {
    added: Set<string>;
    pathRemap: Map<string, string>;
    removed: Set<string>;
};

const EMPTY_LAYOUT_DIFF: LayoutDiff = {
    added: new Set(),
    pathRemap: new Map(),
    removed: new Set(),
};

function diffLayouts(
    previousByPath: Map<string, LayoutComponent>,
    currentByPath: Map<string, LayoutComponent>,
): LayoutDiff {
    const added = new Set<string>();
    const pathRemap = new Map<string, string>();
    const removed = new Set<string>();

    const previousPathByRef = new Map<LayoutComponent, string>();
    for (const [path, ref] of previousByPath) {
        previousPathByRef.set(ref, path);
    }

    const currentRefs = new Set<LayoutComponent>();
    for (const [newPath, ref] of currentByPath) {
        currentRefs.add(ref);
        const oldPath = previousPathByRef.get(ref);
        if (oldPath == null) {
            added.add(newPath);
        } else if (oldPath !== newPath) {
            pathRemap.set(oldPath, newPath);
        }
    }

    for (const [oldPath, ref] of previousByPath) {
        if (!currentRefs.has(ref)) {
            removed.add(oldPath);
        }
    }

    return {added, pathRemap, removed};
}

function remapExpandedAfterDiff(expandedIds: Set<string>, diff: LayoutDiff): Set<string> {
    if (diff.pathRemap.size === 0 && diff.removed.size === 0) {
        return expandedIds;
    }

    // Match longest paths first so descendants of nested shifts remap correctly.
    const remap = [...diff.pathRemap].sort(([a], [b]) => b.length - a.length);
    const removed = [...diff.removed].sort((a, b) => b.length - a.length);

    const result = new Set<string>();
    for (const id of expandedIds) {
        if (matchesAny(id, removed)) continue;
        result.add(applyPathRemap(id, remap));
    }
    return result;
}

function matchesAny(id: string, paths: string[]): boolean {
    for (const path of paths) {
        if (id === path || id.startsWith(path + '/')) return true;
    }
    return false;
}

function applyPathRemap(id: string, remap: [string, string][]): string {
    for (const [oldPath, newPath] of remap) {
        if (id === oldPath) return newPath;
        if (id.startsWith(oldPath + '/')) return newPath + id.substring(oldPath.length);
    }
    return id;
}

function buildPageTree(
    page: Page,
    nodes: CreateNodeOptions<PageComponentNodeData>[],
): void {
    const regions = page.getRegions()?.getRegions() ?? [];
    const regionChildIds = regions.map((region) => buildRegionPath(PAGE_ROOT_ID, region.getName()));

    nodes.push({
        id: PAGE_ROOT_ID,
        data: {
            displayName: 'Page',
            nodeType: 'page',
            draggable: false,
            layoutFragment: false,
            hasDescriptor: page.hasController(),
        },
        parentId: null,
        hasChildren: regionChildIds.length > 0,
        childIds: regionChildIds,
    });

    for (const region of regions) {
        buildRegionNodes(region, PAGE_ROOT_ID, nodes);
    }
}

function buildFragmentTree(
    page: Page,
    nodes: CreateNodeOptions<PageComponentNodeData>[],
): void {
    const fragment = page.getFragment();
    const isLayout = fragment instanceof LayoutComponent;
    const regions = isLayout ? (fragment.getRegions()?.getRegions() ?? []) : [];
    const childIds = regions.map((r) => buildRegionPath(PAGE_ROOT_ID, r.getName()));
    const fragmentHasDescriptor = fragment instanceof DescriptorBasedComponent && fragment.hasDescriptor();

    nodes.push({
        id: PAGE_ROOT_ID,
        data: {
            displayName: fragment.getName()?.toString() ?? 'Fragment',
            nodeType: getComponentNodeType(fragment),
            draggable: false,
            layoutFragment: false,
            hasDescriptor: fragmentHasDescriptor,
        },
        parentId: null,
        hasChildren: childIds.length > 0,
        childIds,
    });

    for (const region of regions) {
        buildRegionNodes(region, PAGE_ROOT_ID, nodes);
    }
}

function buildRegionNodes(
    region: Region,
    parentPath: string,
    nodes: CreateNodeOptions<PageComponentNodeData>[],
): void {
    const regionId = buildRegionPath(parentPath, region.getName());
    const components = region.getComponents();
    const componentChildIds = components.map((_, index) => buildComponentPath(regionId, index));

    nodes.push({
        id: regionId,
        data: {
            displayName: region.getName(),
            nodeType: 'region',
            draggable: false,
            layoutFragment: false,
            hasDescriptor: false,
        },
        parentId: parentPath,
        hasChildren: componentChildIds.length > 0,
        childIds: componentChildIds,
    });

    components.forEach((component, index) => {
        buildComponentNodes(component, regionId, index, nodes);
    });
}

function buildComponentNodes(
    component: Component,
    regionPath: string,
    index: number,
    nodes: CreateNodeOptions<PageComponentNodeData>[],
): void {
    const componentId = buildComponentPath(regionPath, index);
    const nodeType = getComponentNodeType(component);
    const isLayout = component instanceof LayoutComponent;
    const regions = isLayout ? (component.getRegions()?.getRegions() ?? []) : [];
    const childIds = regions.map((r) => buildRegionPath(componentId, r.getName()));

    const componentHasDescriptor = component instanceof DescriptorBasedComponent
        ? component.hasDescriptor()
        : true;

    const fallbackName = component.getName()?.toString() ?? nodeType;
    const displayName = component instanceof TextComponent
        ? (getTextComponentSnippet(component) || fallbackName)
        : fallbackName;

    nodes.push({
        id: componentId,
        data: {
            displayName,
            nodeType,
            draggable: true,
            layoutFragment: false,
            hasDescriptor: componentHasDescriptor,
        },
        parentId: regionPath,
        hasChildren: childIds.length > 0,
        childIds,
    });

    for (const region of regions) {
        buildRegionNodes(region, componentId, nodes);
    }
}

function buildRegionPath(parentPath: string, regionName: string): string {
    return parentPath === PAGE_ROOT_ID
        ? `/${regionName}`
        : `${parentPath}/${regionName}`;
}

function buildComponentPath(regionPath: string, index: number): string {
    return `${regionPath}/${index}`;
}

const TEXT_SNIPPET_MAX_LENGTH = 1000;

function getTextComponentSnippet(component: TextComponent): string {
    const text = StringHelper.htmlToString(component.getText() || '')
        .replace(/\s+/g, ' ')
        .trim();
    const codepoints = Array.from(text);
    return codepoints.length > TEXT_SNIPPET_MAX_LENGTH
        ? codepoints.slice(0, TEXT_SNIPPET_MAX_LENGTH).join('')
        : text;
}

//
// * Path remapping after move
//

function remapExpandedIds(
    expandedIds: Set<string>,
    fromPath: string,
    toPath: string,
): Set<string> {
    const sourceRegion = parentOfPath(fromPath);
    const sourceIndex = lastPathIndex(fromPath);
    const targetRegion = parentOfPath(toPath);
    const targetIndex = lastPathIndex(toPath);

    if (sourceRegion == null || targetRegion == null) return expandedIds;

    const sameRegion = sourceRegion === targetRegion;

    // Target region path may shift when source removal affects its ancestors
    const adjustedTargetRegion = sameRegion
        ? sourceRegion
        : adjustChildIndex(targetRegion, sourceRegion, (idx) =>
            idx > sourceIndex ? idx - 1 : idx,
        );

    const result = new Set<string>();

    for (const id of expandedIds) {
        // Moved component and its descendants: relocate prefix
        if (id === fromPath || id.startsWith(fromPath + '/')) {
            const suffix = id.substring(fromPath.length);
            if (sameRegion) {
                result.add(sourceRegion + '/' + targetIndex + suffix);
            } else {
                result.add(adjustedTargetRegion + '/' + targetIndex + suffix);
            }
            continue;
        }

        let newId = id;

        if (sameRegion) {
            if (sourceIndex < targetIndex) {
                newId = adjustChildIndex(newId, sourceRegion, (idx) =>
                    idx > sourceIndex && idx <= targetIndex ? idx - 1 : idx,
                );
            } else {
                newId = adjustChildIndex(newId, sourceRegion, (idx) =>
                    idx >= targetIndex && idx < sourceIndex ? idx + 1 : idx,
                );
            }
        } else {
            newId = adjustChildIndex(newId, sourceRegion, (idx) =>
                idx > sourceIndex ? idx - 1 : idx,
            );
            newId = adjustChildIndex(newId, adjustedTargetRegion, (idx) =>
                idx >= targetIndex ? idx + 1 : idx,
            );
        }

        result.add(newId);
    }

    return result;
}

// Adjusts the component index immediately under `regionPath` in `id`.
function adjustChildIndex(
    id: string,
    regionPath: string,
    adjustFn: (index: number) => number,
): string {
    const prefix = regionPath + '/';
    if (!id.startsWith(prefix)) return id;

    const rest = id.substring(prefix.length);
    const slashIdx = rest.indexOf('/');
    const indexStr = slashIdx === -1 ? rest : rest.substring(0, slashIdx);
    const index = Number(indexStr);

    if (!Number.isInteger(index)) return id;

    const newIndex = adjustFn(index);
    if (newIndex === index) return id;

    const suffix = slashIdx === -1 ? '' : rest.substring(slashIdx);
    return prefix + newIndex + suffix;
}

function parentOfPath(path: string): string | null {
    const lastSlash = path.lastIndexOf('/');
    if (lastSlash <= 0) return path.length > 1 ? '/' : null;
    return path.substring(0, lastSlash);
}

function lastPathIndex(path: string): number {
    const lastSlash = path.lastIndexOf('/');
    return Number(path.substring(lastSlash + 1));
}
