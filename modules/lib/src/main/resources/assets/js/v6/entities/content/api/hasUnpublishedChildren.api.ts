import { okAsync, type ResultAsync } from 'neverthrow';
import { type ContentId } from '../../../../app/content/ContentId';
import { requestJson } from '../../../shared/api/client';
import { type AppError } from '../../../shared/api/errors';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';

type HasUnpublishedChildrenJson = {
    id: { id: string };
    hasChildren: boolean;
};

type HasUnpublishedChildrenListJson = {
    contents: HasUnpublishedChildrenJson[];
};

/**
 * Check if content items have unpublished children.
 * Returns a Map of content ID to hasUnpublishedChildren boolean.
 * Used by: features/publish/model/publishDialog.commands,
 * entities/content/lib/useItemsWithUnpublishedChildren.
 */
export function hasUnpublishedChildren(contentIds: ContentId[]): ResultAsync<Map<string, boolean>, AppError> {
    if (contentIds.length === 0) {
        return okAsync(new Map<string, boolean>());
    }

    const payload = {
        contentIds: contentIds.map((id) => id.toString()),
    };

    return requestJson<HasUnpublishedChildrenListJson>(getCmsApiUrl('hasUnpublishedChildren'), {
        method: 'POST',
        body: payload,
    }).map((json) => new Map(json.contents.map((item) => [item.id.id, item.hasChildren])));
}
