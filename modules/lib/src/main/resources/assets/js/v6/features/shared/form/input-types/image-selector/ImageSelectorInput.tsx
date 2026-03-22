import {SelfManagedComponentProps} from '@enonic/lib-admin-ui/form2';
import {ImageSelectorConfig} from './ImageSelectorConfig';
import {ReactElement} from 'react';
import {ImageSelector} from '../../../selectors/image';
import {useSelectorInput} from '../../../../hooks/useSelectorInput';

export const ImageSelectorInput = (props: SelfManagedComponentProps<ImageSelectorConfig>): ReactElement => {
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
            contextContent={contextContent?.getContentSummary()}
            listMode={listMode}
            disabled={disabled}
            closeOnBlur
            withUpload
        />
    );
};

ImageSelectorInput.displayName = 'ImageSelectorInput';
