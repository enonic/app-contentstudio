import * as $ from 'jquery';
import * as Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {ContentPreviewPathChangedEvent} from './ContentPreviewPathChangedEvent';
import {ContentItemPreviewToolbar} from './ContentItemPreviewToolbar';
import {RenderingMode} from '../rendering/RenderingMode';
import {UriHelper as RenderingUriHelper} from '../rendering/UriHelper';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ImageUrlResolver} from '../util/ImageUrlResolver';
import {MediaAllowsPreviewRequest} from '../resource/MediaAllowsPreviewRequest';
import {EmulatedEvent} from '../event/EmulatedEvent';
import {ViewItem} from 'lib-admin-ui/app/view/ViewItem';
import {UriHelper} from 'lib-admin-ui/util/UriHelper';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {ItemPreviewPanel} from 'lib-admin-ui/app/view/ItemPreviewPanel';
import {ImgEl} from 'lib-admin-ui/dom/ImgEl';
import {BrEl} from 'lib-admin-ui/dom/BrEl';
import {UrlHelper} from '../util/UrlHelper';
import {ProjectContext} from '../project/ProjectContext';

enum PREVIEW_TYPE {
    IMAGE,
    SVG,
    PAGE,
    MEDIA,
    EMPTY,
    FAILED,
    BLANK
}

export class ContentItemPreviewPanel
    extends ItemPreviewPanel<ContentSummaryAndCompareStatus> {

    private image: ImgEl;
    private item: ViewItem<ContentSummaryAndCompareStatus>;
    private skipNextSetItemCall: boolean = false;
    private previewType: PREVIEW_TYPE;
    private previewMessage: DivEl;
    private noSelectionMessage: DivEl;
    private debouncedSetItem: (item: ViewItem<ContentSummaryAndCompareStatus>) => void;

    constructor() {
        super('content-item-preview-panel');

        this.debouncedSetItem = AppHelper.runOnceAndDebounce(this.doSetItem.bind(this), 300);

        this.initElements();
        this.setupListeners();

        if (!ProjectContext.get().isInitialized()) {
            this.handleProjectNotSet();
        }
    }

    private handleProjectNotSet() {
        this.noSelectionMessage.getFirstChild().setHtml(i18n('settings.projects.nopermissions'));

        const projectSetHandler = () => {
            this.noSelectionMessage.getFirstChild().setHtml(i18n('panel.noselection'));
            ProjectContext.get().unProjectChanged(projectSetHandler);
        };

        ProjectContext.get().onProjectChanged(projectSetHandler);
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

    public setItem(item: ViewItem<ContentSummaryAndCompareStatus>, force: boolean = false) {
        this.debouncedSetItem(item);
    }

    private doSetItem(item: ViewItem<ContentSummaryAndCompareStatus>, force: boolean) {
        if (item && !this.skipNextSetItemCall && (!item.equals(this.item) || force)) {
            if (typeof item.isRenderable() === 'undefined') {
                return;
            }

            const contentSummary = item.getModel().getContentSummary();

            if (this.isMediaForPreview(contentSummary)) {

                this.setMediaPreviewMode(item);

            } else if (contentSummary.getType().isImage() || contentSummary.getType().isVectorMedia()) {

                this.setImagePreviewMode(item);

            } else {

                this.setPagePreviewMode(item);

            }
        }
        this.toolbar.setItem(item.getModel());
        this.item = item;
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
                this.addImageSizeToUrl(this.item);
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
            this.frame.getEl().setWidth(event.getWidthWithUnits());
            this.frame.getEl().setHeight(event.getHeightWithUnits());

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

    private addImageSizeToUrl(item: ViewItem<ContentSummaryAndCompareStatus>) {
        const imgWidth = this.getEl().getWidth();
        const imgHeight = this.getEl().getHeight() - this.toolbar.getEl().getHeight();
        const imgSize = Math.max(imgWidth, imgHeight);
        const content = item.getModel().getContentSummary();

        const imgUrlResolver = new ImageUrlResolver()
            .setContentId(content.getContentId())
            .setTimestamp(content.getModifiedTime())
            .setSize(imgSize);

        this.image.setSrc(imgUrlResolver.resolveForPreview());
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
            case PREVIEW_TYPE.BLANK: {
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

    private isMediaForPreview(content: ContentSummary) {
        if (!content) {
            return false;
        }
        const type = content.getType();

        return type.isAudioMedia() ||
               type.isDocumentMedia() ||
               type.isTextMedia() ||
               type.isVideoMedia();
    }

    private showPreviewMessages(messages: string[]) {
        this.getEl().addClass('no-preview');
        this.previewMessage.removeChildren();

        messages.forEach((message: string, index: number) => {
            this.previewMessage.appendChild(SpanEl.fromText(message));
            const isLastMessage = index === messages.length - 1;
            if (!isLastMessage) {
                this.previewMessage.appendChild<any>(new BrEl());
            }
        });

        this.frame.setSrc('about:blank');
    }

    private setMediaPreviewMode(item: ViewItem<ContentSummaryAndCompareStatus>) {
        const contentSummary = item.getModel().getContentSummary();

        new MediaAllowsPreviewRequest(contentSummary.getContentId()).sendAndParse().then((allows: boolean) => {
            if (allows) {
                this.setPreviewType(PREVIEW_TYPE.MEDIA);
                if (this.isVisible()) {
                    this.frame.setSrc(UriHelper.getRestUri(
                        `${UrlHelper.getCMSPath()}/content/media/${contentSummary.getId()}?download=false#view=fit`));
                }
            } else {
                this.setPreviewType(PREVIEW_TYPE.EMPTY);
            }
        });
    }

    private setImagePreviewMode(item: ViewItem<ContentSummaryAndCompareStatus>) {
        const contentSummary = item.getModel().getContentSummary();

        if (this.isVisible()) {
            if (contentSummary.getType().isVectorMedia()) {
                this.setPreviewType(PREVIEW_TYPE.SVG);

                const imgUrl = new ImageUrlResolver()
                    .setContentId(contentSummary.getContentId())
                    .setTimestamp(contentSummary.getModifiedTime())
                    .resolveForPreview();

                this.image.setSrc(imgUrl);
            } else {
                this.addImageSizeToUrl(item);
                this.setPreviewType(PREVIEW_TYPE.IMAGE);
            }
        } else {
            this.setPreviewType(PREVIEW_TYPE.IMAGE);
        }
        if (!this.image.isLoaded()) {
            this.showMask();
        }
    }

    private setPagePreviewMode(item: ViewItem<ContentSummaryAndCompareStatus>) {
        this.showMask();
        if (item.isRenderable()) {
            this.setPreviewType(PREVIEW_TYPE.PAGE);
            const src = RenderingUriHelper.getPortalUri(item.getPath(), RenderingMode.INLINE);
            // test if it returns no error( like because of used app was deleted ) first and show no preview otherwise
            $.ajax({
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

    public showMask() {
        if (this.isVisible()) {
            this.mask.show();
        }
    }

    private hideMask() {
        this.mask.hide();
    }

}
