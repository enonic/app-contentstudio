import * as $ from 'jquery';
import * as Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {ContentPreviewPathChangedEvent} from './ContentPreviewPathChangedEvent';
import {ContentItemPreviewToolbar} from './ContentItemPreviewToolbar';
import {RenderingMode} from '../rendering/RenderingMode';
import {UriHelper as RenderingUriHelper} from '../rendering/UriHelper';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ImageUrlResolver} from '../util/ImageUrlResolver';
import {MediaAllowsPreviewRequest} from '../resource/MediaAllowsPreviewRequest';
import {EmulatedEvent} from '../event/EmulatedEvent';
import {UriHelper} from 'lib-admin-ui/util/UriHelper';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {ItemPreviewPanel} from 'lib-admin-ui/app/view/ItemPreviewPanel';
import {ImgEl} from 'lib-admin-ui/dom/ImgEl';
import {UrlHelper} from '../util/UrlHelper';
import {ContentSummary} from '../content/ContentSummary';
import {ContentResourceRequest} from '../resource/ContentResourceRequest';
import {ViewItem} from 'lib-admin-ui/app/view/ViewItem';
import {ItemPreviewToolbar} from 'lib-admin-ui/app/view/ItemPreviewToolbar';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';

enum PREVIEW_TYPE {
    IMAGE,
    SVG,
    PAGE,
    MEDIA,
    EMPTY,
    FAILED,
    MISSING,
    NOT_CONFIGURED,
}

export class ContentItemPreviewPanel
    extends ItemPreviewPanel<ViewItem> {

    protected image: ImgEl;
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
            this.wrapper.appendChild(this.image);
            this.wrapper.appendChild(this.noSelectionMessage);
            this.wrapper.appendChild(this.previewMessage);
            return rendered;
        });
    }

    private initElements() {
        this.image = new ImgEl();

        const selectorText = new SpanEl();
        selectorText.setHtml(i18n('panel.noselection'));
        this.noSelectionMessage = new DivEl('no-selection-message');
        this.noSelectionMessage.appendChild(selectorText);

        const previewText = new SpanEl();
        previewText.setHtml(i18n('field.preview.notAvailable'));
        this.previewMessage = new DivEl('no-preview-message');
        this.previewMessage.appendChild(previewText);
    }

    public setItem(item: ViewItem, force: boolean = false) {
        this.debouncedSetItem(item);
    }

    protected viewItemToContent(item: ViewItem): ContentSummaryAndCompareStatus {
        return <ContentSummaryAndCompareStatus>item;
    }

    protected doSetItem(item: ViewItem, force: boolean) {
        this.updatePreview(this.viewItemToContent(item), force);
        this.toolbar.setItem(item);
        this.item = item;
    }

    private updatePreview(item: ContentSummaryAndCompareStatus, force: boolean) {
        if (this.isPreviewUpdateNeeded(item, force)) {
            this.update(item);
        }
    }

    protected isPreviewUpdateNeeded(item: ContentSummaryAndCompareStatus, force: boolean): boolean {
        return !this.skipNextSetItemCall && this.isItemAllowsUpdate(item, force);
    }

    private isItemAllowsUpdate(item: ContentSummaryAndCompareStatus, force: boolean): boolean {
        return item && (!item.equals(this.item) || force);
    }

    protected update(item: ContentSummaryAndCompareStatus) {
        // fire the request anyway, if it's not renderable 418 will be returned
        this.setPagePreviewMode(item);
    }

    protected isImageForPreview(content: ContentSummary): boolean {
        return content.getType().isImage() || content.getType().isVectorMedia();
    }

    public clearItem() {
        (<ContentItemPreviewToolbar>this.toolbar).clearItem();
    }

    private setupListeners() {
        this.image.onLoaded((event: UIEvent) => {
            this.hideMask();
        });

        this.image.onError((event: UIEvent) => {
            this.setPreviewType(PREVIEW_TYPE.FAILED);
        });

        this.onShown((event) => {
            if (this.item && this.hasClass('image-preview')) {
                this.appendImageSizeToUrl(this.viewItemToContent(this.item));
            }
        });

        this.onHidden((event) => {
            if (this.mask.isVisible()) {
                this.hideMask();
            }
        });

        this.frame.onLoaded((event: UIEvent) => {
            const frameWindow = this.frame.getHTMLElement()['contentWindow'];

            try {
                if (frameWindow) {
                    frameWindow.addEventListener('click', this.frameClickHandler.bind(this));
                }
            } catch (error) { /* error */ }
        });

        EmulatedEvent.on((event: EmulatedEvent) => {
            this.frame.getEl().setMaxWidth(event.getWidthWithUnits());
            this.frame.getEl().setMaxHeight(event.getHeightWithUnits());

            this.image.getEl().setMaxWidth(event.getWidthWithUnits());
            this.image.getEl().setMaxHeight(event.getHeightWithUnits());

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

    createToolbar(): ItemPreviewToolbar<ViewItem> {
        return new ContentItemPreviewToolbar();
    }

    private getLinkClicked(event: UIEvent): string {
        if (event.target && (<any>event.target).tagName.toLowerCase() === 'a') {
            return (<any>event.target).href;
        }

        let el: Element = <Element>event.target;
        if (el) {
            while (el.parentNode) {
                el = <Element>el.parentNode;
                if (el.tagName && el.tagName.toLowerCase() === 'a') {
                    return (<any>el).href;
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

    private frameClickHandler(event: UIEvent) {
        const linkClicked: string = this.getLinkClicked(event);
        if (linkClicked) {
            const frameWindow = this.frame.getHTMLElement()['contentWindow'];
            if (!!frameWindow && !UriHelper.isNavigatingOutsideOfXP(linkClicked, frameWindow)) {
                const contentPreviewPath = UriHelper.trimUrlParams(
                    UriHelper.trimAnchor(UriHelper.trimWindowProtocolAndPortFromHref(linkClicked,
                        frameWindow)));
                if (!this.isNavigatingWithinSamePage(contentPreviewPath, frameWindow) && !this.isDownloadLink(contentPreviewPath)) {
                    event.preventDefault();
                    const clickedLinkRelativePath = '/' + UriHelper.trimWindowProtocolAndPortFromHref(linkClicked, frameWindow);
                    this.skipNextSetItemCall = true;
                    new ContentPreviewPathChangedEvent(contentPreviewPath).fire();
                    this.showMask();
                    setTimeout(() => {
                        this.item = null; // we don't have ref to content under contentPreviewPath and there is no point in figuring it out
                        this.skipNextSetItemCall = false;
                        this.frame.setSrc(clickedLinkRelativePath);
                    }, 500);
                }
            }
        }
    }

    private appendImageSizeToUrl(item: ContentSummaryAndCompareStatus) {
        const content = item.getContentSummary();

        const imgUrlResolver: ImageUrlResolver = new ImageUrlResolver(this.contentRootPath)
            .setContentId(content.getContentId())
            .setTimestamp(content.getModifiedTime())
            .setSize(this.getImageSize());

        this.image.setSrc(imgUrlResolver.resolveForPreview());
    }

    private getImageSize(): number {
        const imgWidth: number = this.getEl().getWidth();
        const imgHeight: number = this.getEl().getHeight() - this.toolbar.getEl().getHeight();
        return Math.max(imgWidth, imgHeight);
    }

    private setPreviewType(previewType: PREVIEW_TYPE) {

        if (this.previewType !== previewType) {

            this.getEl().removeClass('image-preview page-preview svg-preview media-preview no-preview');

            switch (previewType) {
            case PREVIEW_TYPE.PAGE: {
                this.getEl().addClass('page-preview');
                break;
            }
            case PREVIEW_TYPE.IMAGE: {
                this.getEl().addClass('image-preview');
                break;
            }
            case PREVIEW_TYPE.SVG: {
                this.getEl().addClass('svg-preview');
                break;
            }
            case PREVIEW_TYPE.MEDIA: {
                this.getEl().addClass('media-preview');
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

        if (PREVIEW_TYPE.FAILED === previewType || PREVIEW_TYPE.EMPTY === previewType || PREVIEW_TYPE.MISSING) {
            this.hideMask();
        }
    }

    protected isMediaForPreview(content: ContentSummary) {
        const type: ContentTypeName = content.getType();

        return type.isAudioMedia() ||
               type.isDocumentMedia() ||
               type.isTextMedia() ||
               type.isVideoMedia();
    }

    private showPreviewMessages(messages: string[]) {
        this.getEl().addClass('no-preview');
        this.previewMessage.removeChildren();

        messages.forEach((message: string) => {
            this.previewMessage.appendChild(SpanEl.fromText(message));
        });

        this.frame.setSrc('about:blank');
    }

    protected setMediaPreviewMode(item: ContentSummaryAndCompareStatus) {
        const contentSummary = item.getContentSummary();

        new MediaAllowsPreviewRequest(contentSummary.getContentId()).setContentRootPath(this.contentRootPath).sendAndParse().then(
            (allows: boolean) => {
                if (allows) {
                    this.setPreviewType(PREVIEW_TYPE.MEDIA);
                    if (this.isVisible()) {
                        this.frame.setSrc(UrlHelper.getCmsRestUri(
                            `${UrlHelper.getCMSPath(
                                this.contentRootPath)}/content/media/${contentSummary.getId()}?download=false#view=fit`));
                    }
                } else {
                    this.setPreviewType(PREVIEW_TYPE.EMPTY);
                }
            });
    }

    protected setImagePreviewMode(item: ContentSummaryAndCompareStatus) {
        const contentSummary: ContentSummary = item.getContentSummary();

        if (this.isVisible()) {
            const imgUrlResolver: ImageUrlResolver = new ImageUrlResolver(this.contentRootPath)
                .setContentId(contentSummary.getContentId())
                .setTimestamp(contentSummary.getModifiedTime());

            if (contentSummary.getType().isVectorMedia()) {
                this.setPreviewType(PREVIEW_TYPE.SVG);
            } else {
                imgUrlResolver.setSize(this.getImageSize());
                this.setPreviewType(PREVIEW_TYPE.IMAGE);
            }

            this.image.setSrc(imgUrlResolver.resolveForPreview());
        } else {
            this.setPreviewType(PREVIEW_TYPE.IMAGE);
        }
        if (!this.image.isLoaded()) {
            this.showMask();
        }
    }

    protected setPagePreviewMode(item: ContentSummaryAndCompareStatus) {
        this.showMask();
        const src: string = RenderingUriHelper.getPortalUri(!!item.getPath() ? item.getPath().toString() : '', RenderingMode.INLINE);
        // test if it returns no error( like because of used app was deleted ) first and show no preview otherwise
        $.ajax({
            type: 'HEAD',
            async: true,
            url: src
        }).done(() => {
            this.frame.setSrc(src);
            this.setPreviewType(PREVIEW_TYPE.PAGE);
        }).fail((reason: any) => {
            const contentSummary: ContentSummary = item.getContentSummary();
            if (this.isMediaForPreview(contentSummary)) {
                this.setMediaPreviewMode(item);
            } else if (this.isImageForPreview(contentSummary)) {
                this.setImagePreviewMode(item);
            } else {
                switch (reason.status) {
                case 404:
                    this.setPreviewType(PREVIEW_TYPE.EMPTY);
                    break;
                case 418:
                    this.setPreviewType(PREVIEW_TYPE.NOT_CONFIGURED);
                    break;
                default:
                    this.setPreviewType(PREVIEW_TYPE.FAILED);
                    break;
                }
            }
        });
    }

    public showMask() {
        if (this.isVisible()) {
            this.mask.show();
        }
    }

    private hideMask() {
        this.mask.hide();
    }

}
