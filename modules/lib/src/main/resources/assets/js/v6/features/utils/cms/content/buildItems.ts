import {type ContentId} from '../../../../../app/content/ContentId';
import {PublishRequestItem} from '../../../../../app/issue/PublishRequestItem';
import {hasContentIdInIds} from './ids';

type HasContentId = {
    getContentId(): ContentId;
};

export const getItemIds = <T extends HasContentId>(items: readonly T[]): ContentId[] => {
    return items.map(item => item.getContentId());
};

export const dedupeItems = <T extends HasContentId>(items: readonly T[]): T[] => {
    const deduped = new Map<string, T>();
    items.forEach(item => deduped.set(item.getContentId().toString(), item));
    return Array.from(deduped.values());
};

export const buildItems = <T extends HasContentId>(
    items: readonly T[],
    excludeChildrenIds: ContentId[],
): PublishRequestItem[] => {
    return items.map(item =>
        PublishRequestItem
            .create()
            .setId(item.getContentId())
            .setIncludeChildren(!hasContentIdInIds(item.getContentId(), excludeChildrenIds))
            .build()
    );
};
