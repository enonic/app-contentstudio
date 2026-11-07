import { type ReactElement } from 'react';
import { useI18n } from '../../../../../../shared/lib/hooks/useI18n';
import { useImageUploaderContext } from '../ImageUploaderContext';
import { useImageUploaderReset } from '../useImageUploaderActions';
import { Button } from '@enonic/ui';

export const ImageUploaderInputResetButton = (): ReactElement | null => {
    const { enabled } = useImageUploaderContext();
    const { canReset, resetImage } = useImageUploaderReset();
    const resetLabel = useI18n('action.reset');

    if (!canReset) {
        return null;
    }

    return (
        <Button variant="text" onClick={resetImage} disabled={!enabled} aria-keyshortcuts="r">
            {resetLabel}
        </Button>
    );
};

ImageUploaderInputResetButton.displayName = 'ImageUploaderInputResetButton';
