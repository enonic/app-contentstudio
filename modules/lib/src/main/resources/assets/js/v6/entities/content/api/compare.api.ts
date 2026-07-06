import { okAsync, type ResultAsync } from 'neverthrow';
import { requestJson } from '../../../shared/api/client';
import { type AppError } from '../../../shared/api/errors';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';

type CompareContentResultJson = {
    id: string;
    diff: string[];
};

type CompareContentResultsJson = {
    compareContentResults: CompareContentResultJson[];
};

export type CompareResult = {
    diff: string[];
};

/**
 * Compare draft and master versions of content items by id.
 * Used by: features/publish/model/publishDialog.commands,
 * widgets/context-panel/model/contextContent.service, app/wizard/ContentWizardPanel.
 */
export function compareContent(ids: string[]): ResultAsync<Map<string, CompareResult>, AppError> {
    if (ids.length === 0) {
        return okAsync(new Map<string, CompareResult>());
    }

    return requestJson<CompareContentResultsJson>(getCmsApiUrl('compare'), { method: 'POST', body: { ids } }).map(
        (json) => {
            const result = new Map<string, CompareResult>();

            for (const entry of json.compareContentResults) {
                result.set(entry.id, {
                    diff: entry.diff,
                });
            }

            return result;
        },
    );
}
