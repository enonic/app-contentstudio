import Q from 'q';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {ContentItemPreviewToolbar} from './ContentItemPreviewToolbar';
import {type ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ItemPreviewPanel} from '@enonic/lib-admin-ui/app/view/ItemPreviewPanel';
import {ContentResourceRequest} from '../resource/ContentResourceRequest';
import {type ViewItem} from '@enonic/lib-admin-ui/app/view/ViewItem';
import {ContentSummaryAndCompareStatusHelper} from '../content/ContentSummaryAndCompareStatusHelper';
import {type Action} from '@enonic/lib-admin-ui/ui/Action';
import {ExtensionRenderingHandler, type ExtensionRenderer} from './ExtensionRenderingHandler';
import {type IFrameEl} from '@enonic/lib-admin-ui/dom/IFrameEl';
import {type DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {type Mask} from '@enonic/lib-admin-ui/ui/mask/Mask';
import {type PreviewModeDropdown} from './toolbar/PreviewModeDropdown';


export class ContentItemPreviewPanel
    extends ItemPreviewPanel<ViewItem>
    implements ExtensionRenderer {

    protected item: ViewItem;
    protected skipNextSetItemCall: boolean = false;

    protected debouncedSetItem: (item: ViewItem) => void;
    protected readonly contentRootPath: string;

    protected extensionRenderingHandler: ExtensionRenderingHandler;

    private previewAction: Action;

    constructor(contentRootPath?: string) {
        super('content-item-preview-panel extension-preview-panel');

        this.contentRootPath = contentRootPath || ContentResourceRequest.CONTENT_PATH;
        this.debouncedSetItem = AppHelper.runOnceAndDebounce(this.doSetItem.bind(this), 300);

        this.extensionRenderingHandler = this.createExtensionRenderingHandler();

        this.setupListeners();
    }

    protected createExtensionRenderingHandler(): ExtensionRenderingHandler {
        return new ExtensionRenderingHandler(this);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.extensionRenderingHandler.layout();
            this.mask.addClass('content-item-preview-panel-load-mask');
            this.getToolbar().setRefreshAction(() => this.refresh());
            return rendered;
        });
    }

    private refresh(): void {
        if (this.item) {
            void this.update(this.viewItemToContent(this.item));
        }
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
        const extension = (this.toolbar as ContentItemPreviewToolbar).getModeSelector().getSelectedMode();

        return this.extensionRenderingHandler.render(contentSummary, extension);
    }

    public isItemRenderable(): Q.Promise<boolean> {
        return this.extensionRenderingHandler.isItemRenderable();
    }

    public clearItem() {
        (this.toolbar as ContentItemPreviewToolbar).clearItem();
        this.extensionRenderingHandler.empty();
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
        return new ContentItemPreviewToolbar();
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

    public setPreviewAction(action: Action): void {
        this.previewAction = action;
    }

    public getPreviewAction(): Action {
        return this.previewAction;
    }

    public getExtensionSelector(): PreviewModeDropdown {
        return this.getToolbar().getModeSelector();
    }
}
