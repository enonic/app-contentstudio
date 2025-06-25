import {FlatNode} from '@enonic/ui';
import {Project} from '../../../../app/settings/data/project/Project';
import {getCmsRestUri} from './cms';

export function resolveProjectIconUrl(projectName: string | undefined | null): string | undefined {
    if (projectName == null) {
        return undefined;
    }

    return `${getCmsRestUri('project/icon/')}${encodeURIComponent(projectName)}`;
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
export function projectsToTreeListItems(projects: Readonly<Project>[], expanded: string[]): FlatNode<Readonly<Project>>[] {
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

function childrenOf(projects: Readonly<Project>[], parentName: string | null): Readonly<Project>[] {
    return projects.filter((p) => (parentName === null ? p.getParents().length === 0 : p.getParents().includes(parentName)));
}
