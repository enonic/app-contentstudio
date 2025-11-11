import {Button, Tooltip} from '@enonic/ui';
import {History} from 'lucide-react';
import {ReactElement} from 'react';
import {InternalWidgetType} from '../../../../../../app/view/context/WidgetView';
import {InspectEvent} from '../../../../../../app/event/InspectEvent';
import {useI18n} from '../../../../hooks/useI18n';

export function PreviewToolbarVersionHistoryButton(): ReactElement {
    const label = useI18n('field.preview.toolbar.versionHistory');
    const tooltipLabel = useI18n('field.preview.toolbar.versionHistory.tooltip');

    const handleShowVersionHistory = () => {
        InspectEvent.create()
            .setWidgetType(InternalWidgetType.HISTORY)
            .setShowWidget(true)
            .setShowPanel(true)
            .build()
            .fire();
    };

    return (
        <Tooltip value={tooltipLabel} side="bottom">
            <Button
                size="sm"
                className="flex-shrink-0"
                aria-label={tooltipLabel}
                startIcon={History}
                onClick={handleShowVersionHistory}
            >
                <span className="hidden @sm:inline">{label}</span>
            </Button>
        </Tooltip>
    );
}

PreviewToolbarVersionHistoryButton.displayName = 'PreviewToolbarVersionHistoryButton';
