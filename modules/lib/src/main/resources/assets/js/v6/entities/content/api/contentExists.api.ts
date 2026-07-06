import { ResultAsync } from 'neverthrow';
import { type ContentsExistByPathJson } from '../../../../app/resource/json/ContentsExistByPathJson';
import { requestJson } from '../../../shared/api/client';
import { AppError } from '../../../shared/api/errors';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';

/**
 * Check whether a content already exists at the given path. Missing entries in
 * the response are normalized to `false`.
 * Used by: pages/wizard/model/wizardContent.store.
 */
export function contentExistsByPath(path: string, projectName?: string): ResultAsync<boolean, AppError> {
    const url = getCmsApiUrl('contentsExistByPath', projectName);

    return requestJson<ContentsExistByPathJson>(url, {
        method: 'POST',
        body: { contentPaths: [path] },
    }).map((json) => json.contentsExistJson.find((entry) => entry.contentPath === path)?.exists ?? false);
}
