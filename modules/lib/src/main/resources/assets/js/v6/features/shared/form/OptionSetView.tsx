import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import type {FormOptionSet} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import {useI18n, usePropertySetArray, useSetOccurrenceManager, useValidationVisibility} from '@enonic/lib-admin-ui/form2';
import {SortableGridList} from '@enonic/lib-admin-ui/form2/components/sortable-grid-list';
import {type ReactElement, useCallback, useMemo, useState} from 'react';
import {OptionSetOccurrenceView} from './option-set';
import {useFormRender} from './FormRenderContext';
import {SetAddButton, SetHeader, SetOccurrenceView, useSetPropertyArray} from './set-occurrence';

type OptionSetViewProps = {
    optionSet: FormOptionSet;
    propertySet: PropertySet;
};

export const OptionSetView = ({optionSet, propertySet}: OptionSetViewProps): ReactElement => {
    const name = optionSet.getName();
    const label = optionSet.getLabel();
    const occurrences = optionSet.getOccurrences();
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

    // Single-occurrence OptionSet (most common case: 0:1 or 1:1)
    if (!isMultiple) {
        return (
            <div className="flex flex-col gap-3" data-component="OptionSetView">
                <SetHeader label={label} occurrences={occurrences} occurrenceError={occurrenceError} />
                {propertySets.map((ps, index) => (
                    <OptionSetOccurrenceView
                        key={state.ids[index]}
                        optionSet={optionSet}
                        occurrencePropertySet={ps}
                        enabled={enabled}
                    />
                ))}
                {showAddButton && (
                    <SetAddButton label={t('action.add')} onClick={handleAdd} disabled={!state.canAdd} />
                )}
            </div>
        );
    }

    // Multi-occurrence OptionSet (rare but supported)
    return (
        <div className="flex flex-col gap-3" data-component="OptionSetView">
            <SetHeader label={label} occurrences={occurrences} occurrenceError={occurrenceError} />
            {state.count > 0 && (
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
                            <OptionSetOccurrenceView
                                optionSet={optionSet}
                                occurrencePropertySet={item}
                                enabled={enabled}
                            />
                        </SetOccurrenceView>
                    )}
                />
            )}
            {showAddButton && (
                <SetAddButton label={t('action.add')} onClick={handleAdd} disabled={!state.canAdd} />
            )}
        </div>
    );
};

OptionSetView.displayName = 'OptionSetView';
