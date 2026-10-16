import { type ResultAsync } from 'neverthrow';
import { requestJson } from '@enonic/ui-utils/request';
import type { AppError } from '@enonic/ui-utils';
import { type ContentId } from '../../../../app/content/ContentId';
import {
    ResolveDependenciesResult,
    type ResolveDependenciesResultJson,
} from '../../../../app/resource/ResolveDependenciesResult';
import { Branch } from '../../../../app/versioning/Branch';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';

/**
 * Resolve dependencies for multiple content items.
 * Used by: widgets/context-panel/widget/dependencies.
 */
export function resolveDependencies(
    contentIds: ContentId[],
    target: Branch = Branch.DRAFT,
): ResultAsync<ResolveDependenciesResult, AppError> {
    const payload = {
        contentIds: contentIds.map((id) => id.toString()),
        target: target.toString(),
    };

    return requestJson<ResolveDependenciesResultJson>(getCmsApiUrl('getDependencies'), {
        method: 'POST',
        body: payload,
    }).map(ResolveDependenciesResult.fromJson);
}
