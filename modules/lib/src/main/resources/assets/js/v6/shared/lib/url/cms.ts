import { $config } from '../../config/config.store';

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
 * Resolve the current active project name via the injected resolver. Returns
 * undefined when no resolver is wired or no project is active. Lets shared URL
 * builders reuse the same project context without reaching into project state.
 */
export function resolveActiveProjectName(): string | undefined {
    return resolveActiveProject();
}

/**
 * Join path segments, removing duplicate slashes.
 */
export function joinPath(...paths: string[]): string {
    return paths
        .filter(Boolean)
        .join('/')
        .replace(/(^|[^:])\/{2,}/g, '$1/');
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
 * Build a full CMS REST API URL. The admin prefix comes from the server config
 * (`adminUrl`), so vhost-mapped admin deployments resolve correctly.
 * @param path - Path to append after `<adminUrl>/rest-v2/cs/`
 */
export function getCmsRestUri(path: string): string {
    return joinPath('/', $config.get().adminUrl, REST_PATH, path);
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

/**
 * Build a project-scoped CMS path for non-content endpoints (schema, page).
 * @param subPath - Path after the project segment, e.g. 'content/schema/filter/parts'
 * @param projectName - Optional project name, defaults to the active project
 */
export function getCmsProjectPath(subPath: string, projectName?: string): string {
    const project = projectName ?? resolveActiveProject() ?? '';
    return `cms/${project}/${subPath}`;
}

/**
 * Build a full project-scoped CMS REST URL for non-content endpoints.
 */
export function getCmsProjectUrl(subPath: string, projectName?: string): string {
    return getCmsRestUri(getCmsProjectPath(subPath, projectName));
}
