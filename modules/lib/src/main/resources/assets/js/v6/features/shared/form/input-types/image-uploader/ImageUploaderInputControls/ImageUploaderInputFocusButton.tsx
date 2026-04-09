import {type ReactElement} from 'react';
import {cn, IconButton, Tooltip} from '@enonic/ui';
import {Focus} from 'lucide-react';
import {useImageUploaderContext} from '../ImageUploaderContext';
import {useI18n} from '../../../../../hooks/useI18n';

export const ImageUploaderInputFocusButton = (): ReactElement => {
    const {enabled, mode, setMode} = useImageUploaderContext();
    const label = useI18n('editor.setautofocus');

    return (
        <Tooltip value={label} delay={300}>
            <IconButton
                className={cn(mode === 'focus' && 'disabled:opacity-100')}
                onClick={() => setMode('focus')}
                disabled={!enabled || mode !== 'ready'}
                icon={Focus}
            />
        </Tooltip>
    );
};

ImageUploaderInputFocusButton.displayName = 'ImageUploaderInputFocusButton';
