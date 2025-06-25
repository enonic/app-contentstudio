import {atom, computed} from 'nanostores';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Project} from '../../../app/settings/data/project/Project';
import {FolderItemBuilder, FolderViewItem} from '../../../app/settings/view/FolderViewItem';
import {ProjectViewItem} from '../../../app/settings/view/ProjectViewItem';
import {SettingsViewItem} from '../../../app/settings/view/SettingsViewItem';
import {createEmptyState, flattenTree, setNodes, setRootIds, type CreateNodeOptions} from '../lib/tree-store';
import {$projects} from './projects.store';
import type {TreeState} from '../lib/tree-store';

export const SETTINGS_PROJECTS_FOLDER_ID = 'projects';

export type SettingsTreeState = TreeState<SettingsViewItem>;

const $settingsTreeState = atom<SettingsTreeState>(createEmptyState<SettingsViewItem>());

export const $settingsFlatNodes = computed($settingsTreeState, flattenTree);

export function getSettingsItem(id: string): SettingsViewItem | undefined {
    return $settingsTreeState.get().nodes.get(id)?.data ?? undefined;
}

export function hasSettingsItem(id: string): boolean {
    return $settingsTreeState.get().nodes.has(id);
}

export function expandSettingsNode(id: string): void {
    const current = $settingsTreeState.get();
    if (current.expandedIds.has(id)) return;
    const next = new Set(current.expandedIds);
    next.add(id);
    $settingsTreeState.set({
        ...current,
        expandedIds: next,
    });
}

export function collapseSettingsNode(id: string): void {
    const current = $settingsTreeState.get();
    if (!current.expandedIds.has(id)) return;
    const next = new Set(current.expandedIds);
    next.delete(id);
    $settingsTreeState.set({
        ...current,
        expandedIds: next,
    });
}

export function resetSettingsTreeForReload(): void {
    hasLoadedProjects = false;
    $settingsTreeState.set(createEmptyState<SettingsViewItem>());
}

function makeRootFolderItem(): FolderViewItem {
    return new FolderItemBuilder()
        .setId(SETTINGS_PROJECTS_FOLDER_ID)
        .setDisplayName(i18n('settings.projects'))
        .setDescription(i18n('settings.projects.description'))
        .build();
}

type BuildTreeOptions = {
    expandAll?: boolean;
};

function buildTreeState(
    projects: Project[],
    previousState?: SettingsTreeState,
    options: BuildTreeOptions = {}
): SettingsTreeState {
    const byName = new Map(projects.map((project) => [project.getName(), project]));
    const itemsByName = new Map<string, ProjectViewItem>();
    const childMap = new Map<string, string[]>();

    for (const project of projects) {
        itemsByName.set(
            project.getName(),
            ProjectViewItem.create().setData(project).build()
        );
    }

    const getParentName = (project: Project): string | undefined => {
        const parents = project.getParents() ?? [];
        return parents.find((candidate) => project.hasMainParentByName(candidate) && byName.has(candidate));
    };

    const rootChildIds: string[] = [];

    for (const project of projects) {
        const projectId = project.getName();
        const parentName = getParentName(project);

        if (parentName) {
            const siblings = childMap.get(parentName);
            if (siblings) {
                siblings.push(projectId);
            } else {
                childMap.set(parentName, [projectId]);
            }
        } else {
            rootChildIds.push(projectId);
        }
    }

    const nodes: CreateNodeOptions<SettingsViewItem>[] = [];

    const rootItem = makeRootFolderItem();
    nodes.push({
        id: SETTINGS_PROJECTS_FOLDER_ID,
        data: rootItem,
        parentId: null,
        childIds: rootChildIds,
        hasChildren: rootChildIds.length > 0,
    });

    for (const project of projects) {
        const projectId = project.getName();
        const parentName = getParentName(project);
        const childIds = childMap.get(projectId) ?? [];

        nodes.push({
            id: projectId,
            data: itemsByName.get(projectId),
            parentId: parentName ?? SETTINGS_PROJECTS_FOLDER_ID,
            childIds,
            hasChildren: childIds.length > 0,
        });
    }

    let state = createEmptyState<SettingsViewItem>();
    state = setNodes(state, nodes);
    state = setRootIds(state, [SETTINGS_PROJECTS_FOLDER_ID]);

    const previousExpanded = previousState?.expandedIds ?? new Set<string>();
    let nextExpanded = new Set<string>();

    if (options.expandAll) {
        state.nodes.forEach((node) => {
            nextExpanded.add(node.id);
        });
    } else if (previousExpanded.size > 0) {
        previousExpanded.forEach((id) => {
            if (state.nodes.has(id)) {
                nextExpanded.add(id);
            }
        });
    } else {
        // Default expand: all nodes on first load
        state.nodes.forEach((node) => {
            nextExpanded.add(node.id);
        });
    }

    nextExpanded.add(SETTINGS_PROJECTS_FOLDER_ID);

    return {
        ...state,
        expandedIds: nextExpanded,
    };
}

let hasLoadedProjects = false;

function updateFromProjects(): void {
    const {projects} = $projects.get();
    const previousState = $settingsTreeState.get();
    const shouldExpandAll = !hasLoadedProjects && projects.length > 0;

    if (shouldExpandAll) {
        hasLoadedProjects = true;
    }

    $settingsTreeState.set(buildTreeState(projects as Project[], previousState, {
        expandAll: shouldExpandAll,
    }));
}

$projects.subscribe(() => {
    updateFromProjects();
});

updateFromProjects();

export {$settingsTreeState};
