import {useMemo} from 'react';

import type {ContentId} from '../../../../../../app/content/ContentId';
import type {ContentSummary} from '../../../../../../app/content/ContentSummary';
import {hasContentIdInIds, uniqueIds} from '../../../../utils/cms/content/ids';

export const useIssuePublishTargetIds = (
    items: ContentSummary[],
    dependants: ContentSummary[],
    excludedDependantIds: ContentId[],
): ContentId[] => {
    return useMemo(() => {
        const itemIds = items.map(item => item.getContentId());
        const includedDependants = dependants
            .filter(item => !hasContentIdInIds(item.getContentId(), excludedDependantIds));
        const dependantIds = includedDependants.map(item => item.getContentId());
        return uniqueIds([...itemIds, ...dependantIds]);
    }, [items, dependants, excludedDependantIds]);
};
