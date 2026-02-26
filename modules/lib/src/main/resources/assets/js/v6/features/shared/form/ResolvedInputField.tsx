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

    // NOTE: This creates empty PropertyArrays on the shared draft PropertyTree for schema inputs
    // that have no data. Any code calling removeProperty on the draft data must guard against
    // empty arrays (getPropertyArray(name)?.getSize() > 0) before removal.
    // Fill-to-minimum logic belongs to Phase 4 (editing support) and does NOT fully solve this
    // because multiple inputs with minimum=0 will still produce empty arrays.
    const propertyArray = useMemo(() => {
        const existing = propertySet.getPropertyArray(input.getName());
        if (existing) {
            return existing;
        }
        const created = PropertyArray.create()
            .setParent(propertySet)
            .setName(input.getName())
            .setType(descriptor.getValueType())
            .build();
        propertySet.addPropertyArray(created);
        return created;
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

    const onChange = useCallback((index: number, value: Value) => {
        occurrence.set(index, value);
    }, [occurrence]);

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
                onAdd={occurrence.add}
                onRemove={occurrence.remove}
                onMove={occurrence.move}
                onChange={onChange}
                config={config}
                input={input}
                enabled={enabled}
            />
        </div>
    );
};

ResolvedInputField.displayName = 'ResolvedInputField';
