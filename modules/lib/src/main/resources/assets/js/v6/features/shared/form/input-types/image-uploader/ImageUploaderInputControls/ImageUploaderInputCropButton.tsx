import {type ReactElement} from 'react';
import {cn, IconButton, Tooltip} from '@enonic/ui';
import {Crop} from 'lucide-react';
import {useImageUploaderContext} from '../ImageUploaderContext';
import {useI18n} from '../../../../../hooks/useI18n';

export const ImageUploaderInputCropButton = (): ReactElement => {
    const {mode, setMode, enabled} = useImageUploaderContext();
    const label = useI18n('editor.cropimage');

    return (
        <Tooltip value={label} delay={300}>
            <IconButton
                className={cn(mode === 'crop' && 'disabled:opacity-100')}
                onClick={() => setMode('crop')}
                disabled={!enabled || mode !== 'ready'}
                icon={Crop}
            />
        </Tooltip>
    );
};

ImageUploaderInputCropButton.displayName = 'ImageUploaderInputCropButton';
