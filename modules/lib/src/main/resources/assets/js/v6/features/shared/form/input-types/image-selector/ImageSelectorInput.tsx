import type { SelfManagedComponentProps } from '@enonic/input-types';
import type { ImageSelectorConfig } from './ImageSelectorConfig';
import type { ReactElement } from 'react';
import { ImageSelector } from '../../../selectors/image';
import { useFormScopeRequirement } from '../../FormScopeContext';
import { useFormApplicationKey, useSelectorInput } from '../hooks';
import { ApplicationKey } from '@enonic/lib-admin-ui/application/ApplicationKey';

export const ImageSelectorInput = (props: SelfManagedComponentProps<ImageSelectorConfig>): ReactElement => {
    const { enabled: scopeEnabled } = useFormScopeRequirement(props.input, { project: true });
    const applicationKey = useFormApplicationKey();
    const {
        contextContent,
        selectionMode,
        hasErrors,
        hideToggleIcon,
        listMode,
        selection,
        placeholder,
        emptyLabel,
        handleSelectionChange,
    } = useSelectorInput(props);

    const allowedContentPaths = props.config.allowPath;
    const disabled = !props.enabled || !scopeEnabled;
    const canAdd = props.occurrences.getMaximum() === 0 || props.values.length < props.occurrences.getMaximum();

    return (
        <ImageSelector
            selection={selection}
            onSelectionChange={handleSelectionChange}
            canAdd={canAdd}
            selectionMode={selectionMode}
            placeholder={placeholder}
            emptyLabel={emptyLabel}
            error={hasErrors}
            hideToggleIcon={hideToggleIcon}
            allowedContentPaths={allowedContentPaths}
            contextContent={contextContent}
            applicationKey={applicationKey}
            listMode={listMode}
            disabled={disabled}
            closeOnBlur
            withUpload
        />
    );
};

ImageSelectorInput.displayName = 'ImageSelectorInput';
