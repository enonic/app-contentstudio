import {AggregationSelection} from '@enonic/lib-admin-ui/aggregation/AggregationSelection';
import {Bucket} from '@enonic/lib-admin-ui/aggregation/Bucket';
import {BucketAggregation} from '@enonic/lib-admin-ui/aggregation/BucketAggregation';
import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {Button, SearchField} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {Download} from 'lucide-react';
import {useMemo} from 'react';
import {$contentFilterState, setContentFilterSelection, setContentFilterValue} from '../../../v6/features/store/contentFilter.store';
import {StaticBucketAggregation} from './StaticBucketAggregation';
import {FilterableBucketAggregation} from './FilterableBucketAggregation';
import {useI18n} from '../hooks/useI18n';

export type ContentBrowseFilterProps = {
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

export const ContentBrowseFilter = ({
    hits = 0,
    bucketAggregations,
    filterableAggregations,
    exportOptions,
}: ContentBrowseFilterProps): React.ReactElement => {
    const searchPlaceholder = useI18n('field.search.placeholder');

    const exportAction = exportOptions?.action;
    const exportLabel = exportOptions?.label || useI18n('action.export');

    const nonEmptyAggregations = useMemo(
        () => bucketAggregations.filter(ba => ba.getBuckets().some(b => b.getDocCount() > 0)),
        [bucketAggregations]
    );
    const {value, selection} = useStore($contentFilterState);

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

    return (
        <div className='bg-surface-neutral'>
            <SearchField.Root className='h-11.5' id='SearchInput' placeholder={searchPlaceholder} value={value} onChange={setContentFilterValue}>
                <SearchField.Icon />
                <SearchField.Input />
                <SearchField.Clear />
            </SearchField.Root>

            <div className='flex mt-2 mb-7.5 items-center'>
                <div className='grow'>
                    <span className='text-lg pl-4.5 pr-4.5'>{useI18n('field.search.results', hits)}</span>
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
                            aggregation={ba}/> :
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

export class ContentBrowseFilterElement
    extends LegacyElement<typeof ContentBrowseFilter, ContentBrowseFilterProps> {

    constructor(props: ContentBrowseFilterProps) {
        super(props, ContentBrowseFilter);
    }

    updateAggregations(aggregations: BucketAggregation[]): void {
        this.props.setKey('bucketAggregations', aggregations);
    }

    updateHitsCounter(hits: number): void {
        this.props.setKey('hits', hits);
    }
}
