import { type ReactElement } from 'react';
import { cn, IconButton, Tooltip } from '@enonic/ui';
import { Crop } from 'lucide-react';
import { useImageUploaderContext } from '../ImageUploaderContext';
import { useI18n } from '../../../../../../shared/lib/hooks/useI18n';

export const ImageUploaderInputCropButton = (): ReactElement => {
    const { mode, setMode, enabled, cropButtonRef } = useImageUploaderContext();
    const label = useI18n('editor.cropimage');

    return (
        <Tooltip value={label} delay={300}>
            <IconButton
                ref={cropButtonRef}
                className={cn(mode === 'crop' && 'disabled:opacity-100')}
                onClick={() => setMode('crop')}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' && event.repeat) event.preventDefault();
                }}
                disabled={!enabled || mode !== 'ready'}
                icon={Crop}
                aria-label={label}
            />
        </Tooltip>
    );
};

ImageUploaderInputCropButton.displayName = 'ImageUploaderInputCropButton';
