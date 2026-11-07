import { type ReactElement } from 'react';
import { Button } from '@enonic/ui';
import { useI18n } from '../../../../../../shared/lib/hooks/useI18n';
import { useImageUploaderApply } from '../useImageUploaderActions';

export const ImageUploaderInputApplyButton = (): ReactElement => {
    const { canApply, apply } = useImageUploaderApply();
    const applyLabel = useI18n('action.apply');

    return (
        <Button variant="filled" onClick={apply} disabled={!canApply} aria-keyshortcuts="Enter">
            {applyLabel}
        </Button>
    );
};

ImageUploaderInputApplyButton.displayName = 'ImageUploaderInputApplyButton';
