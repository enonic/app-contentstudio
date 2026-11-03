import type { SelfManagedComponentProps } from '@enonic/input-types';
import type { MediaSelectorConfig } from './MediaSelectorConfig';
import type { ReactElement } from 'react';
import { MediaSelector } from '../../../selectors/media';
import { useFormScopeRequirement } from '../../FormScopeContext';
import { useFormApplicationKey, useSelectorInput } from '../hooks';
import { type ApplicationKey } from '../../../../../shared/lib/cms/application/applicationKey';
import { MEDIA_SELECTOR_SCOPE_REQUIREMENT } from './MediaSelectorDescriptor';

export const MediaSelectorInput = (props: SelfManagedComponentProps<MediaSelectorConfig>): ReactElement => {
    const { enabled: scopeEnabled } = useFormScopeRequirement(props.input, MEDIA_SELECTOR_SCOPE_REQUIREMENT);
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

    const contentTypeNames = props.config.allowContentType;
    const allowedContentPaths = props.config.allowPath;
    const disabled = !props.enabled || !scopeEnabled;
    const canAdd = props.occurrences.getMaximum() === 0 || props.values.length < props.occurrences.getMaximum();

    return (
        <MediaSelector
            selection={selection}
            onSelectionChange={handleSelectionChange}
            canAdd={canAdd}
            selectionMode={selectionMode}
            placeholder={placeholder}
            emptyLabel={emptyLabel}
            error={hasErrors}
            hideToggleIcon={hideToggleIcon}
            contentTypeNames={contentTypeNames}
            allowedContentPaths={allowedContentPaths}
            contextContent={contextContent}
            applicationKey={applicationKey}
            listMode={listMode}
            disabled={disabled}
            withUpload
            closeOnBlur
        />
    );
};

MediaSelectorInput.displayName = 'MediaSelectorInput';
