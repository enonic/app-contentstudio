import {IconButton, Tooltip, Toolbar} from '@enonic/ui';
import {RefreshCw} from 'lucide-react';
import {type ReactElement} from 'react';
import {useI18n} from '../../../../hooks/useI18n';

export const PreviewToolbarRefreshItem = ({onRefresh}: {onRefresh?: () => void}): ReactElement => {
    const label = useI18n('action.refresh');

    return (
        <Tooltip value={label}>
            <Toolbar.Item asChild>
                <IconButton
                    size="md"
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
