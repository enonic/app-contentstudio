import { ResultAsync } from 'neverthrow';
import { type ApplicationConfig } from '@enonic/lib-admin-ui/application/ApplicationConfig';
import { type PrincipalKey } from '@enonic/lib-admin-ui/security/PrincipalKey';
import { TaskId } from '@enonic/lib-admin-ui/task/TaskId';
import { type TaskIdJson } from '@enonic/lib-admin-ui/task/TaskIdJson';
import { Project } from '../../../../app/settings/data/project/Project';
import { ProjectHelper } from '../../../../app/settings/data/project/ProjectHelper';
import { ProjectPermissions } from '../../../../app/settings/data/project/ProjectPermissions';
import { type ProjectReadAccess } from '../../../../app/settings/data/project/ProjectReadAccess';
import { type ProjectJson } from '../../../../app/settings/resource/json/ProjectJson';
import { type ProjectPermissionsJson } from '../../../../app/settings/resource/json/ProjectPermissionsJson';
import { type ProjectReadAccessJson } from '../../../../app/settings/resource/json/ProjectReadAccessJson';
import { requestJson } from '../../../shared/api/client';
import { AppError } from '../../../shared/api/errors';
import { getCmsRestUri } from '../../../shared/lib/url/cms';

export type UpdateProjectParams = {
    name: string;
    displayName: string;
    description?: string;
    language?: string;
    applicationConfigs: ApplicationConfig[];
};

export type CreateProjectParams = UpdateProjectParams & {
    parents?: Readonly<Project>[];
    readAccess?: ProjectReadAccess;
};

type ProjectMutationPayload = {
    name: string;
    displayName: string;
    description?: string;
    language?: string;
    applicationConfigs: object[];
    parents?: string[];
    readAccess?: ProjectReadAccessJson;
};

function toMutationPayload(params: UpdateProjectParams): ProjectMutationPayload {
    return {
        name: params.name,
        displayName: params.displayName,
        description: params.description,
        language: params.language,
        applicationConfigs: params.applicationConfigs.map((config) => config.toJson()),
    };
}

/**
 * List all projects, resolving unavailable ones, sorted by name.
 * Used by: entities/project/projects.store.
 */
export function listProjects(): ResultAsync<Project[], AppError> {
    const url = `${getCmsRestUri('project/list')}?resolveUnavailable=true`;

    return requestJson<{ projects: ProjectJson[] }>(url).map((json) =>
        json.projects.map(Project.fromJson).sort(ProjectHelper.sortProjects),
    );
}

/**
 * Create a new project, optionally under parents and with read access.
 * Used by: features/manage-project/model/projectDialog.store.
 */
export function createProject(params: CreateProjectParams): ResultAsync<Project, AppError> {
    const url = getCmsRestUri('project/create');

    const payload = toMutationPayload(params);
    if (params.parents != null && params.parents.length > 0) {
        payload.parents = params.parents.map((parent) => parent.getName());
    }
    if (params.readAccess != null) {
        payload.readAccess = params.readAccess.toJson();
    }

    return requestJson<ProjectJson>(url, { method: 'POST', body: payload }).map(Project.fromJson);
}

/**
 * Update a project's name, description, language and application configs.
 * Used by: features/manage-project/model/projectDialog.store.
 */
export function updateProject(params: UpdateProjectParams): ResultAsync<Project, AppError> {
    const url = getCmsRestUri('project/modify');

    return requestJson<ProjectJson>(url, { method: 'POST', body: toMutationPayload(params) }).map(Project.fromJson);
}

/**
 * Update a project's role permissions, merging an optional viewer list.
 * Used by: features/manage-project/model/projectDialog.store.
 */
export function updateProjectPermissions(
    name: string,
    permissions: ProjectPermissions,
    viewers?: PrincipalKey[],
): ResultAsync<ProjectPermissions, AppError> {
    const url = getCmsRestUri('project/modifyPermissions');

    const permissionsJson = permissions.toJson();
    if (viewers != null) {
        permissionsJson.viewer = viewers.map((key) => key.toString());
    }

    const payload = { name, permissions: permissionsJson };

    return requestJson<ProjectPermissionsJson>(url, { method: 'POST', body: payload }).map(ProjectPermissions.fromJson);
}

/**
 * Update a project's read access. Returns a task id to track the async apply.
 * Used by: features/manage-project/model/projectDialog.store.
 */
export function updateProjectReadAccess(name: string, readAccess: ProjectReadAccess): ResultAsync<TaskId, AppError> {
    const url = getCmsRestUri('project/modifyReadAccess');

    const payload = { name, readAccess: readAccess.toJson() };

    return requestJson<TaskIdJson>(url, { method: 'POST', body: payload }).map(TaskId.fromJson);
}

/**
 * Delete a project by name.
 * Used by: pages/settings/model/deleteSettingsDialog.store.
 */
export function deleteProject(name: string): ResultAsync<void, AppError> {
    const url = getCmsRestUri('project/delete');

    return requestJson<boolean>(url, { method: 'POST', body: { name } }).map(() => undefined);
}
