import {type ReactElement} from 'react';
import {Button, cn} from '@enonic/ui';
import {UploadIcon} from 'lucide-react';
import {useI18n} from '../../../../hooks/useI18n';

export type AttachmentUploaderButtonProps = {
    disabled: boolean;
    progress: number;
    onClick: () => void;
};

export const AttachmentUploaderButton = ({disabled, progress, onClick}: AttachmentUploaderButtonProps): ReactElement => {
    const uploadLabel = useI18n('action.upload');

    return (
        <Button onClick={onClick} variant="outline" className={cn((disabled || progress > 0) && 'pointer-events-none', 'relative text-sm')}>
            {progress > 0 && (
                <div className="animate-pulse absolute top-0 left-0 h-full bg-success-rev opacity-30" style={{width: `${progress}%`}} />
            )}
            {uploadLabel}
            <UploadIcon size={20} absoluteStrokeWidth />
        </Button>
    );
};

AttachmentUploaderButton.displayName = 'AttachmentUploaderButton';
