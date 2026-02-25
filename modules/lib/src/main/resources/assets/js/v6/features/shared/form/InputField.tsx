import type {Input} from '@enonic/lib-admin-ui/form/Input';
import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {ComponentRegistry, UnsupportedInput, useInputTypeDescriptor} from '@enonic/lib-admin-ui/form2';
import {type ComponentType, type ReactElement} from 'react';
import {ResolvedInputField} from './ResolvedInputField';

type InputFieldProps = {
    input: Input;
    propertySet: PropertySet;
};

const UnsupportedFallback = UnsupportedInput as ComponentType<{input: Input}>;

export const InputField = ({input, propertySet}: InputFieldProps): ReactElement => {
    const resolved = useInputTypeDescriptor(input);
    const Component = ComponentRegistry.get(input.getInputType().getName());

    const inputLabel = input.getLabel();

    if (!resolved || !Component) {
        return (
            <div className="flex flex-col gap-2">
                {inputLabel && (
                    <span className="text-base font-semibold">{inputLabel}</span>
                )}
                <UnsupportedFallback input={input} />
            </div>
        );
    }

    return (
        <ResolvedInputField
            input={input}
            propertySet={propertySet}
            descriptor={resolved.descriptor}
            config={resolved.config}
            Component={Component}
        />
    );
};

InputField.displayName = 'InputField';
