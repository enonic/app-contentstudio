import {Bucket} from '@enonic/lib-admin-ui/aggregation/Bucket';
import {BucketAggregation} from '@enonic/lib-admin-ui/aggregation/BucketAggregation';
import {Checkbox, cn, Combobox, Listbox, useControlledState} from '@enonic/ui';
import {ReactElement, useCallback, useMemo, useState} from 'react';
import {useI18n} from '../hooks/useI18n';
import {toSafeKey} from '../util/filter';

export type FilterableBucketAggregationProps = {
    aggregation: BucketAggregation;
    value?: string;
    onChange?: (value: string) => void;
    selection?: Bucket[];
    onSelectionChange?: (selection: Bucket[]) => void;
    idsToKeepOnTop?: string[];
}

export const FilterableBucketAggregation = ({
                                                  aggregation,
                                                  selection,
                                                  value,
                                                  onChange,
                                                  onSelectionChange,
                                                  idsToKeepOnTop,
                                              }: FilterableBucketAggregationProps): ReactElement => {
    const [inputValue, setInputValue] = useControlledState(value, '', onChange);

    const [selectionState, setSelectionState] = useControlledState(selection, [], onSelectionChange);
    const isSelected = (bucket: Bucket) => selectionState.some(b => b.getKey() === bucket.getKey());

    const toLabel = useCallback((bucket: Bucket) => {
        return `${bucket.getDisplayName() ?? bucket.getKey()} (${bucket.getDocCount()})`;
    }, []);


    const buckets = useMemo(
        () => aggregation.getBuckets().filter(b => b.getDocCount() > 0),
        [aggregation]
    );

    const filteredBuckets = useMemo(() => {
        const val: string = inputValue.toLowerCase();
        return buckets.filter(bucket => bucket.getKey().toLowerCase().indexOf(val) >= 0 ||
                                        bucket.getDisplayName()?.toLowerCase().indexOf(val) >= 0);
    }, [buckets, inputValue]);

    const listboxSelection = useMemo(
        () => selectionState.map(b => toSafeKey(b.getKey())),
        [selectionState]
    );

    const onListboxSelectionChange = useCallback(
        (selectedKeys: string[]) => {
            const selectedBuckets = buckets.filter(b => selectedKeys.includes(toSafeKey(b.getKey())));
            setSelectionState(selectedBuckets);
        },
        [buckets, setSelectionState]
    );

    const bucketsToShowOnTop = useMemo(() => {
        if (!idsToKeepOnTop || idsToKeepOnTop.length === 0) {
            return [];
        }
        return buckets.filter(b => idsToKeepOnTop.includes(b.getKey()));
    }, [buckets, idsToKeepOnTop]);

    const topBuckets = useMemo(() => {
        const result = new Map<string, Bucket>();
        bucketsToShowOnTop.forEach(b => result.set(b.getKey(), b));
        selection.forEach(b => {
            if (!result.has(b.getKey())) {
                result.set(b.getKey(), b);
            }
        });

        return Array.from(result.values());
    }, [bucketsToShowOnTop, selection]);

    const toggleTopBucket = useCallback(
        (bucket: Bucket) => {
            const isBucketSelected = isSelected(bucket);
            let newSelection: Bucket[];
            if (isBucketSelected) {
                newSelection = selection.filter(b => b.getKey() !== bucket.getKey());
            } else {
                newSelection = [...selection, bucket];
            }
            onSelectionChange(newSelection);
        },
        [selection, onSelectionChange]
    );

    const displayName = useMemo(() => useI18n(`field.${aggregation.getName()}`), [aggregation]);

    return (
        <div className='relative'>
            <div className={'font-semibold mb-2'}>{displayName}</div>
            {topBuckets.map((bucket) => {
                const safeKey = `${aggregation.getName()}-${toSafeKey(bucket.getKey())}-top`;

                return(
                    <Checkbox
                        id={safeKey}
                        key={safeKey}
                        className={'mb-2'}
                        checked={isSelected(bucket)}
                        onClick={() => toggleTopBucket(bucket)}
                        label={toLabel(bucket)}
                    />
                )
            })}
            <Combobox.Root value={inputValue} onChange={setInputValue} selectionMode={'multiple'} onSelectionChange={onListboxSelectionChange} selection={listboxSelection}>
                <Combobox.Content>
                    <Combobox.Control>
                        <Combobox.Input placeholder='Search'/>
                        <Combobox.Toggle/>
                    </Combobox.Control>

                    <Combobox.Popup>
                        <Listbox.Content>
                            {filteredBuckets.map((bucket) => {
                                const safeKey = `${aggregation.getName()}-${toSafeKey(bucket.getKey())}-list-item`;
                                const isBucketSelected = isSelected(bucket);

                                return (
                                    <Listbox.Item key={safeKey} value={toSafeKey(bucket.getKey())} className={cn('h-9',isBucketSelected && 'group')} data-tone={isBucketSelected ? 'inverse' : ''} >
                                        <Checkbox
                                            id={safeKey}
                                            checked={isBucketSelected}
                                            onClick={e => { // listbox will handle selection
                                                e.stopPropagation();
                                                e.preventDefault();
                                            }}
                                            label={toLabel(bucket)}
                                            tabIndex={-1}
                                        />
                                    </Listbox.Item>
                                );
                            })}
                        </Listbox.Content>
                    </Combobox.Popup>
                </Combobox.Content>
            </Combobox.Root>
        </div>
    );
};
