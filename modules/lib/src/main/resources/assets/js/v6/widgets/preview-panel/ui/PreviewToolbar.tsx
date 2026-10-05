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
    editorLayout?: boolean;
};

const PreviewToolbar = ({
    item = null,
    onRefresh,
    hideInMobileMode = false,
    editorLayout = false,
}: PreviewToolbarProps): ReactElement | null => {
    const mode = useStore($contextPanelMode);

    if (!item) return null;

    return (
        <Toolbar>
            <Toolbar.Container
                aria-label="Preview toolbar"
                className={cn(
                    '@container bg-surface-neutral h-15 py-3.75 flex items-center border-b border-bdr-soft',
                    editorLayout ? 'gap-2 px-2 @md:gap-5' : 'justify-between px-5',
                    hideInMobileMode && mode === 'mobile' && 'hidden',
                )}
            >
                {editorLayout ? (
                    <>
                        <div className="min-w-0 flex-1">
                            <PreviewToolbarVersionHistoryItem contentSummary={item.getContentSummary()} showStatus />
                        </div>
                        <PreviewToolbarEmulatorSelector />
                        <PreviewToolbarWidgetSelector />
                        <div className="flex justify-end @sm:min-w-0 @sm:flex-1">
                            <PreviewToolbarRefreshItem onRefresh={onRefresh} />
                        </div>
                    </>
                ) : (
                    <>
                        <PreviewToolbarVersionHistoryItem contentSummary={item.getContentSummary()} />
                        <div className="flex gap-2 @md:gap-5 flex-nowrap shrink-0">
                            <PreviewToolbarEmulatorSelector />
                            <PreviewToolbarWidgetSelector />
                        </div>

                        <PreviewToolbarRefreshItem onRefresh={onRefresh} />
                    </>
                )}
            </Toolbar.Container>
        </Toolbar>
    );
};

PreviewToolbar.displayName = 'PreviewToolbar';

export class PreviewToolbarElement extends LegacyElement<typeof PreviewToolbar, PreviewToolbarProps> {
    constructor(props: Pick<PreviewToolbarProps, 'hideInMobileMode' | 'editorLayout'> = {}) {
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
