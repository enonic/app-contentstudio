import {ContentId} from "../../../../../app/content/ContentId";

type HasContentId = {
    getContentId(): ContentId;
};

export const hasContentById = <T extends HasContentId>(id: ContentId, items: readonly T[]) => {
    return items.some(i => i.getContentId().equals(id));
};

export const hasContentIdInIds = (id: ContentId, ids: readonly ContentId[]) => {
    return ids.some(i => i.equals(id));
};

export const isIdsEqual = (ids1: readonly ContentId[], ids2: readonly ContentId[]): boolean => {
    if (ids1 === ids2) return true;
    if (ids1.length !== ids2.length) return false;

    const counts = new Map<string, number>();

    for (const id of ids1) {
        const key = String(id);
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    for (const id of ids2) {
        const key = String(id);
        const count = counts.get(key);
        if (count == null) return false;

        if (count === 1) {
            counts.delete(key);
        } else {
            counts.set(key, count - 1);
        }
    }

    return counts.size === 0;
};

export const uniqueIds = (ids: readonly ContentId[]): ContentId[] => {
    const uniqueList = new Set<string>(ids.map(id => id.toString()));
    return Array.from(uniqueList).map(id => new ContentId(id));
};
