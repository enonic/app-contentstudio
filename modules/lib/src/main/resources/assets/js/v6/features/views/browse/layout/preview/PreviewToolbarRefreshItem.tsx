import {IconButton, Tooltip, Toolbar} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {RefreshCw} from 'lucide-react';
import {type ReactElement} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import {$isWidgetRenderable} from '../../../../store/contextWidgets.store';

export const PreviewToolbarRefreshItem = ({onRefresh}: {onRefresh?: () => void}): ReactElement => {
    const label = useI18n('action.refresh');
    const isWidgetRenderable = useStore($isWidgetRenderable);

    return (
        <Tooltip value={label}>
            <Toolbar.Item asChild disabled={!isWidgetRenderable}>
                <IconButton
                    size="sm"
                    className="flex-shrink-0"
                    icon={RefreshCw}
                    onClick={() => onRefresh?.()}
                    aria-label={label}
                />
            </Toolbar.Item>
        </Tooltip>
    );
};

PreviewToolbarRefreshItem.displayName = 'PreviewToolbarRefreshItem';
