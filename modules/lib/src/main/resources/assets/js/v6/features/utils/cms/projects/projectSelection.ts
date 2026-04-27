import {type Project} from '../../../../../app/settings/data/project/Project';

type ProjectLike = Pick<Project, 'getName' | 'getParents'> & Partial<Pick<Project, 'getDisplayName'>>;

function isAvailableProject(project: ProjectLike): boolean {
    return typeof project.getDisplayName !== 'function' || !!project.getDisplayName();
}

function getMainParentName(
    project: ProjectLike,
    projectsByName: ReadonlyMap<string, ProjectLike>
): string | undefined {
    const mainParentName = project.getParents()?.[0];

    return mainParentName && projectsByName.has(mainParentName) ? mainParentName : undefined;
}

function getProjectsInDisplayOrder(projects: Readonly<ProjectLike>[]): ProjectLike[] {
    const sortedProjects = [...projects].sort((a, b) => a.getName().localeCompare(b.getName()));
    const projectsByName = new Map(sortedProjects.map((project) => [project.getName(), project]));
    const childrenByParentName = new Map<string, ProjectLike[]>();
    const rootProjects: ProjectLike[] = [];

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

    const orderedProjects: ProjectLike[] = [];

    const visit = (project: ProjectLike): void => {
        orderedProjects.push(project);
        childrenByParentName.get(project.getName())?.forEach(visit);
    };

    rootProjects.forEach(visit);

    return orderedProjects;
}

function resolveClosestAvailableAncestorId(
    deletedProject: ProjectLike | undefined,
    remainingByName: ReadonlyMap<string, ProjectLike>
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

function resolveFirstAvailableProjectId(projects: Readonly<ProjectLike>[]): string | undefined {
    return getProjectsInDisplayOrder(projects).find((project) => isAvailableProject(project))?.getName();
}

export function resolveActiveProjectId(
    projects: Readonly<ProjectLike>[],
    projectIdFromUrl: string | undefined
): string | undefined {
    if (projects.length === 1) {
        return isAvailableProject(projects[0]) ? projects[0].getName() : undefined;
    }

    const projectFromUrl = projects.find((project) => project.getName() === projectIdFromUrl);

    return projectFromUrl && isAvailableProject(projectFromUrl) ? projectIdFromUrl : undefined;
}

export function resolveActiveProjectIdAfterDeletion(
    remainingProjects: Readonly<ProjectLike>[],
    deletedProject: ProjectLike | undefined
): string | undefined {
    const remainingByName = new Map(remainingProjects.map((project) => [project.getName(), project]));
    const closestAvailableAncestorId = resolveClosestAvailableAncestorId(deletedProject, remainingByName);

    return closestAvailableAncestorId ?? resolveFirstAvailableProjectId(remainingProjects);
}
