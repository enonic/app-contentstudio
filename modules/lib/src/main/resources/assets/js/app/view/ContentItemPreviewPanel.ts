import * as Q from 'q';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {ContentItemPreviewToolbar, WidgetPreviewAction} from './ContentItemPreviewToolbar';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ItemPreviewPanel} from '@enonic/lib-admin-ui/app/view/ItemPreviewPanel';
import {ContentResourceRequest} from '../resource/ContentResourceRequest';
import {ViewItem} from '@enonic/lib-admin-ui/app/view/ViewItem';
import {ContentSummaryAndCompareStatusHelper} from '../content/ContentSummaryAndCompareStatusHelper';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {WidgetRenderingHandler, WidgetRenderer} from './WidgetRenderingHandler';
import {IFrameEl} from '@enonic/lib-admin-ui/dom/IFrameEl';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Mask} from '@enonic/lib-admin-ui/ui/mask/Mask';
import {PreviewActionHelper} from '../action/PreviewActionHelper';
import {PreviewWidgetDropdown} from './toolbar/PreviewWidgetDropdown';


export class ContentItemPreviewPanel
    extends ItemPreviewPanel<ViewItem>
    implements WidgetRenderer {

    protected item: ViewItem;
    protected skipNextSetItemCall: boolean = false;

    protected debouncedSetItem: (item: ViewItem) => void;
    protected readonly contentRootPath: string;

    private widgetRenderingHandler: WidgetRenderingHandler;

    constructor(contentRootPath?: string) {
        super('content-item-preview-panel widget-preview-panel');

        this.contentRootPath = contentRootPath || ContentResourceRequest.CONTENT_PATH;
        this.debouncedSetItem = AppHelper.runOnceAndDebounce(this.doSetItem.bind(this), 300);

        this.widgetRenderingHandler = new WidgetRenderingHandler(this);

        this.setupListeners();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.widgetRenderingHandler.layout();
            this.mask.addClass('content-item-preview-panel-load-mask');
            return rendered;
        });
    }

    protected viewItemToContent(item: ViewItem): ContentSummaryAndCompareStatus {
        return item as ContentSummaryAndCompareStatus;
    }

    protected async doSetItem(item: ViewItem, force: boolean = false) {
        const content = this.viewItemToContent(item);

        this.toolbar.setItem(item);

        return this.isPreviewUpdateNeeded(content, force).then((updateNeeded) => {
            // only update this.item after the isPreviewUpdateNeeded check because it uses it
            this.item = item;

            if (updateNeeded) {
                return this.update(content);
            }
        });
    }

    public isPreviewUpdateNeeded(item: ContentSummaryAndCompareStatus, force?: boolean): Q.Promise<boolean> {
        if (this.skipNextSetItemCall) {
            return Q(false);
        }
        if (this.isItemAllowsUpdate(item, force)) {
            return Q(true);
        }
        return this.isItemRenderable();
    }

    private isItemAllowsUpdate(item: ContentSummaryAndCompareStatus, force?: boolean): boolean {
        return item && (force || this.isOtherContent(item) || this.isItemChanged(item));
    }

    private isOtherContent(item: ContentSummaryAndCompareStatus): boolean {
        return item?.getId() != this.item?.getId();
    }

    private isItemChanged(item: ContentSummaryAndCompareStatus): boolean {
        const diff = ContentSummaryAndCompareStatusHelper.diff(item, this.item as ContentSummaryAndCompareStatus);
        return diff.renderable || diff.contentSummary.page || !!diff.contentSummary?.path
               || !!diff.contentSummary?.displayName || !!diff.contentSummary?.name || !!diff.contentSummary?.inherit;
    }

    protected async update(item: ContentSummaryAndCompareStatus) {
        const contentSummary = item.getContentSummary();
        const widget = (this.toolbar as ContentItemPreviewToolbar).getWidgetSelector().getSelectedWidget();

        return this.widgetRenderingHandler.render(contentSummary, widget);
    }

    public isItemRenderable(): Q.Promise<boolean> {
        return this.widgetRenderingHandler.isItemRenderable();
    }

    public clearItem() {
        (this.toolbar as ContentItemPreviewToolbar).clearItem();
        this.widgetRenderingHandler.empty();
        this.item = undefined;
    }

    public setItem(item: ViewItem) {
        this.debouncedSetItem(item);
    }

    private setupListeners() {

        this.onHidden((event) => {
            if (this.mask.isVisible()) {
                this.hideMask();
            }
        });
    }

    protected getToolbar(): ContentItemPreviewToolbar {
        return this.toolbar as ContentItemPreviewToolbar;
    }

    createToolbar(): ContentItemPreviewToolbar {
        return new ContentItemPreviewToolbar(new PreviewActionHelper());
    }

    getActions(): Action[] {
        return [
            ...super.getActions(),
            this.getPreviewAction()
        ];
    }

    public getIFrameEl(): IFrameEl {
        return this.frame;
    }

    public getChildrenContainer(): DivEl {
        return this.wrapper;
    }

    public getMask(): Mask {
        return this.mask;
    }

    public getPreviewAction(): WidgetPreviewAction {
        return this.getToolbar().getPreviewAction();
    }

    public getWidgetSelector(): PreviewWidgetDropdown {
        return this.getToolbar().getWidgetSelector();
    }
}
