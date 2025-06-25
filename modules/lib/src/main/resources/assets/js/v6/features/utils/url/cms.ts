import {$projects} from '../../store/projects.store';

const ADMIN_PATH = '/admin';
const REST_PATH = 'rest-v2/cs';

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
    const project = projectName ?? $projects.get().activeProjectId ?? '';
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
