import { CONFIG } from '@enonic/lib-admin-ui/util/Config';
import { ContentId } from '../../../../app/content/ContentId';
import { RepositoryId } from '../../../../app/repository/RepositoryId';

const ADMIN_PATH = '/admin';
const REST_PATH = 'rest-v2/cs';

type ActiveProjectResolver = () => string | undefined;

let resolveActiveProject: ActiveProjectResolver = () => undefined;

/**
 * Inject the resolver for the current project, used when no explicit project
 * name is passed to URL builders. Wired once from each app root at startup so
 * shared code never reaches up into project state itself.
 */
export function setActiveProjectResolver(resolver: ActiveProjectResolver): void {
    resolveActiveProject = resolver;
}

/**
 * Join path segments, removing duplicate slashes.
 */
function joinPath(...paths: string[]): string {
    return paths
        .filter(Boolean)
        .join('/')
        .replace(/([^:])\/+/g, '$1/');
}

/**
 * Build a CMS REST API URL path with project context.
 * @param endpoint - API endpoint path (e.g., 'content/getDependencies')
 * @param projectName - Optional project name, defaults to current project
 */
export function getCmsPath(endpoint: string, projectName?: string): string {
    const project = projectName ?? resolveActiveProject() ?? '';
    return `cms/${project}/content/content/${endpoint}`;
}

/**
 * Build a full CMS REST API URL.
 * @param path - Path to append after `/admin/rest-v2/cs/`
 */
export function getCmsRestUri(path: string): string {
    return joinPath(ADMIN_PATH, REST_PATH, path);
}

/**
 * Build a full CMS REST API URL for a specific endpoint.
 * Combines getCmsPath and getCmsRestUri.
 * @param endpoint - API endpoint path (e.g., 'content/getDependencies')
 * @param projectName - Optional project name, defaults to current project
 */
export function getCmsApiUrl(endpoint: string, projectName?: string): string {
    return getCmsRestUri(getCmsPath(endpoint, projectName));
}
