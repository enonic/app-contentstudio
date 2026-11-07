import { type ReactElement } from 'react';
import { IconButton, Tooltip } from '@enonic/ui';
import { X } from 'lucide-react';
import { useImageUploaderCancel } from '../useImageUploaderActions';
import { useI18n } from '../../../../../../shared/lib/hooks/useI18n';

export const ImageUploaderInputCancelButton = (): ReactElement => {
    const { canCancel, cancel } = useImageUploaderCancel();
    const label = useI18n('action.cancel');

    return (
        <Tooltip value={label} delay={300}>
            <IconButton icon={X} onClick={cancel} disabled={!canCancel} aria-label={label} aria-keyshortcuts="Escape" />
        </Tooltip>
    );
};

ImageUploaderInputCancelButton.displayName = 'ImageUploaderInputCancelButton';
