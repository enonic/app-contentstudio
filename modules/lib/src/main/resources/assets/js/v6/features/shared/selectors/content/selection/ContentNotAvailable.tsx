import {FileQuestionMarkIcon} from 'lucide-react';
import {useI18n} from '../../../../hooks/useI18n';
import {type ReactElement} from 'react';
import {cn} from '@enonic/ui';

export type ContentNotAvailableProps = {
    contentId: string;
    className?: string;
};

export const ContentNotAvailable = ({contentId, className}: ContentNotAvailableProps): ReactElement => {
    const contentNotAvailableLabel = useI18n('text.content.not.found');

    return (
        <div className={cn('flex items-center gap-2.5 min-w-0', className)}>
            <div className="shrink-0">
                <FileQuestionMarkIcon size={24} absoluteStrokeWidth className="text-error" />
            </div>
            <div className="min-w-0 w-full">
                <span className="font-semibold text-base block whitespace-nowrap overflow-hidden text-ellipsis">{contentId}</span>
                <span className="text-sm text-error block whitespace-nowrap overflow-hidden text-ellipsis">{contentNotAvailableLabel}</span>
            </div>
        </div>
    );
};
