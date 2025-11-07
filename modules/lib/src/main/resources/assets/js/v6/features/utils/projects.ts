import {Project} from '../../../app/settings/data/project/Project';

export type FlatProject = {
    project: Project;
    level: number;
};

/**
 * Flattens a list of projects into a hierarchical list with depth levels.
 * Projects are sorted alphabetically and organized by parent-child relationships.
 *
 * @param projects - Array of projects to flatten
 * @returns Array of projects with their hierarchy level (0 = root, 1+ = nested)
 *
 * @example
 * const projects = [projectA, projectB, projectC];
 * const flattened = flattenProjects(projects);
 * // Returns: [{project: projectA, level: 0}, {project: projectB, level: 1}, ...]
 */
export function flattenProjects(projects: Readonly<Project>[]): FlatProject[] {
    if (projects.length === 0) {
        return [];
    }

    // Sort projects alphabetically by name
    const sorted = [...projects].sort((a, b) => a.getName().localeCompare(b.getName()));

    // Build lookup maps for efficient access
    const byName = new Map(sorted.map((p) => [p.getName(), p]));
    const levelCache = new Map<string, number>();
    const parentCache = new Map<string, string | undefined>();
    const children = new Map<string, Readonly<Project>[]>();

    // Find the main parent of a project (memoized)
    const getParent = (project: Readonly<Project>): string | undefined => {
        const name = project.getName();
        if (parentCache.has(name)) {
            return parentCache.get(name);
        }

        const parents = project.getParents() ?? [];
        const parent = parents.find((candidate) => project.hasMainParentByName(candidate) && byName.has(candidate));
        parentCache.set(name, parent);
        return parent;
    };

    // Calculate hierarchy level recursively (memoized)
    const getLevel = (project: Readonly<Project>): number => {
        const name = project.getName();
        if (levelCache.has(name)) {
            return levelCache.get(name);
        }

        const parentName = getParent(project);
        const level = parentName ? getLevel(byName.get(parentName)) + 1 : 0;
        levelCache.set(name, level);
        return level;
    };

    // Build parent-to-children map
    for (const project of sorted) {
        const parentName = getParent(project);
        if (parentName) {
            const siblings = children.get(parentName);
            if (siblings) {
                siblings.push(project);
            } else {
                children.set(parentName, [project]);
            }
        }
    }

    // Traverse depth-first starting from root projects
    const result: FlatProject[] = [];
    const visit = (project: Project): void => {
        result.push({project, level: getLevel(project)});
        children.get(project.getName())?.forEach(visit);
    };

    sorted.filter((p) => getLevel(p) === 0).forEach(visit);

    return result;
}
