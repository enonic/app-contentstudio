import { err, ok, type Result } from 'neverthrow';
import { type ContentId } from '../../../../app/content/ContentId';
import { type ResolvePublishDependenciesResult } from '../../../../app/resource/ResolvePublishDependenciesResult';
import { type AppError } from '../../../shared/api/errors';
import { resolvePublishDependencies } from '../api/publish.api';

export type AppliedPublishDependencies = {
    /** Resolved without dependant exclusions: the full, re-includable dependant list. */
    maxResult: ResolvePublishDependenciesResult;
    /** Resolved with the applied exclusions: re-evaluated required items. */
    minResult: ResolvePublishDependenciesResult;
};

export type ResolveAppliedPublishDependenciesParams = {
    ids: ContentId[];
    excludeChildrenIds: ContentId[];
    excludedIds: ContentId[];
};

/**
 * Two-pass dependency resolve for dialogs with a draft/applied selection.
 *
 * The exclusion-free pass yields the list the user can still re-include; the excluded pass
 * re-evaluates which dependants are mandatory, so excluding a child frees its required parent.
 * The second request is skipped when nothing is excluded, keeping the common case a single
 * round-trip.
 */
export const resolveAppliedPublishDependencies = async ({
    ids,
    excludeChildrenIds,
    excludedIds,
}: ResolveAppliedPublishDependenciesParams): Promise<Result<AppliedPublishDependencies, AppError>> => {
    const maxResult = await resolvePublishDependencies({ ids, excludeChildrenIds });
    if (maxResult.isErr()) {
        return err(maxResult.error);
    }

    if (excludedIds.length === 0) {
        return ok({ maxResult: maxResult.value, minResult: maxResult.value });
    }

    const minResult = await resolvePublishDependencies({ ids, excludeChildrenIds, excludedIds });
    if (minResult.isErr()) {
        return err(minResult.error);
    }

    return ok({ maxResult: maxResult.value, minResult: minResult.value });
};
