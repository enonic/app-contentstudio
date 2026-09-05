import { ResponsiveManager } from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import { cn, Toolbar } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import type { ReactElement } from 'react';
import type { ContentSummaryAndCompareStatus } from '../../../../app/content/ContentSummaryAndCompareStatus';
import { $contextPanelMode } from '../../../shared/app-state/browsePanels.store';
import { LegacyElement } from '../../../shared/ui/LegacyElement';
import { PreviewToolbarEmulatorSelector } from './PreviewToolbarEmulatorSelector';
import { PreviewToolbarRefreshItem } from './PreviewToolbarRefreshItem';
import { PreviewToolbarVersionHistoryItem } from './PreviewToolbarVersionHistoryItem';
import { PreviewToolbarWidgetSelector } from './PreviewToolbarWidgetSelector';

type PreviewToolbarProps = {
    item?: ContentSummaryAndCompareStatus | null;
    onRefresh?: () => void;
    hideInMobileMode?: boolean;
};

const PreviewToolbar = ({
    item = null,
    onRefresh,
    hideInMobileMode = false,
}: PreviewToolbarProps): ReactElement | null => {
    const mode = useStore($contextPanelMode);

    if (!item) return null;

    return (
        <Toolbar>
            <Toolbar.Container
                aria-label="Preview toolbar"
                className={cn(
                    '@container bg-surface-neutral h-15 px-5 py-3.75 flex items-center justify-between border-b border-bdr-soft',
                    hideInMobileMode && mode === 'mobile' && 'hidden',
                )}
            >
                <PreviewToolbarVersionHistoryItem contentSummary={item.getContentSummary()} />

                <div className="flex gap-2 @md:gap-5 flex-nowrap shrink-0">
                    <PreviewToolbarEmulatorSelector />
                    <PreviewToolbarWidgetSelector />
                </div>

                <PreviewToolbarRefreshItem onRefresh={onRefresh} />
            </Toolbar.Container>
        </Toolbar>
    );
};

PreviewToolbar.displayName = 'PreviewToolbar';

export class PreviewToolbarElement extends LegacyElement<typeof PreviewToolbar, PreviewToolbarProps> {
    constructor(props: Pick<PreviewToolbarProps, 'hideInMobileMode'> = {}) {
        super(props, PreviewToolbar);
    }

    public getItem(): ContentSummaryAndCompareStatus | null {
        return this.props.get().item;
    }

    public setItem(item: ContentSummaryAndCompareStatus): void {
        ResponsiveManager.fireResizeEvent();
        this.props.setKey('item', item);
    }

    public clearItem(): void {
        this.props.setKey('item', null);
    }

    public setRefreshAction(fn: () => void): void {
        this.props.setKey('onRefresh', fn);
    }
}
