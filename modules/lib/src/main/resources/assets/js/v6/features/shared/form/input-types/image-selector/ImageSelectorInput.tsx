import type {SelfManagedComponentProps} from '@enonic/lib-admin-ui/form2';
import type {ImageSelectorConfig} from './ImageSelectorConfig';
import type {ReactElement} from 'react';
import {ImageSelector} from '../../../selectors/image';
import {useSelectorInput} from '../hooks';
import {useFormRender} from '../../FormRenderContext';

export const ImageSelectorInput = (props: SelfManagedComponentProps<ImageSelectorConfig>): ReactElement => {
    const {applicationKey} = useFormRender();
    const {contextContent, selectionMode, hasErrors, hideToggleIcon, listMode, selection, placeholder, emptyLabel, handleSelectionChange} =
        useSelectorInput(props);

    const allowedContentPaths = props.config.allowPath;
    const disabled = !props.enabled;

    return (
        <ImageSelector
            selection={selection}
            onSelectionChange={handleSelectionChange}
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
