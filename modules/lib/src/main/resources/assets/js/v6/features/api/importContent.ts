import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {ResultAsync} from 'neverthrow';
import {RepositoryId} from '../../../app/repository/RepositoryId';

export type ImportNodesError = {
    exception: string;
    message: string;
    stacktrace: string[];
};

export type ImportResult = {
    addedNodes: string[];
    updatedNodes: string[];
    skippedNodes: string[];
    importedBinaries: string[];
    importErrors: ImportNodesError[];
};

export type ExportResult = {
    exportName: string;
    exportedNodes: string[];
    exportedBinaries: string[];
    exportErrors: string[];
};

type ErrorBody = {message?: string};

function getBaseUrl(): string {
    return CONFIG.getString('services.importContentUrl');
}

function getRepository(): string {
    return RepositoryId.fromCurrentProject().toString();
}

function buildUrl(action: 'list' | 'export' | 'import', extra: Record<string, string> = {}): string {
    const params = new URLSearchParams({action, repository: getRepository(), ...extra});
    return `${getBaseUrl()}?${params.toString()}`;
}

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
    const json = (await response.json().catch(() => ({}))) as T & ErrorBody;
    if (!response.ok) {
        throw new Error(json.message ?? `${response.status} ${response.statusText || 'Request failed'}`);
    }
    return json;
}

export function fetchExports(): ResultAsync<string[], Error> {
    return ResultAsync.fromPromise(
        fetch(buildUrl('list'), {credentials: 'same-origin'})
            .then(parseJsonOrThrow<{exports?: string[]}>)
            .then(body => body.exports ?? []),
        error => error instanceof Error ? error : new Error(String(error)),
    );
}

export type ExportContentOptions = {
    name?: string;
};

export function exportContent(contentId: string, options: ExportContentOptions = {}): ResultAsync<ExportResult, Error> {
    const params: Record<string, string> = {contentId};
    if (options.name) params.name = options.name;

    return ResultAsync.fromPromise(
        fetch(buildUrl('export', params), {method: 'POST', credentials: 'same-origin'})
            .then(parseJsonOrThrow<ExportResult>),
        error => error instanceof Error ? error : new Error(String(error)),
    );
}

export type ImportContentOptions = {
    keepPublishFirst?: boolean;
};

export function importContent(
    contentId: string,
    exportName: string,
    options: ImportContentOptions = {},
): ResultAsync<ImportResult, Error> {
    const params: Record<string, string> = {contentId, exportName};
    if (options.keepPublishFirst != null) params.keepPublishFirst = String(options.keepPublishFirst);

    return ResultAsync.fromPromise(
        fetch(buildUrl('import', params), {method: 'POST', credentials: 'same-origin'})
            .then(parseJsonOrThrow<ImportResult>),
        error => error instanceof Error ? error : new Error(String(error)),
    );
}
