import {IconButton} from '@enonic/ui';
import {ChevronRight} from 'lucide-react';
import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {setContentFormExpanded} from '../../../store/wizardContent.store';

type CollapsedFormPanelProps = {
    displayName: string;
};

export const CollapsedFormPanel = ({displayName}: CollapsedFormPanelProps): ReactElement => {
    const expandLabel = useI18n('action.contentForm.expand');

    const handleExpand = (): void => {
        setContentFormExpanded(true);
    };

    return (
        <div className="flex flex-col items-center pt-1 gap-3 h-full">
            <IconButton
                icon={ChevronRight}
                size="sm"
                variant="filled"
                aria-label={expandLabel}
                onClick={handleExpand}
                className="rounded-full"
            />
            <span
                className="text-lg font-semibold text-subtle whitespace-nowrap overflow-hidden text-ellipsis max-h-full [writing-mode:vertical-lr]"
                title={displayName}
            >
                {displayName}
            </span>
        </div>
    );
};

CollapsedFormPanel.displayName = 'CollapsedFormPanel';
