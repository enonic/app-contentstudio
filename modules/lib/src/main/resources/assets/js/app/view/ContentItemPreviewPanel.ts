import {type ViewItem} from '@enonic/lib-admin-ui/app/view/ViewItem';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {IFrameEl} from '@enonic/lib-admin-ui/dom/IFrameEl';
import {type Action} from '@enonic/lib-admin-ui/ui/Action';
import {LoadMask} from '@enonic/lib-admin-ui/ui/mask/LoadMask';
import {type Mask} from '@enonic/lib-admin-ui/ui/mask/Mask';
import {Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {cn} from '@enonic/ui';
import Q from 'q';
import {$activeWidget} from '../../v6/features/store/liveViewWidgets.store';
import {PreviewToolbarElement} from '../../v6/features/views/browse/layout/preview/PreviewToolbar';
import {type ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentSummaryAndCompareStatusHelper} from '../content/ContentSummaryAndCompareStatusHelper';
import {ContentResourceRequest} from '../resource/ContentResourceRequest';
import {ContentPreviewPathChangedEvent} from './ContentPreviewPathChangedEvent';
import {type ExtensionRenderer, ExtensionRenderingHandler} from './ExtensionRenderingHandler';

export class ContentItemPreviewPanel extends Panel implements ExtensionRenderer {

    protected frame: IFrameEl;
    protected wrapper: DivEl;
    protected toolbar: PreviewToolbarElement;
    protected mask: LoadMask;
    protected item: ViewItem;
    protected skipNextSetItemCall: boolean = false;
    protected debouncedSetItem: (item: ViewItem) => void;
    protected readonly contentRootPath: string;
    private extensionRenderingHandler: ExtensionRenderingHandler;

    private previewAction: Action;

    constructor(contentRootPath?: string) {
        super('item-preview-panel content-item-preview-panel extension-preview-panel');

        this.toolbar = this.createToolbar();
        this.mask = new LoadMask(this);
        this.frame = new IFrameEl();
        this.wrapper = new DivEl('wrapper');
        this.wrapper.appendChild(this.frame);
        this.appendChildren(this.toolbar, this.wrapper, this.mask);

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
            this.addClass('bg-surface-neutral');
            this.extensionRenderingHandler.layout();
            this.mask.addClass(cn('transition-opacity duration-300 opacity-0'));
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

        this.toolbar.setItem(item as ContentSummaryAndCompareStatus);

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
        return diff.contentSummary.page || !!diff.contentSummary?.path
               || !!diff.contentSummary?.displayName || !!diff.contentSummary?.name || !!diff.contentSummary?.inherit;
    }

    protected async update(item: ContentSummaryAndCompareStatus) {
        const contentSummary = item.getContentSummary();
        const extension = $activeWidget.get();

        return this.extensionRenderingHandler.render(contentSummary, extension);
    }

    public isItemRenderable(): Q.Promise<boolean> {
        return this.extensionRenderingHandler.isItemRenderable();
    }

    public clearItem() {
        this.toolbar.clearItem();
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

        window.addEventListener('message', this.handlePreviewMessage);
        this.onRemoved(() => window.removeEventListener('message', this.handlePreviewMessage));
    }

    private handlePreviewMessage = (event: MessageEvent): void => {
        const frameWindow = (this.frame.getHTMLElement() as HTMLIFrameElement | null)?.contentWindow;
        if (frameWindow == null || event.source !== frameWindow) return;

        const data = event.data as {source?: string; type?: string; path?: string} | null;
        if (data?.source !== 'page-editor') return;
        if (data.type === 'navigate' && typeof data.path === 'string') {
            new ContentPreviewPathChangedEvent(data.path).fire();
        }
    };

    protected getToolbar(): PreviewToolbarElement {
        return this.toolbar;
    }

    createToolbar(): PreviewToolbarElement {
        return new PreviewToolbarElement();
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

    public showMask() {
        if (this.isVisible()) {
            this.mask.show();
            const className = 'opacity-0';
            this.mask.addClass(className);
        }
    }

    public hideMask() {
        this.mask.hide();
        const className = 'opacity-0';
        this.mask.removeClass(className);
    }
}
