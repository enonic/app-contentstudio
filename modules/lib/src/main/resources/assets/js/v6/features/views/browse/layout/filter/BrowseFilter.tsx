import {AggregationSelection} from '@enonic/lib-admin-ui/aggregation/AggregationSelection';
import {type Bucket} from '@enonic/lib-admin-ui/aggregation/Bucket';
import {type BucketAggregation} from '@enonic/lib-admin-ui/aggregation/BucketAggregation';
import {Button, SearchField} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {Download} from 'lucide-react';
import {useEffect, useMemo, useRef} from 'react';
import {
    $contentFilterState,
    $isContentFilterDirty,
    $isContentFilterOpen,
    resetContentFilter,
    setContentFilterSelection,
    setContentFilterValue
} from '../../../../store/contentFilter.store';
import {StaticBucketAggregation} from '../../../../shared/buckets/StaticBucketAggregation';
import {FilterableBucketAggregation} from '../../../../shared/buckets/FilterableBucketAggregation';
import {useI18n} from '../../../../hooks/useI18n';
import {LegacyElement} from '../../../../shared/LegacyElement';

export type BrowseFilterProps = {
    hits?: number;
    bucketAggregations: BucketAggregation[];
    filterableAggregations?: {
        name: string;
        idsToKeepOnTop?: string[];
    }[];
    exportOptions?: {
        label?: string;
        action: () => void;
    }
};

export const BrowseFilter = ({
    hits = 0,
    bucketAggregations,
    filterableAggregations,
    exportOptions,
}: BrowseFilterProps): React.ReactElement => {
    const {value, selection} = useStore($contentFilterState);
    const isFilterDirty = useStore($isContentFilterDirty);
    const isOpen = useStore($isContentFilterOpen);

    const inputRef = useRef<HTMLInputElement>(null);

    const searchPlaceholder = useI18n('field.option.placeholder');
    const searchLabel = useI18n('panel.filter.search');
    const clearLabel = useI18n('panel.filter.clear');
    const exportFallbackLabel = useI18n('action.export');
    const resultsLabel = useI18n('field.search.results', hits);

    const exportAction = exportOptions?.action;
    const exportLabel = exportOptions?.label ?? exportFallbackLabel;

    const nonEmptyAggregations = useMemo(
        () => bucketAggregations.filter(ba => ba.getBuckets().some(b => b.getDocCount() > 0)),
        [bucketAggregations]
    );

    const getBucketSelection = (ba: BucketAggregation) => selection.find(s => s.getName() === ba.getName())?.getSelectedBuckets() ?? [];
    const onBucketSelectionChange = (aggregationName: string, buckets: Bucket[]) => {
        const newSelection = selection.filter(s => s.getName() !== aggregationName);

        if (buckets.length > 0) {
            const newAggregationSelection = new AggregationSelection(aggregationName);
            newAggregationSelection.setValues(buckets);
            newSelection.push(newAggregationSelection);
        }

        setContentFilterSelection(newSelection);
    }

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    return (
        <div className='bg-surface-neutral'>
            <div className='flex justify-between items-center gap-2.5 mb-2 min-h-9'>
                <h3 className='font-semibold'>{searchLabel}</h3>
                {isFilterDirty && (
                    <Button
                        size='sm'
                        variant='text'
                        label={clearLabel}
                        className='underline underline-offset-4'
                        onClick={resetContentFilter}
                    />
                )}
            </div>

            <SearchField.Root className='h-11.5' id='SearchInput' placeholder={searchPlaceholder} value={value} onChange={setContentFilterValue}>
                <SearchField.Input ref={inputRef}/>
                <SearchField.Clear />
            </SearchField.Root>

            <div className='flex mt-2 mb-7.5 items-center'>
                <div className='grow'>
                    <span className='text-lg pl-4.5 pr-4.5'>{resultsLabel}</span>
                </div>
                {
                    exportAction && hits > 0 &&
                    <Button size='sm' label={exportLabel} variant='outline' endIcon={Download} onClick={exportAction} />
                }
            </div>
            <div className='flex flex-col gap-7.5'>
                {nonEmptyAggregations.map((ba) => {
                    const safeKey = ba.getName();
                    const filterableOptions = filterableAggregations?.find(fa => fa.name === ba.getName());
                    const selection = getBucketSelection(ba);
                    const onSelectionChange = (bucketSel: Bucket[]) => onBucketSelectionChange(ba.getName(), bucketSel);

                    return (
                        filterableOptions ?
                            <FilterableBucketAggregation
                                key={safeKey}
                                selection={selection}
                                idsToKeepOnTop={filterableOptions.idsToKeepOnTop}
                                onSelectionChange={onSelectionChange}
                                aggregation={ba} /> :
                            <StaticBucketAggregation
                                key={safeKey}
                                selection={selection}
                                onSelectionChange={onSelectionChange}
                                aggregation={ba}
                            />
                    );
                })}
            </div>
        </div>
    );
}

BrowseFilter.displayName = 'BrowseFilter';

export class BrowseFilterElement
    extends LegacyElement<typeof BrowseFilter, BrowseFilterProps> {

    constructor(props: BrowseFilterProps) {
        super(props, BrowseFilter);
    }

    updateAggregations(aggregations: BucketAggregation[]): void {
        this.props.setKey('bucketAggregations', aggregations);
    }

    updateHitsCounter(hits: number): void {
        this.props.setKey('hits', hits);
    }
}
