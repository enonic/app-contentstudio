import * as Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ContentPreviewPathChangedEvent} from './ContentPreviewPathChangedEvent';
import {ContentItemPreviewToolbar} from './ContentItemPreviewToolbar';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {EmulatedEvent} from '../event/EmulatedEvent';
import {UriHelper} from '@enonic/lib-admin-ui/util/UriHelper';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {ItemPreviewPanel} from '@enonic/lib-admin-ui/app/view/ItemPreviewPanel';
import {ContentResourceRequest} from '../resource/ContentResourceRequest';
import {ViewItem} from '@enonic/lib-admin-ui/app/view/ViewItem';
import {StatusCode} from '@enonic/lib-admin-ui/rest/StatusCode';
import {ContentSummaryAndCompareStatusHelper} from '../content/ContentSummaryAndCompareStatusHelper';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {RepositoryId} from '../repository/RepositoryId';
import {ProjectContext} from '../project/ProjectContext';
import {Widget} from '@enonic/lib-admin-ui/content/Widget';
import {ContentSummary} from '../content/ContentSummary';

enum PREVIEW_TYPE {
    WIDGET,
    EMPTY,
    FAILED,
    MISSING,
    NOT_CONFIGURED,
}

export class ContentItemPreviewPanel
    extends ItemPreviewPanel<ViewItem> {

    protected item: ViewItem;
    protected skipNextSetItemCall: boolean = false;
    protected previewType: PREVIEW_TYPE;
    protected previewMessage: DivEl;
    protected noSelectionMessage: DivEl;
    protected debouncedSetItem: (item: ViewItem) => void;
    protected readonly contentRootPath: string;

    constructor(contentRootPath?: string) {
        super('content-item-preview-panel');

        this.contentRootPath = contentRootPath || ContentResourceRequest.CONTENT_PATH;
        this.debouncedSetItem = AppHelper.runOnceAndDebounce(this.doSetItem.bind(this), 300);

        this.initElements();
        this.setupListeners();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.wrapper.appendChildren(this.noSelectionMessage, this.previewMessage);
            this.mask.addClass('content-item-preview-panel-load-mask');
            return rendered;
        });
    }

    private initElements() {
        const selectorText: SpanEl = new SpanEl();
        selectorText.setHtml(i18n('panel.noselection'));
        this.noSelectionMessage = new DivEl('no-selection-message');
        this.noSelectionMessage.appendChild(selectorText);

        const previewText: SpanEl = new SpanEl();
        previewText.setHtml(i18n('field.preview.notAvailable'));
        this.previewMessage = new DivEl('no-preview-message');
        this.previewMessage.appendChild(previewText);
    }

    public setItem(item: ViewItem) {
        this.debouncedSetItem(item);
    }

    protected viewItemToContent(item: ViewItem): ContentSummaryAndCompareStatus {
        return item as ContentSummaryAndCompareStatus;
    }

    protected doSetItem(item: ViewItem, force: boolean = false) {
        const content = this.viewItemToContent(item);

        if (this.isPreviewUpdateNeeded(content, force)) {
            this.update(content);
        }

        this.toolbar.setItem(item);
        this.item = item;
    }

    public isPreviewUpdateNeeded(item: ContentSummaryAndCompareStatus, force?: boolean): boolean {
        return !this.skipNextSetItemCall && this.isItemAllowsUpdate(item, force);
    }

    private isItemAllowsUpdate(item: ContentSummaryAndCompareStatus, force?: boolean): boolean {
        return item && (force || this.isOtherContent(item) || this.isItemChanged(item));
    }

    private isOtherContent(item: ContentSummaryAndCompareStatus): boolean {
        return item?.getId() != this.item?.getId();
    }

    private isItemChanged(item: ContentSummaryAndCompareStatus): boolean {
        const diff = ContentSummaryAndCompareStatusHelper.diff(item, this.item as ContentSummaryAndCompareStatus);
        return diff.renderable || !!diff.contentSummary?.path || !!diff.contentSummary?.displayName || !!diff.contentSummary?.name ||
               !!diff.contentSummary?.inherit;
    }

    protected update(item: ContentSummaryAndCompareStatus) {
        let contentSummary = item.getContentSummary();
        this.fetchPreviewForPath(contentSummary);
    }

    private async fetchPreviewForPath(summary: ContentSummary): Promise<void> {
        const previewWidget = (this.toolbar as ContentItemPreviewToolbar).getWidgetSelector().getSelectedWidget();
        if (!previewWidget || !summary) {
            this.setPreviewType(PREVIEW_TYPE.EMPTY);
            return;
        }

        this.showMask();
        const params = new URLSearchParams({
            contentPath: summary.getPath().toString(),
            contentId: summary.getContentId().toString(),
            type: summary.getType().toString(),
            repo: `${RepositoryId.CONTENT_REPO_PREFIX}${ProjectContext.get().getProject().getName()}`,
            branch: CONFIG.getString('branch'),
        })
        return fetch(previewWidget.getUrl() + '?' + params.toString(), {method: 'HEAD'})
            .then((response) => {
                if (this.isResponseOk(response, previewWidget)) {
                    return this.handlePreviewSuccess(response);
                } else {
                    return this.handlePreviewFailure(response);
                }
            })
    }

    public clearItem() {
        (this.toolbar as ContentItemPreviewToolbar).clearItem();
    }

    private setupListeners() {

        this.onHidden((event) => {
            if (this.mask.isVisible()) {
                this.hideMask();
            }
        });

        this.frame.onLoaded((event: UIEvent) => {
            if (this.previewType === PREVIEW_TYPE.EMPTY) {
                return;
            }

            this.hideMask();

            const previewWidget = (this.toolbar as ContentItemPreviewToolbar).getWidgetSelector().getSelectedWidget();

            const widgetName = previewWidget.getWidgetDescriptorKey().getName();
            const isAuto = widgetName === 'preview-automatic';
            const frameWindow = this.frame.getHTMLElement()['contentWindow'];
            if (isAuto || widgetName === 'preview-media') {

                this.applyImageStyles(frameWindow);
            }
            if (isAuto || widgetName === 'preview-site-engine') {

                try {
                    frameWindow.addEventListener('click', this.frameClickHandler.bind(this));
                } catch (error) { /* error */ }
            }
        });

        (this.toolbar as ContentItemPreviewToolbar).getWidgetSelector().onSelectionChanged(() => {
            let contentSummary = this.viewItemToContent(this.item).getContentSummary();
            this.fetchPreviewForPath(contentSummary);
        });

        EmulatedEvent.on((event: EmulatedEvent) => {

            if (this.previewMessage) {
                this.previewMessage.getEl().setWidth(event.getWidthWithUnits());
                this.previewMessage.getEl().setHeight(event.getHeightWithUnits());
            }

            if (this.noSelectionMessage) {
                this.noSelectionMessage.getEl().setWidth(event.getWidthWithUnits());
                this.noSelectionMessage.getEl().setHeight(event.getHeightWithUnits());
            }

            const fullscreen = event.isFullscreen();
            this.wrapper.getEl().toggleClass('emulated', !fullscreen);
        });
    }

    createToolbar(): ContentItemPreviewToolbar {
        return new ContentItemPreviewToolbar();
    }

    private getLinkClicked(event: UIEvent): string {
        if (event.target && (event.target as HTMLElement).tagName.toLowerCase() === 'a') {
            return (event.target as HTMLLinkElement).href;
        }

        let el = event.target as HTMLElement;
        if (el) {
            while (el.parentNode) {
                el = el.parentNode as HTMLElement;
                if (el.tagName && el.tagName.toLowerCase() === 'a') {
                    return (el as HTMLLinkElement).href;
                }
            }
        }
        return '';
    }

    private isNavigatingWithinSamePage(contentPreviewPath: string, frameWindow: Window): boolean {
        const href = frameWindow.location.href;
        return contentPreviewPath === UriHelper.trimAnchor(UriHelper.trimWindowProtocolAndPortFromHref(href, frameWindow));
    }

    private isDownloadLink(contentPreviewPath: string): boolean {
        return contentPreviewPath.indexOf('attachment/download') > 0;
    }

    private frameClickHandler(frameWindow: Window, event: MouseEvent) {
        const linkClicked: string = this.getLinkClicked(event);
        if (linkClicked) {
            if (!!frameWindow && !UriHelper.isNavigatingOutsideOfXP(linkClicked, frameWindow)) {
                const contentPreviewPath = UriHelper.trimUrlParams(
                    UriHelper.trimAnchor(UriHelper.trimWindowProtocolAndPortFromHref(linkClicked,
                        frameWindow)));
                if (!this.isNavigatingWithinSamePage(contentPreviewPath, frameWindow) && !this.isDownloadLink(contentPreviewPath)) {
                    // event.preventDefault();
                    // const clickedLinkRelativePath = '/' + UriHelper.trimWindowProtocolAndPortFromHref(linkClicked, frameWindow);
                    // this.skipNextSetItemCall = true;
                    new ContentPreviewPathChangedEvent(contentPreviewPath).fire();
                    // setTimeout(() => {
                    //     this.item = null; // we don't have ref to content under contentPreviewPath and there is no point in figuring it out
                    //     this.skipNextSetItemCall = false;
                    //     this.fetchPreviewForPath(clickedLinkRelativePath);
                    // }, 500);
                }
            }
        }
    }

    private setPreviewType(previewType: PREVIEW_TYPE) {

        if (this.previewType !== previewType) {

            this.getEl().removeClass('widget-preview no-preview');

            switch (previewType) {
            case PREVIEW_TYPE.WIDGET: {
                this.getEl().addClass('widget-preview');
                break;
            }
            case PREVIEW_TYPE.EMPTY: {
                this.showPreviewMessages([i18n('field.preview.notAvailable')]);
                break;
            }
            case PREVIEW_TYPE.FAILED: {
                this.showPreviewMessages([i18n('field.preview.failed'), i18n('field.preview.failed.description')]);
                break;
            }
            case PREVIEW_TYPE.MISSING: {
                this.showPreviewMessages([i18n('field.preview.failed'), i18n('field.preview.missing.description')]);
                break;
            }
            case PREVIEW_TYPE.NOT_CONFIGURED: {
                this.showPreviewMessages([i18n('field.preview.notConfigured'), i18n('field.preview.notConfigured.description')]);
                break;
            }
            }
        }

        this.previewType = previewType;
    }

    private showPreviewMessages(messages: string[]) {
        this.getEl().addClass('no-preview');
        this.previewMessage.removeChildren();

        messages.forEach((message: string) => {
            this.previewMessage.appendChild(SpanEl.fromText(message));
        });
    }

    private handlePreviewSuccess(response: Response) {
        this.setPreviewType(PREVIEW_TYPE.WIDGET);

        this.frame.setSrc(response.url);
    }

    private handlePreviewFailure(response?: Response): void {
        const statusCode = response.status;
        if (statusCode > 0) {
            switch (statusCode) {
            case StatusCode.NOT_FOUND:
                this.setPreviewType(PREVIEW_TYPE.EMPTY);
                break;
            case StatusCode.I_AM_A_TEAPOT:
                this.setPreviewType(PREVIEW_TYPE.NOT_CONFIGURED);
                break;
            default:
                this.setPreviewType(PREVIEW_TYPE.FAILED);
                break;
            }
            this.hideMask();
            return;
        }

        this.setPreviewType(PREVIEW_TYPE.EMPTY);
        this.hideMask();
    }

    public showMask() {
        super.showMask();
        if (this.isVisible()) {
            this.addClass('loading');
        }
    }

    public hideMask() {
        super.hideMask();
        this.removeClass('loading');
    }

    public isMaskOn(): boolean {
        return this.mask.isVisible();
    }

    private isResponseOk(response: Response, previewWidget: Widget) {
        const isAuto = previewWidget?.getWidgetDescriptorKey().getName() === 'preview-automatic';
        return response.ok || !isAuto && response.status !== StatusCode.I_AM_A_TEAPOT;
    }

    private applyImageStyles(frameWindow: Window) {
        const body = frameWindow.document.body;
        if (body) {
            body.style.display = 'flex';
            body.style.justifyContent = 'center';
            body.style.alignItems = 'center';
        }

        const img = frameWindow.document.querySelector('img');
        if (img) {
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100%';
        }
    }
}
