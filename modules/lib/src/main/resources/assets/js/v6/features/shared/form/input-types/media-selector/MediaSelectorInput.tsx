import type {SelfManagedComponentProps} from '@enonic/lib-admin-ui/form2';
import type {MediaSelectorConfig} from './MediaSelectorConfig';
import type {ReactElement} from 'react';
import {MediaSelector} from '../../../selectors/media';
import {useSelectorInput} from '../../../../hooks/useSelectorInput';
import {useFormRender} from '../../FormRenderContext';

export const MediaSelectorInput = (props: SelfManagedComponentProps<MediaSelectorConfig>): ReactElement => {
    const {applicationKey} = useFormRender();
    const {contextContent, selectionMode, hasErrors, hideToggleIcon, listMode, selection, placeholder, emptyLabel, handleSelectionChange} =
        useSelectorInput(props);

    const contentTypeNames = props.config.allowContentType;
    const allowedContentPaths = props.config.allowPath;
    const disabled = !props.enabled;

    return (
        <MediaSelector
            selection={selection}
            onSelectionChange={handleSelectionChange}
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
