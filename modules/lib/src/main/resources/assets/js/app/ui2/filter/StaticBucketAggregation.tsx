import {Bucket} from '@enonic/lib-admin-ui/aggregation/Bucket';
import {BucketAggregation} from '@enonic/lib-admin-ui/aggregation/BucketAggregation';
import {Button, Checkbox, CheckboxChecked, useControlledState} from '@enonic/ui';
import {ReactElement, useCallback, useMemo} from 'react';
import {useI18n} from '../hooks/useI18n';
import {toKey} from '../../../v6/features/utils/text';

export type StaticBucketAggregationProps = {
    aggregation: BucketAggregation;
    selection?: Bucket[];
    onSelectionChange?: (selection: Bucket[]) => void;
    showAll?: boolean;
    showMoreLabel?: string;
    showLessLabel?: string;
    maxVisibleBuckets?: number;
}

export const StaticBucketAggregation = ({
    aggregation,
    selection,
    onSelectionChange,
    showAll,
    showMoreLabel = 'Show more',
    showLessLabel = 'Show less',
    maxVisibleBuckets = 5,
}: StaticBucketAggregationProps): ReactElement => {
    const [showAllState, setShowAllState] = useControlledState(showAll, false);
    const handleShowMoreLessClick = () => {
        setShowAllState(!showAllState);
    };

    const [selectionState, setSelectionState] = useControlledState(selection, [], onSelectionChange);
    const isSelected = (bucket: Bucket) => selectionState.some(b => b.getKey() === bucket.getKey());

    const buckets = aggregation.getBuckets().filter((b) => b.getDocCount() > 0);
    const visibleBuckets = showAllState ? buckets : buckets.slice(0, maxVisibleBuckets);
    const hasHiddenBuckets = buckets.length > maxVisibleBuckets;

    const handleSelectionChange = useCallback((bucket: Bucket, checkedState: CheckboxChecked) => {
        const isChecked = checkedState === true;
        const newSelection = isChecked ? [...selectionState, bucket] : selectionState.filter(b => b.getKey() !== bucket.getKey());
        setSelectionState(newSelection);
    }, [selectionState, setSelectionState]);

    const displayName = useMemo(() => useI18n(`field.${aggregation.getName()}`), [aggregation]);

    return (
        <div className='flex flex-col'>
            <h4 className='font-semibold'>{displayName}</h4>
            <div className='flex flex-col gap-2.5 px-2.5 py-2'>
                {visibleBuckets.map(bucket => {
                    const label = `${bucket.getDisplayName() ?? bucket.getKey()} (${bucket.getDocCount()})`;
                    const key = toKey(aggregation.getName(), bucket.getKey());
                    return (
                        <Checkbox
                            key={key}
                            checked={isSelected(bucket)}
                            defaultChecked={false}
                            label={label}
                            onCheckedChange={(checked: CheckboxChecked) => handleSelectionChange(bucket, checked)}
                        />

                    );
                })}
            </div>
            {hasHiddenBuckets && (
                <div className='flex justify-end'>
                    <Button size='sm'
                            variant={'outline'}
                            label={showAllState ? showLessLabel : showMoreLabel}
                            onClick={handleShowMoreLessClick}
                    />
                </div>
                )}
        </div>
    );
};
