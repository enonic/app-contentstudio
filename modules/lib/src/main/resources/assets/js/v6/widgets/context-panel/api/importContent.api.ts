import { type ResultAsync } from 'neverthrow';
import { RepositoryId } from '../../../../app/repository/RepositoryId';
import { requestJson } from '../../../shared/api/client';
import { AppError } from '../../../shared/api/errors';
import { $config } from '../../../shared/config/config.store';

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

function getBaseUrl(): string {
    return $config.get().services.importContentUrl;
}

function getRepository(): string {
    return RepositoryId.fromCurrentProject().toString();
}

function buildUrl(action: 'list' | 'export' | 'import', extra: Record<string, string> = {}): string {
    const params = new URLSearchParams({ action, repository: getRepository(), ...extra });
    return `${getBaseUrl()}?${params.toString()}`;
}

/**
 * List available export names for the current repository.
 * Used by: widgets/context-panel/widget/import-content/ImportContentWidget.
 */
export function fetchExports(): ResultAsync<string[], AppError> {
    return requestJson<{ exports?: string[] }>(buildUrl('list')).map((body) => body.exports ?? []);
}

export type ExportContentOptions = {
    name?: string;
};

/**
 * Export a content tree to a named export on the server.
 * Used by: widgets/context-panel/widget/import-content/ImportContentExportDialog.
 */
export function exportContent(
    contentId: string,
    options: ExportContentOptions = {},
): ResultAsync<ExportResult, AppError> {
    const params: Record<string, string> = { contentId };
    if (options.name) params.name = options.name;

    return requestJson<ExportResult>(buildUrl('export', params), { method: 'POST' });
}

export type ImportContentOptions = {
    keepPublishFirst?: boolean;
};

/**
 * Import a previously created export under the given content.
 * Used by: widgets/context-panel/widget/import-content/ImportContentImportDialog.
 */
export function importContent(
    contentId: string,
    exportName: string,
    options: ImportContentOptions = {},
): ResultAsync<ImportResult, AppError> {
    const params: Record<string, string> = { contentId, exportName };
    if (options.keepPublishFirst != null) params.keepPublishFirst = String(options.keepPublishFirst);

    return requestJson<ImportResult>(buildUrl('import', params), { method: 'POST' });
}
