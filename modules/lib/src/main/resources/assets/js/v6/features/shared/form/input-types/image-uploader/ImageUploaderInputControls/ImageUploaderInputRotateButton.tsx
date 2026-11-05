import { type ReactElement } from 'react';
import { IconButton, Tooltip } from '@enonic/ui';
import { RotateCw } from 'lucide-react';
import { useImageUploaderContext } from '../ImageUploaderContext';
import { useI18n } from '../../../../../../shared/lib/hooks/useI18n';
import { rotateOrientation } from '../lib/propertySet';

export const ImageUploaderInputRotateButton = (): ReactElement => {
    const {
        value,
        enabled,
        mode,
        orientation,
        setOrientation,
        setMode,
        transformButtonRef,
        transformResetOrientationRef,
    } = useImageUploaderContext();

    const label = useI18n('action.rotate');

    return (
        <Tooltip value={label} delay={300}>
            <IconButton
                onClick={(event) => {
                    if (!value || value.isNull()) return;
                    if (mode !== 'transform' || transformButtonRef.current !== event.currentTarget) {
                        transformResetOrientationRef.current = orientation;
                    }
                    transformButtonRef.current = event.currentTarget;
                    setMode('transform');
                    setOrientation(rotateOrientation);
                    event.currentTarget.focus({ preventScroll: true });
                }}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' && event.repeat) event.preventDefault();
                }}
                disabled={!enabled || (mode !== 'ready' && mode !== 'transform')}
                icon={RotateCw}
                aria-label={label}
            />
        </Tooltip>
    );
};

ImageUploaderInputRotateButton.displayName = 'ImageUploaderInputRotateButton';
