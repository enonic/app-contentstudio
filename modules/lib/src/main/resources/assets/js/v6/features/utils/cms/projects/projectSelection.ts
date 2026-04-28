import {type Project} from '../../../../../app/settings/data/project/Project';

function isAvailableProject(project: Readonly<Project>): boolean {
    return !!project.getDisplayName();
}

function getMainParentName(
    project: Readonly<Project>,
    projectsByName: ReadonlyMap<string, Readonly<Project>>
): string | undefined {
    const mainParentName = project.getParents()?.[0];

    return mainParentName && projectsByName.has(mainParentName) ? mainParentName : undefined;
}

function getProjectsInDisplayOrder(projects: Readonly<Project>[]): Readonly<Project>[] {
    const sortedProjects = [...projects].sort((a, b) => a.getName().localeCompare(b.getName()));
    const projectsByName = new Map(sortedProjects.map((project) => [project.getName(), project]));
    const childrenByParentName = new Map<string, Readonly<Project>[]>();
    const rootProjects: Readonly<Project>[] = [];

    for (const project of sortedProjects) {
        const parentName = getMainParentName(project, projectsByName);

        if (parentName) {
            const siblings = childrenByParentName.get(parentName);
            if (siblings) {
                siblings.push(project);
            } else {
                childrenByParentName.set(parentName, [project]);
            }
        } else {
            rootProjects.push(project);
        }
    }

    const orderedProjects: Readonly<Project>[] = [];

    const visit = (project: Readonly<Project>): void => {
        orderedProjects.push(project);
        childrenByParentName.get(project.getName())?.forEach(visit);
    };

    rootProjects.forEach(visit);

    return orderedProjects;
}

function resolveClosestAvailableAncestorId(
    deletedProject: Readonly<Project> | undefined,
    remainingByName: ReadonlyMap<string, Readonly<Project>>
): string | undefined {
    let currentParentName = deletedProject?.getParents()?.[0];

    while (currentParentName) {
        const currentParent = remainingByName.get(currentParentName);

        if (!currentParent) {
            return undefined;
        }

        if (isAvailableProject(currentParent)) {
            return currentParent.getName();
        }

        currentParentName = currentParent.getParents()?.[0];
    }

    return undefined;
}

function resolveFirstAvailableProjectId(projects: Readonly<Project>[]): string | undefined {
    return getProjectsInDisplayOrder(projects).find((project) => isAvailableProject(project))?.getName();
}

export function resolveActiveProjectId(
    projects: Readonly<Project>[],
    projectIdFromUrl: string | undefined
): string | undefined {
    if (projects.length === 1) {
        return isAvailableProject(projects[0]) ? projects[0].getName() : undefined;
    }

    const projectFromUrl = projects.find((project) => project.getName() === projectIdFromUrl);

    return projectFromUrl && isAvailableProject(projectFromUrl) ? projectIdFromUrl : undefined;
}

export function resolveActiveProjectIdAfterDeletion(
    remainingProjects: Readonly<Project>[],
    deletedProject: Readonly<Project> | undefined
): string | undefined {
    const remainingByName = new Map(remainingProjects.map((project) => [project.getName(), project]));
    const closestAvailableAncestorId = resolveClosestAvailableAncestorId(deletedProject, remainingByName);

    return closestAvailableAncestorId ?? resolveFirstAvailableProjectId(remainingProjects);
}
