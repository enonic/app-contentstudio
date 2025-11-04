import {AggregationSelection} from '@enonic/lib-admin-ui/aggregation/AggregationSelection';
import {Bucket} from '@enonic/lib-admin-ui/aggregation/Bucket';
import {BucketAggregation} from '@enonic/lib-admin-ui/aggregation/BucketAggregation';
import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {Button, SearchInput, useControlledState} from '@enonic/ui';
import {Download} from 'lucide-react';
import {useCallback, useMemo} from 'react';
import {BucketAggregationComponent} from './BucketAggregation';
import {FilterableBucketAggregation} from './FilterableBucketAggregation';

export interface ContentBrowseFilterPanelComponentProps {
    value?: string;
    onChange: (value: string) => void;
    selection?: AggregationSelection[];
    onSelectionChange?: (selection: AggregationSelection[]) => void;
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
                                               value,
                                               onChange,
                                               hits = 0,
                                               selection,
                                               onSelectionChange,
                                               bucketAggregations,
                                               filterableAggregations,
                                               exportOptions,
                                           }: ContentBrowseFilterPanelComponentProps): React.ReactElement => {
    const nonEmptyAggregations = useMemo(
        () => bucketAggregations.filter(ba => ba.getBuckets().some(b => b.getDocCount() > 0)),
        [bucketAggregations]
    );

    const [inputValue, setInputValue] = useControlledState(value, '', onChange);
    const [selectionState, setSelectionState] = useControlledState(selection, [], onSelectionChange);

    const getBucketSelection = useCallback(
        (ba: BucketAggregation) => selectionState.find(s => s.getName() === ba.getName())?.getSelectedBuckets() || [], [selectionState]);
    const onBucketSelectionChange = useCallback((name: string, newBucketSelection: Bucket[]) => {
        const newSelection = selectionState.filter(s => s.getName() !== name);
        if (newBucketSelection.length > 0) {
            const aggrSel = new AggregationSelection(name);
            aggrSel.setValues(newBucketSelection);
            newSelection.push(aggrSel);
        }
        setSelectionState(newSelection);
    }, [selectionState, setSelectionState]);

    return (
        <div className='bg-surface-neutral'>
            <SearchInput id={`bfc-input-${new Date().getDate()}`} className={'h-11.5'} showSearchIcon={false} value={inputValue}
                         onChange={setInputValue} placeholder='Type to search...'/>
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

    private currentValue: string;

    private selection: AggregationSelection[] = [];

    constructor(props: ContentBrowseFilterPanelComponentProps) {
        const {onChange, onSelectionChange, ...rest} = props;

        super({
            onChange: (value: string) => {
                this.currentValue = value;
                props.onChange?.(value);
            },
            onSelectionChange: (selection: AggregationSelection[]) => {
                this.selection = selection;
                props.onSelectionChange?.(selection);
            },
            ...rest,
        }, ContentBrowseFilterPanelComponent);

        this.currentValue = props.value ?? '';
    }

    reset(): void {
        this.props.setKey('value', '');
        this.deselectAll();
    }

    deselectAll(): void {
        this.props.setKey('selection', []);
    }

    updateAggregations(aggregations: BucketAggregation[]): void {
        this.props.setKey('bucketAggregations', aggregations);
    }

    getSelectedBuckets(): AggregationSelection[] {
        return this.selection;
    }

    getValue(): string {
        return this.currentValue;
    }

    hasSelectedBuckets(): boolean {
        return this.selection.length > 0;
    }

    updateHitsCounter(hits: number): void {
        this.props.setKey('hits', hits);
    }

    selectBucketViewByKey(aggregationName: string, bucketKey: string): void {
        const aggregationSelection = this.selection.find(s => s.getName() === aggregationName);

        if (aggregationSelection) {
            const bucket = aggregationSelection.getSelectedBuckets().find(b => b.getKey() === bucketKey);

            if (!bucket) {
                const bucketToSelect = this.props.get().bucketAggregations
                    .find(ba => ba.getName() === aggregationName)?.getBuckets()
                    .find(b => b.getKey() === bucketKey);

                if (bucketToSelect) {
                    aggregationSelection.setValues([...aggregationSelection.getSelectedBuckets(), bucketToSelect]);
                    this.props.setKey('selection', this.selection);
                }
            }
        }
    }
}
