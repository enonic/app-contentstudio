import { type ReactElement } from 'react';
import { type SelfManagedComponentProps } from '@enonic/input-types';
import { type ImageUploaderConfig } from './ImageUploaderConfig';
import { ImageUploaderProvider } from './ImageUploaderContext';
import { ImageUploaderInputImage } from './ImageUploaderInputImage';
import { ImageUploaderInputControls } from './ImageUploaderInputControls';
import { useFormScopeRequirement } from '../../FormScopeContext';

const IMAGE_UPLOADER_INPUT_NAME = 'ImageUploaderInput';

export const ImageUploaderInput = ({
    values,
    input,
    enabled,
}: SelfManagedComponentProps<ImageUploaderConfig>): ReactElement | null => {
    const { enabled: scopeEnabled } = useFormScopeRequirement(input, { project: true, content: true });

    if (values.length === 0) return null;

    return (
        <div data-component={IMAGE_UPLOADER_INPUT_NAME} className="flex flex-col flex-1 min-h-0">
            <ImageUploaderProvider values={values} enabled={enabled && scopeEnabled}>
                <ImageUploaderInputControls />
                <ImageUploaderInputImage />
            </ImageUploaderProvider>
        </div>
    );
};

ImageUploaderInput.displayName = IMAGE_UPLOADER_INPUT_NAME;
