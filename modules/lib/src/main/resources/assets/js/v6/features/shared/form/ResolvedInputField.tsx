import {PropertyArray} from '@enonic/lib-admin-ui/data/PropertyArray';
import type {Value} from '@enonic/lib-admin-ui/data/Value';
import type {Input} from '@enonic/lib-admin-ui/form/Input';
import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {OccurrenceList, useOccurrenceManager, usePropertyArray} from '@enonic/lib-admin-ui/form2';
import type {InputTypeComponent} from '@enonic/lib-admin-ui/form2';
import type {InputTypeConfig} from '@enonic/lib-admin-ui/form2/descriptor/InputTypeConfig';
import type {InputTypeDescriptor} from '@enonic/lib-admin-ui/form2/descriptor/InputTypeDescriptor';
import {type ReactElement, useCallback, useEffect, useMemo} from 'react';
import {useFormRender} from './FormRenderContext';

type ResolvedInputFieldProps = {
    input: Input;
    propertySet: PropertySet;
    descriptor: InputTypeDescriptor;
    config: InputTypeConfig;
    Component: InputTypeComponent;
};

export const ResolvedInputField = ({input, propertySet, descriptor, config, Component}: ResolvedInputFieldProps): ReactElement => {
    const {enabled} = useFormRender();

    // NOTE: This creates PropertyArrays on the shared draft PropertyTree for schema inputs
    // that have no data, then fills to minFill with null values. Any code calling
    // removeProperty on the draft data must guard against arrays that contain only nulls.
    // The minFill formula must match useOccurrenceManager (lib-admin-ui).
    const propertyArray = useMemo(() => {
        const existing = propertySet.getPropertyArray(input.getName());
        let array: PropertyArray;
        if (existing) {
            array = existing;
        } else {
            array = PropertyArray.create()
                .setParent(propertySet)
                .setName(input.getName())
                .setType(descriptor.getValueType())
                .build();
            propertySet.addPropertyArray(array);
        }

        // Always show at least 1 input — matches legacy showEmptyFormItemOccurrences().
        const minFill = Math.max(input.getOccurrences().getMinimum(), 1);
        while (array.getSize() < minFill) {
            const before = array.getSize();
            array.add(descriptor.getValueType().newNullValue());
            if (array.getSize() === before) break;
        }
        return array;
    }, [propertySet, input, descriptor]);

    const {values} = usePropertyArray(propertyArray);

    const occurrence = useOccurrenceManager({
        occurrences: input.getOccurrences(),
        descriptor,
        config,
        initialValues: values,
    });

    useEffect(() => {
        occurrence.sync(values);
    }, [values, occurrence]);

    const handleChange = useCallback((index: number, value: Value) => {
        propertyArray.set(index, value);
    }, [propertyArray]);

    const handleAdd = useCallback(() => {
        if (!occurrence.state.canAdd) return;
        propertyArray.add(descriptor.getValueType().newNullValue());
    }, [propertyArray, occurrence.state.canAdd, descriptor]);

    const handleRemove = useCallback((index: number) => {
        if (!occurrence.state.canRemove) return;
        propertyArray.remove(index);
    }, [propertyArray, occurrence.state.canRemove]);

    const handleMove = useCallback((from: number, to: number) => {
        propertyArray.move(from, to);
    }, [propertyArray]);

    const inputLabel = input.getLabel();
    const helpText = input.getHelpText();

    return (
        <div className="flex flex-col gap-2">
            {inputLabel && (
                <span className="text-base font-semibold">{inputLabel}</span>
            )}
            {helpText && (
                <span className="text-xs text-subtle">{helpText}</span>
            )}
            <OccurrenceList.Root
                Component={Component}
                state={occurrence.state}
                onAdd={handleAdd}
                onRemove={handleRemove}
                onMove={handleMove}
                onChange={handleChange}
                config={config}
                input={input}
                enabled={enabled}
            />
        </div>
    );
};

ResolvedInputField.displayName = 'ResolvedInputField';
