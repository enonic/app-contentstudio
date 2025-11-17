import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {ReactElement} from 'react';
import {RenderingMode} from '../../../../../../app/rendering/RenderingMode';
import {ContentSummaryAndCompareStatus} from '../../../../../../app/content/ContentSummaryAndCompareStatus';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {PreviewActionHelper} from '../../../../../../app/action/PreviewActionHelper';
import {PreviewToolbarEmulatorSelector} from './PreviewToolbarEmulatorSelector';
import {PreviewToolbarWidgetSelector} from './PreviewToolbarWidgetSelector';
import {$activeWidget} from '../../../../store/liveViewWidgets.store';
import {BrowserHelper} from '@enonic/lib-admin-ui/BrowserHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {PreviewToolbarVersionHistoryItem} from './PreviewToolbarVersionHistoryItem';
import {PreviewToolbarOpenExternalItem} from './PreviewToolbarOpenExternalItem';
import {Toolbar} from '@enonic/ui';

type PreviewToolbarProps = {
    item?: ContentSummaryAndCompareStatus | null;
    previewAction?: Action;
};

type PreviewToolbarElementProps = PreviewToolbarProps & {
    mode?: RenderingMode;
};

const PreviewToolbar = ({item = null, previewAction}: PreviewToolbarProps): ReactElement | undefined => {
    if (!item) return undefined;

    return (
        <Toolbar>
            <Toolbar.Container
                aria-label="Preview toolbar"
                className="@container bg-surface-neutral h-15 px-5 py-3.75 flex items-center justify-between border-b border-bdr-soft"
            >
                <PreviewToolbarVersionHistoryItem />

                <div className="flex gap-2 @md:gap-5 flex-nowrap flex-shrink-0">
                    <PreviewToolbarEmulatorSelector />
                    <PreviewToolbarWidgetSelector />
                </div>

                <PreviewToolbarOpenExternalItem action={previewAction} />
            </Toolbar.Container>
        </Toolbar>
    );
};

PreviewToolbar.displayName = 'PreviewToolbar';

export class PreviewToolbarElement extends LegacyElement<typeof PreviewToolbar, PreviewToolbarProps> {
    private mode: RenderingMode;

    constructor(props: PreviewToolbarElementProps) {
        super({previewAction: props.previewAction}, PreviewToolbar);

        this.mode = props.mode || RenderingMode.PREVIEW;

        if (!props.previewAction) {
            this.setPreviewAction(new WidgetPreviewAction(this));
        }
    }

    public getMode(): RenderingMode {
        return this.mode;
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

    public getPreviewAction(): Action {
        return this.props.get().previewAction;
    }

    public setPreviewAction(action: Action) {
        this.props.setKey('previewAction', action);
    }
}

class WidgetPreviewAction extends Action {
    constructor(toolbar: PreviewToolbarElement) {
        super(i18n('action.preview.open'), BrowserHelper.isOSX() ? 'alt+space' : 'mod+alt+space', true);

        this.onExecuted(() => {
            new PreviewActionHelper().openWindow(
                toolbar.getItem().getContentSummary(),
                $activeWidget.get(),
                toolbar.getMode()
            );
        });
    }
}
