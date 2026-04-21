import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import type {FormItemSet} from '@enonic/lib-admin-ui/form/set/itemset/FormItemSet';
import {
    usePropertySetArray,
    useSetOccurrenceManager,
    useValidationVisibility,
    ValidationVisibilityProvider,
} from '@enonic/lib-admin-ui/form2';
import {SortableList} from '@enonic/lib-admin-ui/form2/components/sortable-list';
import {type ReactElement, useCallback, useMemo} from 'react';
import {FormItemRenderer} from '../../FormItemRenderer';
import {useFormRender} from '../../FormRenderContext';
import {SetHeader, usePropertySetKeys, useSetExpanded, useSetPropertyArray} from '../set-occurrence';
import {ItemSetOccurrenceView} from './ItemSetOccurrenceView';
import {useItemSetChildErrors, useOccurrenceError, useSetChildShowErrors} from '../set-errors';
import {useI18n} from '../../../../hooks/useI18n';
import {Button} from '@enonic/ui';
import {Plus} from 'lucide-react';

type ItemSetViewProps = {
    itemSet: FormItemSet;
    propertySet: PropertySet;
};

const ITEM_SET_VIEW_NAME = 'ItemSetView';

export const ItemSetView = ({itemSet, propertySet}: ItemSetViewProps): ReactElement => {
    const name = itemSet.getName();
    const label = itemSet.getLabel();
    const helpText = itemSet.getHelpText();
    const occurrences = itemSet.getOccurrences();
    const formItems = useMemo(() => itemSet.getFormItems(), [itemSet]);
    const {enabled} = useFormRender();
    const validationVisibility = useValidationVisibility();
    const propertyArray = useSetPropertyArray(name, propertySet, occurrences);
    const {propertySets} = usePropertySetArray(propertyArray);
    const propertySetKeys = usePropertySetKeys(propertySets);
    const {state, remove, move} = useSetOccurrenceManager(occurrences, propertySets);
    const {expanded, isAllExpanded, handleExpandAll, handleCollapseAll, handleDragStart, handleToggleSingle} = useSetExpanded(
        propertyArray,
        state.count
    );

    const addLabel = useI18n('action.add');
    const dragLabel = useI18n('field.occurrence.action.reorder');

    const showOccurrenceError = validationVisibility !== 'none';
    const occurrenceError = useOccurrenceError(occurrences, state);
    const {childShowErrors, childValidationVisibility} = useSetChildShowErrors(propertyArray, propertySets);
    const childErrors = useItemSetChildErrors(formItems, propertySets);

    const handleAdd = useCallback(() => {
        if (!state.canAdd) return;

        propertyArray.addSet();
    }, [state.canAdd, propertyArray]);
    const handleAddAbove = useCallback(
        (index: number) => {
            if (!state.canAdd) return;

            propertyArray.addSet();
            propertyArray.move(propertyArray.getSize() - 1, index);
        },
        [state.canAdd, propertyArray]
    );
    const handleAddBelow = useCallback(
        (index: number) => {
            if (!state.canAdd) return;

            propertyArray.addSet();
            propertyArray.move(propertyArray.getSize() - 1, index + 1);
        },
        [state.canAdd, propertyArray]
    );
    const handleRemove = useCallback(
        (index: number) => {
            if (!state.canRemove) return;

            if (remove(index)) {
                propertyArray.remove(index);
            }
        },
        [state.canRemove, remove, propertyArray]
    );
    const handleMove = useCallback(
        (fromIndex: number, toIndex: number) => {
            if (move(fromIndex, toIndex)) {
                propertyArray.move(fromIndex, toIndex);
            }
        },
        [move, propertyArray]
    );

    return (
        <div className="flex flex-col gap-3" data-component={ITEM_SET_VIEW_NAME}>
            <SetHeader
                label={label}
                description={helpText}
                isAllExpanded={isAllExpanded}
                showToggle={state.count > 1}
                onExpandAll={handleExpandAll}
                onCollapseAll={handleCollapseAll}
                occurrences={occurrences}
                occurrenceError={showOccurrenceError ? occurrenceError : undefined}
            />
            {state.count > 0 && (
                <SortableList
                    items={propertySets}
                    keyExtractor={(_: PropertySet, i: number) => propertySetKeys[i]}
                    onMove={handleMove}
                    enabled={enabled && state.count > 1}
                    dragLabel={dragLabel}
                    className="flex flex-col gap-2.5"
                    onDragStart={handleDragStart}
                    controlGrip
                    renderItem={({item, index}, grip) => (
                        <ValidationVisibilityProvider visibility={childValidationVisibility.get(index)}>
                            <ItemSetOccurrenceView
                                index={index}
                                grip={grip}
                                propertySet={item}
                                formItems={formItems}
                                fallbackLabel={label}
                                expanded={expanded.get(index)}
                                canAdd={enabled && state.canAdd}
                                canRemove={enabled && state.canRemove}
                                onAddAbove={handleAddAbove}
                                onAddBelow={handleAddBelow}
                                onRemove={handleRemove}
                                onToggle={handleToggleSingle}
                                occurrences={occurrences}
                                hasErrors={childShowErrors.get(index) && childErrors.get(index)}
                            >
                                {formItems.map((formItem) => (
                                    <FormItemRenderer key={formItem.getName()} formItem={formItem} propertySet={item} />
                                ))}
                            </ItemSetOccurrenceView>
                        </ValidationVisibilityProvider>
                    )}
                />
            )}
            {enabled && state.canAdd && (
                <div className="flex justify-end">
                    <Button variant="outline" label={addLabel} endIcon={Plus} onClick={handleAdd} disabled={!state.canAdd} />
                </div>
            )}
        </div>
    );
};

ItemSetView.displayName = 'ItemSetView';
