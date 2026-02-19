import {type PropertyPath} from '@enonic/lib-admin-ui/data/PropertyPath';
import {type Input} from '@enonic/lib-admin-ui/form/Input';
import {useStore} from '@nanostores/preact';
import {type ReactElement} from 'react';
import {toPathKey} from '../../../utils/cms/property/path';
import {useFormData} from './FormDataContext';
import {TextAreaInput} from './TextAreaInput';
import {TextLineInput} from './TextLineInput';

export type FormInputFactoryProps = {
    input: Input;
    path?: PropertyPath;
};

export const FormInputFactory = ({input, path}: FormInputFactoryProps): ReactElement => {
    const inputType = input.getInputType().toString();

    if (inputType === 'TextLine' && path) {
        return <TextLineInput path={path} />;
    }

    if (inputType === 'TextArea' && path) {
        return <TextAreaInput path={path} />;
    }

    return <UnsupportedInputFallback inputType={inputType} path={path} />;
};

FormInputFactory.displayName = 'FormInputFactory';

type UnsupportedInputFallbackProps = {
    inputType: string;
    path?: PropertyPath;
};

const UnsupportedInputFallback = ({inputType, path}: UnsupportedInputFallbackProps): ReactElement => {
    const pathKey = path ? toPathKey(path) : '';
    const {$validation} = useFormData();
    const validationMap = useStore($validation, {keys: pathKey ? [pathKey] : []});
    const errors = pathKey ? validationMap[pathKey] ?? [] : [];

    return (
        <div
            className="flex flex-col gap-1 rounded border border-dashed border-bdr-subtle p-3"
            data-input-type={inputType}
        >
            <span className="text-xs text-subtle">
                [{inputType}] — not yet implemented
            </span>
            {errors.length > 0 && (
                <ul className="text-xs text-destructive">
                    {errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
            )}
        </div>
    );
};

UnsupportedInputFallback.displayName = 'UnsupportedInputFallback';
