import type {ContentId} from '../../../../../app/content/ContentId';
import type {ContentPath} from '../../../../../app/content/ContentPath';

type SortableDependant = {
    getContentId(): ContentId;
    getDisplayName(): string;
    getPath(): ContentPath | null;
};

export const sortDependantsByInbound = <T extends SortableDependant>(
    dependants: readonly T[],
    inboundTargets: readonly ContentId[],
): T[] => {
    if (dependants.length === 0 || inboundTargets.length === 0) {
        return [...dependants];
    }
    const inboundSet = new Set(inboundTargets.map(id => id.toString()));
    return [...dependants].sort((a, b) => {
        const aInbound = inboundSet.has(a.getContentId().toString()) ? 1 : 0;
        const bInbound = inboundSet.has(b.getContentId().toString()) ? 1 : 0;
        if (aInbound !== bInbound) {
            return bInbound - aInbound;
        }
        const aLabel = a.getDisplayName() || a.getPath()?.toString() || '';
        const bLabel = b.getDisplayName() || b.getPath()?.toString() || '';
        return aLabel.localeCompare(bLabel);
    });
};
