import { type ContentId } from '../../../../../app/content/ContentId';

/**
 * Splits the dependants that are descendants of a root into one group per root, keyed by the root id
 * and kept in the order of the roots. A descendant of nested roots goes to the closest one.
 *
 * @param rootIds  roots in the order they are listed
 * @param descendantsByRoot  every descendant of each root, whatever its publish state
 * @param dependantIds  ordered dependants the server resolved; the groups keep this order
 */
export const groupDescendantsByRoot = (
    rootIds: readonly ContentId[],
    descendantsByRoot: ReadonlyMap<string, readonly ContentId[]>,
    dependantIds: readonly ContentId[],
): Map<string, ContentId[]> => {
    const sizeOf = (rootId: ContentId): number => descendantsByRoot.get(rootId.toString())?.length ?? 0;
    const closestFirst = rootIds.filter((rootId) => sizeOf(rootId) > 0).sort((a, b) => sizeOf(a) - sizeOf(b));

    const assigned = new Set<string>();
    const groups = new Map<string, ContentId[]>();

    for (const rootId of closestFirst) {
        const descendants = new Set(descendantsByRoot.get(rootId.toString())?.map((id) => id.toString()));
        const group = dependantIds.filter((id) => descendants.has(id.toString()) && !assigned.has(id.toString()));

        group.forEach((id) => assigned.add(id.toString()));
        groups.set(rootId.toString(), group);
    }

    const ordered = new Map<string, ContentId[]>();
    for (const rootId of rootIds) {
        const group = groups.get(rootId.toString());
        if (group != null && group.length > 0) ordered.set(rootId.toString(), group);
    }

    return ordered;
};
