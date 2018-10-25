import {ContentPreviewPathChangedEvent} from './ContentPreviewPathChangedEvent';
import {ContentItemPreviewToolbar} from './ContentItemPreviewToolbar';
import {RenderingMode} from '../rendering/RenderingMode';
import {UriHelper as RenderingUriHelper} from '../rendering/UriHelper';
import {Branch} from '../versioning/Branch';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import ViewItem = api.app.view.ViewItem;
import UriHelper = api.util.UriHelper;
import ContentTypeName = api.schema.content.ContentTypeName;
import PEl = api.dom.PEl;
import i18n = api.util.i18n;
import {ImagePreviewUrlResolver} from '../util/ImageUrlResolver';

enum PREVIEW_TYPE {
    IMAGE,
    SVG,
    PAGE,
    EMPTY,
    FAILED,
    BLANK
}

export class ContentItemPreviewPanel
    extends api.app.view.ItemPreviewPanel<ContentSummaryAndCompareStatus> {

    private image: api.dom.ImgEl;
    private item: ViewItem<ContentSummaryAndCompareStatus>;
    private skipNextSetItemCall: boolean = false;
    private previewType: PREVIEW_TYPE;
    private previewMessageEl: PEl;

    constructor() {
        super('content-item-preview-panel');
        this.image = new api.dom.ImgEl();
        this.image.onLoaded((event: UIEvent) => {
            this.hideMask();
            let imgEl = this.image.getEl();
            let myEl = this.getEl();
            this.centerImage(imgEl.getWidth(), imgEl.getHeight(), myEl.getWidth(), myEl.getHeight());
        });

        this.image.onError((event: UIEvent) => {
            this.setPreviewType(PREVIEW_TYPE.FAILED);
        });

        this.appendChild(this.image);

        api.ui.responsive.ResponsiveManager.onAvailableSizeChanged(this, (item: api.ui.responsive.ResponsiveItem) => {
            if (this.hasClass('image-preview')) {
                let imgEl = this.image.getEl();
                let el = this.getEl();
                this.centerImage(imgEl.getWidth(), imgEl.getHeight(), el.getWidth(), el.getHeight());
            }
        });

        this.onShown((event) => {
            if (this.item && this.hasClass('image-preview')) {
                this.setImageSrc(this.item);
            }
        });

        this.onHidden((event) => {
            if (this.mask.isVisible()) {
                this.hideMask();
            }
        });

        this.frame.onLoaded((event: UIEvent) => {
            let frameWindow = this.frame.getHTMLElement()['contentWindow'];

            try {
                if (frameWindow) {
                    frameWindow.addEventListener('click', this.frameClickHandler.bind(this));
                }
            } catch (error) { /* error */ }
        });
    }

    private frameClickHandler(event: UIEvent) {
        let linkClicked: string = this.getLinkClicked(event);
        if (linkClicked) {
            let frameWindow = this.frame.getHTMLElement()['contentWindow'];
            if (!!frameWindow && !UriHelper.isNavigatingOutsideOfXP(linkClicked, frameWindow)) {
                let contentPreviewPath = UriHelper.trimUrlParams(
                    UriHelper.trimAnchor(UriHelper.trimWindowProtocolAndPortFromHref(linkClicked,
                    frameWindow)));
                if (!this.isNavigatingWithinSamePage(contentPreviewPath, frameWindow) && !this.isDownloadLink(contentPreviewPath)) {
                    event.preventDefault();
                    let clickedLinkRelativePath = '/' + UriHelper.trimWindowProtocolAndPortFromHref(linkClicked, frameWindow);
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

    createToolbar(): ContentItemPreviewToolbar {
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
        let href = frameWindow.location.href;
        return contentPreviewPath === UriHelper.trimAnchor(UriHelper.trimWindowProtocolAndPortFromHref(href, frameWindow));
    }

    private isDownloadLink(contentPreviewPath: string): boolean {
        return contentPreviewPath.indexOf('attachment/download') > 0;
    }

    private centerImage(imgWidth: number, imgHeight: number, myWidth: number, myHeight: number) {
        let imgMarginTop = 0;
        if (imgHeight < myHeight) {
            // image should be centered vertically
            imgMarginTop = (myHeight - imgHeight) / 2;
        }
        this.image.getEl().setMarginTop(imgMarginTop + 'px');

    }

    private setImageSrc(item: ViewItem<ContentSummaryAndCompareStatus>) {
        const content = item.getModel().getContentSummary();
        const resolver = new ImagePreviewUrlResolver()
            .setContentId(content.getContentId())
            .setTimestamp(content.getModifiedTime());

        if (content.getType().equals(ContentTypeName.MEDIA_VECTOR)) {
            resolver.setUseOriginal(true);
        } else {
            const imgSize = Math.max(this.getEl().getWidth(), this.getEl().getHeight());
            resolver.setSize(imgSize);
        }

        const imgUrl = resolver.resolve();
        this.image.setSrc(imgUrl);
    }

    public setItem(item: ViewItem<ContentSummaryAndCompareStatus>, force: boolean = false) {
        if (item && !this.skipNextSetItemCall && (!item.equals(this.item) || force)) {
            if (typeof item.isRenderable() === 'undefined') {
                return;
            }
            if (item.getModel().getContentSummary().getType().isImage() ||
                item.getModel().getContentSummary().getType().isVectorMedia()) {

                if (this.isVisible()) {
                    if (item.getModel().getContentSummary().getType().equals(ContentTypeName.MEDIA_VECTOR)) {
                        this.setPreviewType(PREVIEW_TYPE.SVG);
                    } else {
                        this.setPreviewType(PREVIEW_TYPE.IMAGE);
                    }

                    this.setImageSrc(item);
                } else {
                    this.setPreviewType(PREVIEW_TYPE.IMAGE);
                }
                if (!this.image.isLoaded()) {
                    this.showMask();
                }
            } else {
                this.showMask();
                if (item.isRenderable()) {
                    this.setPreviewType(PREVIEW_TYPE.PAGE);
                    let src = RenderingUriHelper.getPortalUri(item.getPath(), RenderingMode.INLINE, Branch.DRAFT);
                    // test if it returns no error( like because of used app was deleted ) first and show no preview otherwise
                    wemjq.ajax({
                        type: 'HEAD',
                        async: true,
                        url: src
                    }).done(() => {
                        this.frame.setSrc(src);
                    }).fail(() => this.setPreviewType(PREVIEW_TYPE.FAILED));
                } else {
                    this.setPreviewType(PREVIEW_TYPE.EMPTY);
                }
            }
        }
        this.toolbar.setItem(item.getModel());
        this.item = item;
    }

    public getItem(): ViewItem<ContentSummaryAndCompareStatus> {
        return this.item;
    }

    public setBlank() {
        this.setPreviewType(PREVIEW_TYPE.BLANK);
        this.frame.setSrc('about:blank');
    }

    private setPreviewType(previewType: PREVIEW_TYPE) {

        if (this.previewType !== previewType) {

            this.getEl().removeClass('image-preview page-preview svg-preview no-preview');

            if (this.previewMessageEl) {
                this.previewMessageEl.remove();
                this.previewMessageEl = null;
            }

            switch (previewType) {
            case PREVIEW_TYPE.PAGE:
            {
                this.getEl().addClass('page-preview');
                break;
            }
            case PREVIEW_TYPE.IMAGE:
            {
                this.getEl().addClass('image-preview');
                break;
            }
            case PREVIEW_TYPE.SVG:
            {
                this.getEl().addClass('svg-preview');
                break;
            }
            case PREVIEW_TYPE.EMPTY:
            {
                this.showPreviewMessage(i18n('field.preview.notAvailable'));
                break;
            }
            case PREVIEW_TYPE.FAILED:
            {
                this.showPreviewMessage(i18n('field.preview.failed'));
                break;
            }
            case PREVIEW_TYPE.BLANK:
            {
                this.getEl().addClass('no-preview');
                break;
            }
            }
        }

        this.previewType = previewType;

        if (PREVIEW_TYPE.FAILED === previewType || PREVIEW_TYPE.EMPTY === previewType) {
            this.hideMask();
        }
    }

    private showPreviewMessage(value: string, escapeHtml: boolean = false) {
        this.getEl().addClass('no-preview');

        this.appendChild(this.previewMessageEl = new PEl('no-preview-message').setHtml(value, false));

        this.frame.setSrc('about:blank');
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
