import {AggregationSelection} from '@enonic/lib-admin-ui/aggregation/AggregationSelection';
import {Bucket} from '@enonic/lib-admin-ui/aggregation/Bucket';
import {BucketAggregation} from '@enonic/lib-admin-ui/aggregation/BucketAggregation';
import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {Button, SearchInput} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {Download} from 'lucide-react';
import {useMemo} from 'react';
import {$contentFilterState, setContentFilterSelection, setContentFilterValue} from '../../../v6/features/store/contentFilter.store';
import {BucketAggregationComponent} from './BucketAggregation';
import {FilterableBucketAggregation} from './FilterableBucketAggregation';

export interface ContentBrowseFilterPanelComponentProps {
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
}

const ContentBrowseFilterPanelComponent = ({
                                               hits = 0,
                                               bucketAggregations,
                                               filterableAggregations,
                                               exportOptions,
                                           }: ContentBrowseFilterPanelComponentProps): React.ReactElement => {
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
            <SearchInput id={`bfc-input-${new Date().getDate()}`} className={'h-11.5'} showSearchIcon={false} value={value}
                         onChange={setContentFilterValue} placeholder='Type to search...'/>
            <div className='flex mt-2 mb-8 items-center'>
                <div className='grow'>
                    <span className='text-lg pl-4.5 pr-4.5'>{hits} hits</span>
                </div>
                {
                    exportOptions && hits > 0 &&
                    <Button onClick={exportOptions.action} size={'sm'} label={exportOptions.label || 'Export'} variant='outline'
                            endIcon={Download}/>
                }
            </div>
            <div className={'flex flex-col gap-7.5'}>
                {nonEmptyAggregations.map((ba) => {
                    const safeKey = ba.getName();
                    const filterableOptions = filterableAggregations?.find(fa => fa.name === ba.getName());

                    return (
                        filterableOptions ?
                        <FilterableBucketAggregation
                            key={safeKey}
                            selection={getBucketSelection(ba)}
                            idsToKeepOnTop={filterableOptions.idsToKeepOnTop}
                            onSelectionChange={(bucketSel) => onBucketSelectionChange(ba.getName(), bucketSel)}
                            aggregation={ba}/> :
                        <BucketAggregationComponent key={safeKey}
                                                    selection={getBucketSelection(ba)}
                                                    onSelectionChange={(bucketSel) => onBucketSelectionChange(ba.getName(), bucketSel)}
                                                    aggregation={ba}/>
                    );
                })}
            </div>
        </div>
    );
}

export class ContentBrowseFilterComponent
    extends LegacyElement<typeof ContentBrowseFilterPanelComponent, ContentBrowseFilterPanelComponentProps> {


    constructor(props: ContentBrowseFilterPanelComponentProps) {
        super(props, ContentBrowseFilterPanelComponent);
    }

    updateAggregations(aggregations: BucketAggregation[]): void {
        this.props.setKey('bucketAggregations', aggregations);
    }

    updateHitsCounter(hits: number): void {
        this.props.setKey('hits', hits);
    }
}
