import {type ReactElement} from 'react';
import {type SelfManagedComponentProps} from '@enonic/lib-admin-ui/form2';
import {type ImageUploaderConfig} from './ImageUploaderConfig';
import {ImageUploaderProvider} from './ImageUploaderContext';
import {ImageUploaderInputImage} from './ImageUploaderInputImage';
import {ImageUploaderInputControls} from './ImageUploaderInputControls';

const IMAGE_UPLOADER_INPUT_NAME = 'ImageUploaderInput';

export const ImageUploaderInput = ({values, enabled}: SelfManagedComponentProps<ImageUploaderConfig>): ReactElement | null => {
    if (values.length === 0) return null;

    return (
        <div data-component={IMAGE_UPLOADER_INPUT_NAME} className="flex flex-col flex-1 min-h-0">
            <ImageUploaderProvider values={values} enabled={enabled}>
                <ImageUploaderInputControls />
                <ImageUploaderInputImage />
            </ImageUploaderProvider>
        </div>
    );
};

ImageUploaderInput.displayName = IMAGE_UPLOADER_INPUT_NAME;
