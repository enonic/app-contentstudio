import { cn, Toggle, Toolbar } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { Eye, EyeOff } from 'lucide-react';
import { type ReactElement, useEffect } from 'react';
import { $currentItem } from '../../entities/content';
import {
    $contextPanelMode,
    $isMobilePreviewOpen,
    setMobilePreviewOpen,
} from '../../shared/app-state/browsePanels.store';
import { useI18n } from '../../shared/lib/hooks/useI18n';

type Props = {
    className?: string;
};

export const PreviewToggle = ({ className }: Props): ReactElement | null => {
    const mode = useStore($contextPanelMode);
    const isPreviewOpen = useStore($isMobilePreviewOpen);
    const currentItem = useStore($currentItem);
    const previewLabel = useI18n('action.preview');

    useEffect(() => {
        if (!currentItem && isPreviewOpen) {
            setMobilePreviewOpen(false);
        }
    }, [currentItem, isPreviewOpen]);

    if (mode !== 'mobile') {
        return null;
    }

    const PreviewIcon = isPreviewOpen ? EyeOff : Eye;

    return (
        <Toolbar.Item asChild disabled={!currentItem}>
            <Toggle
                className={cn('size-9 p-0', className)}
                size="sm"
                aria-label={previewLabel}
                startIcon={PreviewIcon}
                pressed={isPreviewOpen}
                onPressedChange={setMobilePreviewOpen}
            />
        </Toolbar.Item>
    );
};

PreviewToggle.displayName = 'PreviewToggle';
