import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import type {FormItemSet} from '@enonic/lib-admin-ui/form/set/itemset/FormItemSet';
import {useI18n, usePropertySetArray, useSetOccurrenceManager, useValidationVisibility} from '@enonic/lib-admin-ui/form2';
import {SortableGridList} from '@enonic/lib-admin-ui/form2/components/sortable-grid-list';
import {type ReactElement, useCallback, useMemo, useState} from 'react';
import {FormItemRenderer} from './FormItemRenderer';
import {useFormRender} from './FormRenderContext';
import {SetAddButton, SetHeader, SetOccurrenceView, useSetPropertyArray} from './set-occurrence';

type ItemSetViewProps = {
    itemSet: FormItemSet;
    propertySet: PropertySet;
};

export const ItemSetView = ({itemSet, propertySet}: ItemSetViewProps): ReactElement => {
    const name = itemSet.getName();
    const label = itemSet.getLabel();
    const occurrences = itemSet.getOccurrences();
    const formItems = useMemo(() => itemSet.getFormItems(), [itemSet]);
    const t = useI18n();
    const {enabled} = useFormRender();
    const visibility = useValidationVisibility();
    const [interacted, setInteracted] = useState(false);

    const propertyArray = useSetPropertyArray(name, propertySet, occurrences);
    const {propertySets} = usePropertySetArray(propertyArray);
    const {state, remove, move} = useSetOccurrenceManager(occurrences, propertySets);

    const showErrors = visibility === 'all' || (visibility === 'interactive' && interacted);

    const occurrenceError = useMemo(() => {
        if (!showErrors) return undefined;
        const min = occurrences.getMinimum();
        const max = occurrences.getMaximum();

        if (state.isMinimumBreached) {
            return min === 1 ? t('field.value.required') : t('field.occurrence.breaks.min', min);
        }
        if (state.isMaximumBreached) {
            return max === 1 ? t('field.occurrence.breaks.max.one') : t('field.occurrence.breaks.max.many', max);
        }
        return undefined;
    }, [showErrors, state.isMinimumBreached, state.isMaximumBreached, occurrences, t]);

    // Skip add() — it only pushes an ID without a PropertySet, so the subsequent
    // syncPropertySets() generates a second ID on reconciliation, causing a key
    // change and remount. Guard with state.canAdd and let addSet() + sync handle IDs.
    const handleAdd = useCallback(() => {
        setInteracted(true);
        if (!state.canAdd) return;
        propertyArray.addSet();
    }, [state.canAdd, propertyArray]);

    const handleRemove = useCallback((index: number) => {
        setInteracted(true);
        if (remove(index)) {
            propertyArray.remove(index);
        }
    }, [remove, propertyArray]);

    const handleMove = useCallback((fromIndex: number, toIndex: number) => {
        if (move(fromIndex, toIndex)) {
            propertyArray.move(fromIndex, toIndex);
        }
    }, [move, propertyArray]);

    const isMultiple = occurrences.multiple();
    const showAddButton = enabled && state.canAdd;

    return (
        <div className="flex flex-col gap-3" data-component="ItemSetView">
            <SetHeader label={label} occurrences={occurrences} occurrenceError={occurrenceError} />
            {state.count > 0 && isMultiple && (
                <SortableGridList
                    items={propertySets}
                    keyExtractor={(_: PropertySet, i: number) => state.ids[i]}
                    onMove={handleMove}
                    enabled={enabled && state.count > 1}
                    dragLabel={t('field.occurrence.action.reorder')}
                    className="flex flex-col gap-2.5"
                    renderItem={({item, index}) => (
                        <SetOccurrenceView
                            index={index}
                            canRemove={enabled && state.canRemove}
                            onRemove={handleRemove}
                        >
                            {formItems.map(formItem => (
                                <FormItemRenderer
                                    key={formItem.getName()}
                                    formItem={formItem}
                                    propertySet={item}
                                />
                            ))}
                        </SetOccurrenceView>
                    )}
                />
            )}
            {state.count > 0 && !isMultiple && (
                <div className="flex flex-col gap-2.5">
                    {propertySets.map((ps, index) => (
                        <div key={state.ids[index]} className="flex flex-col gap-7.5 border-l border-bdr-soft pl-5">
                            {formItems.map(formItem => (
                                <FormItemRenderer
                                    key={formItem.getName()}
                                    formItem={formItem}
                                    propertySet={ps}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            )}
            {showAddButton && (
                <SetAddButton label={t('action.add')} onClick={handleAdd} disabled={!state.canAdd} />
            )}
        </div>
    );
};

ItemSetView.displayName = 'ItemSetView';
