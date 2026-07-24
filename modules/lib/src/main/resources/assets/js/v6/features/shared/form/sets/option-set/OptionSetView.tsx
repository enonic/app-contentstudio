import { PropertyPath, PropertyPathElement } from '@enonic/lib-admin-ui/data/PropertyPath';
import type { PropertySet } from '@enonic/lib-admin-ui/data/PropertySet';
import type { FormOptionSet } from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import {
    usePropertySetArray,
    useServerErrors,
    useSetOccurrenceManager,
    useValidationVisibility,
    ValidationVisibilityProvider,
} from '@enonic/lib-admin-ui/form2';
import { useI18n } from '../../../../../shared/lib/hooks/useI18n';
import { SortableList } from '@enonic/lib-admin-ui/form2/components/sortable-list';
import { type ReactElement, useCallback, useMemo, useRef, useState } from 'react';
import { OptionSetOccurrenceBody } from './occurrence-body';
import { OptionSetOccurrenceView } from './OptionSetOccurrenceView';
import { seedOptionSetDefaults } from './seedOptionSetDefaults';
import { selectOptionInPropertySet } from './useOptionSetSelection';
import { useFormRender } from '../../FormRenderContext';
import {
    SetHeader,
    usePropertySetKeys,
    useScrollPanelToOccurrence,
    useSetExpanded,
    useSetPropertyArray,
} from '../set-occurrence';
import { OptionSetConfirmAdd, SetConfirmOverlay, useConfirmPosition } from '../set-confirmation';
import { useOccurrenceError, useOptionSetChildErrors, useSetChildShowErrors } from '../set-errors';
import { Button } from '@enonic/ui';
import { Plus } from 'lucide-react';

type OptionSetViewProps = {
    optionSet: FormOptionSet;
    propertySet: PropertySet;
};

const OPTION_SET_VIEW_NAME = 'OptionSetView';

export const OptionSetView = ({ optionSet, propertySet }: OptionSetViewProps): ReactElement => {
    const name = optionSet.getName();
    const label = optionSet.getLabel();
    const helpText = optionSet.getHelpText();
    const occurrences = optionSet.getOccurrences();

    const anchorRef = useRef<HTMLDivElement>(null);
    const confirmationRef = useRef<HTMLDivElement>(null);
    const [confirmingAdd, setConfirmingAdd] = useState(false);
    const confirmationPosition = useConfirmPosition({
        enabled: confirmingAdd,
        anchorRef,
        confirmationRef,
    });

    const formItems = useMemo(() => optionSet.getFormItems(), [optionSet]);

    const { enabled } = useFormRender();
    const validationVisibility = useValidationVisibility();
    const seedDefaults = useCallback((ps: PropertySet) => seedOptionSetDefaults(optionSet, ps), [optionSet]);
    const isRadio = optionSet.isRadioSelection();
    const isLockedSingle = occurrences.getMinimum() === 1 && occurrences.getMaximum() === 1;
    const propertyArray = useSetPropertyArray(name, propertySet, occurrences, {
        onCreateOccurrence: seedDefaults,
        seedMin: !isRadio || isLockedSingle,
    });
    const { propertySets } = usePropertySetArray(propertyArray);
    const propertySetKeys = usePropertySetKeys(propertySets);
    const { state, remove, move } = useSetOccurrenceManager(occurrences, propertySets);
    const serverErrors = useServerErrors();
    const { setOccurrenceRef, scheduleScrollTo } = useScrollPanelToOccurrence(propertySets);
    const lastAddedIndexRef = useRef<number | null>(null);

    // Structural occurrence changes (add/remove/move/reset) shift set positions, so
    // the positional server errors under this set no longer align — drop them all
    // (re-validated on the next save). Plain edits clear per-occurrence elsewhere.
    const clearSetServerErrors = useCallback(() => {
        const path = PropertyPath.fromParent(
            propertySet.getPropertyPath(),
            new PropertyPathElement(name, 0),
        ).toString();
        serverErrors?.clearField(path.startsWith('.') ? path.slice(1) : path);
    }, [serverErrors, propertySet, name]);
    const { expanded, isAllExpanded, handleExpandAll, handleCollapseAll, handleDragStart, handleToggleSingle } =
        useSetExpanded(propertyArray, state.count);

    const addLabel = useI18n('action.add');
    const dragLabel = useI18n('field.occurrence.action.reorder');

    const occurrenceError = useOccurrenceError(occurrences, state);
    const { childShowErrors, childValidationVisibility, setInteracted } = useSetChildShowErrors(
        propertyArray,
        propertySets,
    );
    const childErrors = useOptionSetChildErrors(optionSet, propertySets);

    const handleAdd = useCallback(() => {
        if (!state.canAdd) return;

        if (!isRadio) {
            const index = propertyArray.getSize();
            lastAddedIndexRef.current = index;
            const newSet = propertyArray.addSet();
            seedDefaults(newSet);
            scheduleScrollTo(index);
            clearSetServerErrors();
            return;
        }

        setConfirmingAdd(true);
    }, [isRadio, state.canAdd, propertyArray, seedDefaults, scheduleScrollTo, clearSetServerErrors]);
    const handleConfirmAdd = useCallback(
        (selectedName: string) => {
            setConfirmingAdd(false);

            if (!state.canAdd) return;

            const index = propertyArray.getSize();
            lastAddedIndexRef.current = index;
            const newSet = propertyArray.addSet();
            selectOptionInPropertySet(newSet, optionSet, selectedName);
            scheduleScrollTo(index);
            clearSetServerErrors();
        },
        [state.canAdd, propertyArray, optionSet, scheduleScrollTo, clearSetServerErrors],
    );
    const handleCancelAdd = useCallback(() => {
        setConfirmingAdd(false);
    }, []);
    const handleAddAbove = useCallback(
        (index: number, selectedName?: string) => {
            if (!state.canAdd) return;

            lastAddedIndexRef.current = index;
            const newSet = propertyArray.addSet();
            propertyArray.move(propertyArray.getSize() - 1, index);
            if (selectedName != null) {
                selectOptionInPropertySet(newSet, optionSet, selectedName);
            } else {
                seedDefaults(newSet);
            }
            scheduleScrollTo(index);
            clearSetServerErrors();
        },
        [state.canAdd, propertyArray, optionSet, seedDefaults, scheduleScrollTo, clearSetServerErrors],
    );
    const handleAddBelow = useCallback(
        (index: number, selectedName?: string) => {
            if (!state.canAdd) return;

            lastAddedIndexRef.current = index + 1;
            const newSet = propertyArray.addSet();
            propertyArray.move(propertyArray.getSize() - 1, index + 1);
            if (selectedName != null) {
                selectOptionInPropertySet(newSet, optionSet, selectedName);
            } else {
                seedDefaults(newSet);
            }
            scheduleScrollTo(index + 1);
            clearSetServerErrors();
        },
        [state.canAdd, propertyArray, optionSet, seedDefaults, scheduleScrollTo, clearSetServerErrors],
    );
    const handleRemove = useCallback(
        (index: number) => {
            if (!state.canRemove) return;

            if (remove(index)) {
                propertyArray.remove(index);
                clearSetServerErrors();
            }
        },
        [state.canRemove, remove, propertyArray, clearSetServerErrors],
    );
    const handleReset = useCallback(
        (index: number) => {
            const ps = propertySets[index];
            if (ps == null) return;
            const arr = ps.getPropertyArray('_selected');
            if (arr != null) {
                for (let i = arr.getSize() - 1; i >= 0; i--) {
                    arr.remove(i);
                }
            }
            for (const option of optionSet.getOptions()) {
                ps.removeProperty(option.getName(), 0);
            }
            clearSetServerErrors();
        },
        [propertySets, optionSet, clearSetServerErrors],
    );
    const handleMove = useCallback(
        (fromIndex: number, toIndex: number) => {
            if (move(fromIndex, toIndex)) {
                propertyArray.move(fromIndex, toIndex);
                clearSetServerErrors();
            }
        },
        [move, propertyArray, clearSetServerErrors],
    );

    return (
        <div className="flex flex-col gap-3" data-component={OPTION_SET_VIEW_NAME} data-confirming={confirmingAdd}>
            {confirmingAdd && <SetConfirmOverlay />}

            {confirmingAdd && (
                <OptionSetConfirmAdd
                    ref={confirmationRef}
                    position={confirmationPosition}
                    optionSet={optionSet}
                    onCancel={handleCancelAdd}
                    onConfirm={handleConfirmAdd}
                />
            )}

            <SetHeader
                label={label}
                showToggle={state.count > 1}
                description={helpText}
                isAllExpanded={isAllExpanded}
                onExpandAll={handleExpandAll}
                onCollapseAll={handleCollapseAll}
                occurrences={occurrences}
                occurrenceError={validationVisibility === 'all' || setInteracted ? occurrenceError : undefined}
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
                    renderItem={({ item, index }, grip) => (
                        <ValidationVisibilityProvider visibility={childValidationVisibility.get(index)}>
                            <OptionSetOccurrenceView
                                ref={(node) => setOccurrenceRef(index, node)}
                                index={index}
                                grip={grip}
                                propertySet={item}
                                optionSet={optionSet}
                                formItems={formItems}
                                fallbackLabel={label}
                                expanded={expanded.get(index)}
                                isNew={index === lastAddedIndexRef.current}
                                canAdd={enabled && state.canAdd}
                                canRemove={enabled && state.canRemove}
                                onAddAbove={handleAddAbove}
                                onAddBelow={handleAddBelow}
                                onRemove={handleRemove}
                                onReset={isRadio && !state.canRemove ? handleReset : undefined}
                                onToggle={handleToggleSingle}
                                hasErrors={childShowErrors.get(index) && childErrors.get(index) === true}
                            >
                                <OptionSetOccurrenceBody
                                    optionSet={optionSet}
                                    occurrencePropertySet={item}
                                    enabled={enabled}
                                />
                            </OptionSetOccurrenceView>
                        </ValidationVisibilityProvider>
                    )}
                />
            )}

            {enabled && state.canAdd && (
                <div className="flex justify-end">
                    <Button variant="outline" label={addLabel} endIcon={Plus} onClick={handleAdd} />
                </div>
            )}

            <div ref={anchorRef} className="h-0 w-full" />
        </div>
    );
};

OptionSetView.displayName = OPTION_SET_VIEW_NAME;
