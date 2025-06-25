import type {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import type {ContentId} from '../../../../../app/content/ContentId';

export const sortDependantsByInbound = (dependants: ContentSummaryAndCompareStatus[], inboundTargets: ContentId[]): ContentSummaryAndCompareStatus[] => {
    if (dependants.length === 0 || inboundTargets.length === 0) {
        return dependants;
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
