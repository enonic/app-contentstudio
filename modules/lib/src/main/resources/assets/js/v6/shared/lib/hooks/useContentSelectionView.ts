import { useMemo } from 'react';
import type { ContentId } from '../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { filterShownDependants } from '../cms/content/dependantsSelection';
import { useContentIdSet } from './useContentIdSet';

type ContentSelectionViewOptions = {
    excludeChildrenIds: readonly ContentId[];
    excludedDependantIds: readonly ContentId[];
    requiredDependantIds: readonly ContentId[];
    dependants: ContentSummary[];
    appliedExcludedDependantIds: readonly ContentId[];
    showExcludedDependants: boolean;
};

type ContentSelectionView = {
    excludeChildrenSet: ReadonlySet<string>;
    excludedDependantSet: ReadonlySet<string>;
    requiredDependantSet: ReadonlySet<string>;
    visibleDependants: ContentSummary[];
};

/** Uses draft exclusions for checkbox state and applied exclusions for visible rows. */
export const useContentSelectionView = ({
    excludeChildrenIds,
    excludedDependantIds,
    requiredDependantIds,
    dependants,
    appliedExcludedDependantIds,
    showExcludedDependants,
}: ContentSelectionViewOptions): ContentSelectionView => {
    const excludeChildrenSet = useContentIdSet(excludeChildrenIds);
    const excludedDependantSet = useContentIdSet(excludedDependantIds);
    const requiredDependantSet = useContentIdSet(requiredDependantIds);

    const visibleDependants = useMemo(
        () => filterShownDependants(dependants, appliedExcludedDependantIds, showExcludedDependants),
        [appliedExcludedDependantIds, dependants, showExcludedDependants],
    );

    return {
        excludeChildrenSet,
        excludedDependantSet,
        requiredDependantSet,
        visibleDependants,
    };
};
