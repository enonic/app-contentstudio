import {Button, Toolbar} from '@enonic/ui';
import {History} from 'lucide-react';
import {ReactElement} from 'react';
import {InternalWidgetType} from '../../../../../../app/view/context/WidgetView';
import {InspectEvent} from '../../../../../../app/event/InspectEvent';
import {useI18n} from '../../../../hooks/useI18n';

export function PreviewToolbarVersionHistoryItem(): ReactElement {
    const handleShowVersionHistory = () => {
        InspectEvent.create()
            .setWidgetType(InternalWidgetType.HISTORY)
            .setShowWidget(true)
            .setShowPanel(true)
            .build()
            .fire();
    };

    return (
        <Toolbar.Item asChild>
            <Button
                size="sm"
                className="min-w-9 p-0 @sm:p-3.5 flex-shrink-0"
                aria-label={useI18n('wcag.preview.toolbar.versionHistory.label')}
                startIcon={History}
                onClick={handleShowVersionHistory}
            >
                <span className="hidden @sm:inline">{useI18n('field.preview.toolbar.versionHistory.label')}</span>
            </Button>
        </Toolbar.Item>
    );
}

PreviewToolbarVersionHistoryItem.displayName = 'PreviewToolbarVersionHistoryItem';
