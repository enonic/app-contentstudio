import {type PropertyPath} from '@enonic/lib-admin-ui/data/PropertyPath';
import {Input as UIInput} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {type ChangeEvent, type ReactElement, useCallback} from 'react';
import {toPathKey} from '../../../utils/cms/property/path';
import {useFormData} from './FormDataContext';

export type TextLineInputProps = {
    path: PropertyPath;
    label?: string;
};

export const TextLineInput = ({path, label}: TextLineInputProps): ReactElement => {
    const pathKey = toPathKey(path);

    const {$draftData, $changedPaths, $validation, getDraftStringByPath, setDraftStringByPath} = useFormData();

    useStore($draftData);
    useStore($changedPaths, {keys: [pathKey]});
    const validationMap = useStore($validation, {keys: [pathKey]});

    const value = getDraftStringByPath(path);
    const error = validationMap[pathKey]?.[0];

    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setDraftStringByPath(path, e.currentTarget.value);
    }, [path, setDraftStringByPath]);

    return <UIInput label={label} error={error} value={value} onChange={handleChange} />;
};

TextLineInput.displayName = 'TextLineInput';
