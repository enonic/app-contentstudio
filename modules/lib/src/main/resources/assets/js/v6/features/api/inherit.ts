import {ResultAsync} from 'neverthrow';
import {type ContentId} from '../../../app/content/ContentId';
import {ContentInheritType} from '../../../app/content/ContentInheritType';
import {ContentSummary} from '../../../app/content/ContentSummary';
import {type ContentSummaryJson} from '../../../app/content/ContentSummaryJson';
import {type ListContentResult} from '../../../app/resource/ListContentResult';
import {AppError} from './errors';
import {getCmsApiUrl} from '../utils/url/cms';
import {$projects} from '../store/projects.store';

export function localizeContents(
    contentIds: ContentId[],
    language?: string,
): ResultAsync<ContentSummary[], AppError> {
    if (contentIds.length === 0) {
        return ResultAsync.fromSafePromise(Promise.resolve([]));
    }

    const url = getCmsApiUrl('localize');

    const params: Record<string, unknown> = {
        contentIds: contentIds.map(id => id.toString()),
    };

    if (language) {
        params.language = language;
    }

    return ResultAsync.fromPromise(
        fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(params),
        }).then(async (response) => {
            if (!response.ok) {
                throw new AppError(response.statusText);
            }
            const json: ListContentResult<ContentSummaryJson> = await response.json();
            return ContentSummary.fromJsonArray(json.contents);
        }),
        (error): AppError => error instanceof AppError ? error : new AppError(String(error)),
    );
}

export function restoreInherit(
    contentId: ContentId,
    inheritTypes: ContentInheritType[],
    projectName?: string,
): ResultAsync<void, AppError> {
    const url = getCmsApiUrl('restoreInherit');
    const project = projectName ?? $projects.get().activeProjectId ?? '';

    return ResultAsync.fromPromise(
        fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                contentId: contentId.toString(),
                project,
                inherit: inheritTypes.map((t) => ContentInheritType[t]),
            }),
        }).then((response) => {
            if (!response.ok) {
                throw new AppError(response.statusText);
            }
        }),
        (error): AppError => error instanceof AppError ? error : new AppError(String(error)),
    );
}
