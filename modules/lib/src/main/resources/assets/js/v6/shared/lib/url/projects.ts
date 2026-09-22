import { type FlatNode } from '@enonic/ui';
import { getCmsRestUri } from './cms';
import { type Project } from '../../../../app/settings/data/project/Project';
import { ProjectAccess } from '../../../../app/settings/access/ProjectAccess';

export function resolveProjectIconUrl(
    projectName: string | undefined | null,
    version?: string | null,
): string | undefined {
    if (projectName == null) {
        return undefined;
    }

    const url = `${getCmsRestUri('project/icon/')}${encodeURIComponent(projectName)}`;

    return version != null ? `${url}?ts=${encodeURIComponent(version)}` : url;
}

/**
 * Flattens projects array into of FlatNode for rendering.
 * Useful for rendering in a tree list.
 *
 * @param projects - Array of projects to flatten
 * @param expanded - Array of expanded project names
 * @returns Array of FlatNode for rendering in a tree list
 *
 * @example
 * const projects = [projectA, projectB, projectC];
 * const expanded = ['projectA', 'projectB'];
 * const treeListItems = projectsToTreeListItems(projects, expanded);
 * // Returns: [{id: 'projectA', data: projectA, level: 1, parentId: null, hasChildren: true, isExpanded: true}, ...]
 */
export function projectsToTreeListItems(
    projects: Readonly<Project>[],
    expanded: string[],
): FlatNode<Readonly<Project>>[] {
    const flatten = (parentId: string | null, level: number): FlatNode<Readonly<Project>>[] =>
        childrenOf(projects, parentId).flatMap((project) => {
            const name = project.getName();
            const children = childrenOf(projects, name);
            const hasChildren = children.length > 0;
            const isExpanded = expanded.includes(name);

            const node: FlatNode<Readonly<Project>> = {
                id: name,
                data: project,
                level,
                parentId,
                hasChildren,
                isExpanded,
            };

            // Recursively add children immediately after parent
            const childNodes = isExpanded ? flatten(name, level + 1) : [];

            return [node, ...childNodes];
        });

    return flatten(null, 1);
}

/**
 * Filters projects matching a search value into a flat list of FlatNode for rendering.
 *
 * Unlike {@link projectsToTreeListItems}, matches are collected from the whole project set
 * instead of the currently expanded branches, so nested layers stay searchable while their
 * parent is collapsed. Matches are rendered as root level rows without expand controls.
 *
 * @param projects - Array of projects to search in
 * @param searchValue - Case insensitive substring matched against display name, name and description
 * @returns Array of FlatNode for the matching projects, in the incoming order
 *
 * @example
 * const treeListItems = searchProjectsToListItems([defaultProject, cfeLayer], 'cfe');
 * // Returns: [{id: 'cfe', data: cfeLayer, level: 1, parentId: null, hasChildren: false, isExpanded: false}]
 */
export function searchProjectsToListItems(
    projects: Readonly<Project>[],
    searchValue: string,
): FlatNode<Readonly<Project>>[] {
    const search = searchValue.trim().toLowerCase();

    return projects
        .filter(
            (project) =>
                search.length === 0 ||
                project.getDisplayName()?.toLowerCase().includes(search) ||
                project.getName()?.toLowerCase().includes(search) ||
                project.getDescription()?.toLowerCase().includes(search),
        )
        .map((project) => ({
            id: project.getName(),
            data: project,
            level: 1,
            parentId: null,
            hasChildren: false,
            isExpanded: false,
        }));
}

/**
 * Extracts a principal keys list and a roles object from a project's permissions.
 *
 * @param project - Project to extract permissions from
 * @returns Object containing:
 *   - `principalKeys` - Array of all principal key strings across all roles
 *   - `roles` - Object of principal key string to its {@link ProjectAccess} role
 *
 * @example
 * const { principalKeys, roles } = getProjectDetailedPermissions(project);
 * // principalKeys: ['user:system:alice', 'group:system:editors']
 * // roles: { 'user:system:alice': ProjectAccess.OWNER, 'group:system:editors': ProjectAccess.EDITOR }
 */
export const getProjectDetailedPermissions = (
    project: Readonly<Project>,
): { principalKeys: string[]; roles: Record<string, ProjectAccess> } => {
    const permissions = project.getPermissions();

    const owners = permissions.getOwners();
    const editors = permissions.getEditors();
    const contributors = permissions.getContributors();
    const authors = permissions.getAuthors();

    const principalKeys = [...owners, ...editors, ...contributors, ...authors].map((principal) => principal.toString());

    const roles: Record<string, ProjectAccess> = Object.fromEntries([
        ...owners.map((owner) => [owner, ProjectAccess.OWNER]),
        ...editors.map((editor) => [editor, ProjectAccess.EDITOR]),
        ...contributors.map((contributor) => [contributor, ProjectAccess.CONTRIBUTOR]),
        ...authors.map((author) => [author, ProjectAccess.AUTHOR]),
    ]);

    return { principalKeys, roles };
};

function childrenOf(projects: Readonly<Project>[], parentName: string | null): Readonly<Project>[] {
    return projects.filter((p) =>
        parentName === null ? p.getParents().length === 0 : p.hasMainParentByName(parentName),
    );
}
