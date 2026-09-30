import { IconButton, Tooltip, Toolbar } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { RefreshCw } from 'lucide-react';
import { type ReactElement } from 'react';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
import { $isPreviewFrameReady } from '../model/previewResolution.store';

export const PreviewToolbarRefreshItem = ({ onRefresh }: { onRefresh?: () => void }): ReactElement => {
    const label = useI18n('action.refresh');
    const isPreviewFrameReady = useStore($isPreviewFrameReady);

    return (
        <Tooltip value={label}>
            <Toolbar.Item asChild disabled={!isPreviewFrameReady}>
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
