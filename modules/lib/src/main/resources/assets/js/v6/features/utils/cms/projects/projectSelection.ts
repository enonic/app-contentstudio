import {type Project} from '../../../../../app/settings/data/project/Project';

type ProjectLike = Pick<Project, 'getName' | 'getParents'>;

export function resolveActiveProjectId(
    projects: Readonly<ProjectLike>[],
    projectIdFromUrl: string | undefined
): string | undefined {
    if (projects.length === 1) {
        return projects[0].getName();
    }

    return projects.some((project) => project.getName() === projectIdFromUrl) ? projectIdFromUrl : undefined;
}

export function resolveActiveProjectIdAfterDeletion(
    remainingProjects: Readonly<ProjectLike>[],
    deletedProject: ProjectLike | undefined
): string | undefined {
    const remainingByName = new Map(remainingProjects.map((project) => [project.getName(), project]));

    const parentProject = (deletedProject?.getParents() ?? [])
        .map((parentName) => remainingByName.get(parentName))
        .find((project) => project !== undefined);

    return parentProject?.getName() ?? remainingProjects[0]?.getName();
}
