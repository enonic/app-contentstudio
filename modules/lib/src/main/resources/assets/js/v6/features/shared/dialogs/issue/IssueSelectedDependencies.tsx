import {Separator} from '@enonic/ui';
import {useMemo, type ReactElement} from 'react';
import type {ContentId} from '../../../../../app/content/ContentId';
import type {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import {ContentListItemSelectable} from '../../items';

export type IssueSelectedDependenciesProps = {
    label: string;
    dependants: ContentSummaryAndCompareStatus[];
    excludedDependantIds: ContentId[];
    requiredDependantIds: ContentId[];
    disabled?: boolean;
    loading?: boolean;
    onDependencyChange?: (id: ContentId, included: boolean) => void;
};

const ISSUE_SELECTED_DEPENDENCIES_NAME = 'IssueSelectedDependencies';

export const IssueSelectedDependencies = ({
    label,
    dependants,
    excludedDependantIds,
    requiredDependantIds,
    disabled = false,
    loading = false,
    onDependencyChange,
}: IssueSelectedDependenciesProps): ReactElement => {
    const excludedSet = useMemo(
        () => new Set(excludedDependantIds.map(id => id.toString())),
        [excludedDependantIds],
    );
    const requiredSet = useMemo(
        () => new Set(requiredDependantIds.map(id => id.toString())),
        [requiredDependantIds],
    );
    const isReadOnly = disabled || loading;

    return (
        <div className='flex flex-col gap-7.5'>
            <Separator className='pr-1' label={label} />
            <ul className='flex flex-col gap-1.5'>
                {dependants.map(item => {
                    const id = item.getContentId();
                    const isRequired = requiredSet.has(id.toString());
                    const isIncluded = !excludedSet.has(id.toString());

                    // ! It's okay to use Diff status here, since it will be replaced with SplitList in the future
                    return (
                        <ContentListItemSelectable
                            key={item.getId()}
                            content={item}
                            checked={isIncluded}
                            readOnly={isRequired || isReadOnly}
                            onCheckedChange={(checked: boolean) => onDependencyChange?.(id, checked)}
                        />
                    );
                })}
            </ul>
        </div>
    );
};

IssueSelectedDependencies.displayName = ISSUE_SELECTED_DEPENDENCIES_NAME;
