import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {Toolbar} from '@enonic/ui';
import type {ReactElement} from 'react';
import type {ContentSummaryAndCompareStatus} from '../../../../../../app/content/ContentSummaryAndCompareStatus';
import {LegacyElement} from '../../../../shared/LegacyElement';
import {PreviewToolbarEmulatorSelector} from './PreviewToolbarEmulatorSelector';
import {PreviewToolbarRefreshItem} from './PreviewToolbarRefreshItem';
import {PreviewToolbarVersionHistoryItem} from './PreviewToolbarVersionHistoryItem';
import {PreviewToolbarWidgetSelector} from './PreviewToolbarWidgetSelector';

type PreviewToolbarProps = {
    item?: ContentSummaryAndCompareStatus | null;
    onRefresh?: () => void;
};

const PreviewToolbar = ({item = null, onRefresh}: PreviewToolbarProps): ReactElement | null => {
    if (!item) return null;

    return (
        <Toolbar>
            <Toolbar.Container
                aria-label="Preview toolbar"
                className="@container bg-surface-neutral h-15 px-5 py-3.75 flex items-center justify-between border-b border-bdr-soft"
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
    constructor() {
        super({}, PreviewToolbar);
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
