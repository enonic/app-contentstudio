import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {type Element} from '@enonic/lib-admin-ui/dom/Element';
import {type IFrameEl} from '@enonic/lib-admin-ui/dom/IFrameEl';
import {IframeEventBus} from '@enonic/lib-admin-ui/event/IframeEventBus';
import {type Extension} from '@enonic/lib-admin-ui/extension/Extension';
import {StatusCode} from '@enonic/lib-admin-ui/rest/StatusCode';
import {type Action} from '@enonic/lib-admin-ui/ui/Action';
import {type Mask} from '@enonic/lib-admin-ui/ui/mask/Mask';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {listenKeys} from 'nanostores';
import Q from 'q';
import {PreviewLabelElement} from '../../v6/features/shared/PreviewLabel';
import {$app, getResolvedTheme} from '../../v6/features/store/app.store';
import {$isWidgetRenderable} from '../../v6/features/store/contextWidgets.store';
import {$autoModeWidgets, WIDGET_AUTO_DESCRIPTOR} from '../../v6/features/store/liveViewWidgets.store';
import {EmulatedDeviceEvent} from '../../v6/features/utils/dom/events/registry';
import {PreviewActionHelper} from '../action/PreviewActionHelper';
import {type ContentSummary} from '../content/ContentSummary';
import {ViewExtensionEvent} from '../event/ViewExtensionEvent';
import {RenderingMode} from '../rendering/RenderingMode';
import {EmulatorDevice} from './context/extension/emulator/EmulatorDevice';

export enum PREVIEW_TYPE {
    SUCCESS,
    EMPTY,
    FAILED,
    MISSING,
}

// Deferred-render protocol: a renderer whose renderability is only known in the
// browser (after the server probe passed) declares deferReveal:true in its probe
// widget data, then posts one RENDER_STATUS_EVENT once it knows. Content Studio
// holds the loading mask until then and never reveals such a renderer on load.
// Renderers echo the renderToken Content Studio put on their URL, so messages
// from a candidate a newer render has superseded can be dropped.
const RENDER_STATUS_EVENT = 'preview-render-status';

// Safety net only: a correct renderer always posts a status, so this never fires
// for one. It reveals anyway if a renderer dies without reporting, so a bug cannot
// wedge the mask open. Kept above the wrapper's own 4s probe timeout.
const RENDER_STATUS_TIMEOUT_MS = 6000;

type RenderStatus = 'ready' | 'unavailable';

interface RenderStatusData {
    status?: RenderStatus;
    contentId?: string;
    renderToken?: string;
    message?: string;
}

export class ExtensionRenderingHandler {

    private PREVIEW_HEADER_NAME = 'enonic-widget-data';

    protected readonly renderer: ExtensionRenderer;

    private previewType: PREVIEW_TYPE;

    private itemRenderable: Q.Promise<boolean> = Q(false);

    private previewHelper: PreviewActionHelper;

    private emptyView: DivEl;

    protected messageView: DivEl;

    private messageLabel: PreviewLabelElement;

    private summary: ContentSummary;

    private lastRenderKey: string;

    protected mode: RenderingMode;

    protected renderableChangedListeners: ((isRenderable: boolean, wasRenderable: boolean) => void)[] = [];

    private failedExtensions: Set<string> = new Set<string>();

    private renderedExtension: Extension;

    private renderedInAutoMode: boolean = false;

    private lastSelectedMode: Extension;

    private awaitingVerdict: boolean = false;

    private verdictTimeout: number;

    // render() bumps renderSeq; handlePreviewSuccess records the rendered candidate as shownSeq.
    // An iframe load whose shownSeq trails renderSeq belongs to a candidate a newer render has
    // already superseded (e.g. one that lost its verdict), so it must not reveal that content.
    private renderSeq: number = 0;

    private shownSeq: number = 0;


    constructor(renderer: ExtensionRenderer, previewHelper?: PreviewActionHelper) {
        this.renderer = renderer;
        this.mode = RenderingMode.INLINE;
        this.previewHelper = previewHelper || new PreviewActionHelper();
        this.emptyView = this.createEmptyView();
        this.messageView = this.createErrorView();
        this.setPreviewType(PREVIEW_TYPE.EMPTY);
    }


    public async render(summary: ContentSummary, extension: Extension): Promise<boolean> {

        const deferred = Q.defer<boolean>();
        const renderSeq = ++this.renderSeq;

        const wasRenderable = await this.isItemRenderable();
        this.itemRenderable = deferred.promise;

        if (!extension || !summary) {
            this.setPreviewType(PREVIEW_TYPE.EMPTY);
            deferred.resolve(false);
            return;
        }

        if (!this.summary?.getContentId().equals(summary.getContentId())) {
            this.failedExtensions.clear();
        }
        this.summary = summary;
        this.lastRenderKey = this.getRenderKey(summary, extension);
        this.lastSelectedMode = extension;
        this.clearVerdictWait(false);

        this.showMask();
        this.renderer.getPreviewAction()?.setEnabled(false);
        let isRenderable: boolean;

        $isWidgetRenderable.set(false);

        return this.doRender(summary, extension, renderSeq)
            .then((result) => {
                isRenderable = result.isRenderable();
                $isWidgetRenderable.set(isRenderable);

                if (isRenderable) {
                    this.handlePreviewSuccess(result.getResponse(), result.getData(), renderSeq);
                } else {
                    // handle last item failure meaning no one was successful
                    this.handlePreviewFailure(result.getResponse(), result.getData());
                }

                return isRenderable;
            })
            .catch((err) => {
                this.setPreviewType(PREVIEW_TYPE.FAILED);
                this.hideMask();
                isRenderable = false;

                return false;
            }).finally(() => {
                deferred.resolve(isRenderable);
                if (isRenderable !== wasRenderable) {
                    this.notifyRenderableChanged(isRenderable, wasRenderable);
                }
                return isRenderable;
            });
    }

    public isItemRenderable(): Q.Promise<boolean> {
        return this.itemRenderable;
    }

    public layout() {
        this.bindListeners();
        this.renderer.getMask()?.addClass('preview-load-mask');
        this.renderer.getChildrenContainer().appendChildren(this.emptyView, this.messageView);
    }

    public empty() {
        this.setPreviewType(PREVIEW_TYPE.EMPTY);
    }

    protected createEmptyView(): DivEl {
        return this.createMessageView(i18n('panel.noselection'), 'no-selection-message bg-surface-primary');
    }

    protected createErrorView(): DivEl {
        this.messageLabel = new PreviewLabelElement({messages: [this.getDefaultMessage()], showIcon: true, className: 'text-xl'});
        const wrapper = new DivEl('no-preview-message bg-surface-primary');
        wrapper.appendChild(this.messageLabel);
        return wrapper;
    }

    protected createMessageView(message: string, className?: string, showIcon?: boolean): DivEl {
        const wrapper = new DivEl(className);
        const label = new PreviewLabelElement({messages: [message], showIcon, className: 'text-xl'});
        wrapper.appendChild(label);
        return wrapper;
    }

    protected setPreviewType(previewType: PREVIEW_TYPE, messages?: string[]) {
        this.renderer.removeClass('extension-preview empty-preview message-preview');

        switch (previewType) {
            case PREVIEW_TYPE.SUCCESS: {
                this.renderer.addClass('extension-preview');
                break;
            }
            case PREVIEW_TYPE.FAILED: {
                this.renderer.addClass('message-preview');
            this.showPreviewMessages(messages || [i18n('field.preview.failed'), i18n('field.preview.failed.description')]);
                break;
            }
            case PREVIEW_TYPE.MISSING: {
                this.renderer.addClass('message-preview');
            this.showPreviewMessages(messages || [i18n('field.preview.failed'), i18n('field.preview.missing.description')]);
                break;
            }
            case PREVIEW_TYPE.EMPTY:
            default: {
                this.renderer.addClass('empty-preview');
                break;
            }
        }

        this.previewType = previewType;
    }

    protected showPreviewMessages(messages: string[]) {
        this.messageLabel.setProps({messages, showIcon: true});
    }

    protected handlePreviewSuccess(response: Response, data: Record<string, never>, renderSeq: number = this.renderSeq) {
        this.renderer.getPreviewAction()?.setEnabled(true);
        this.setPreviewType(PREVIEW_TYPE.SUCCESS);

        this.shownSeq = renderSeq;

        // A renderer that defers its reveal stays masked until its render-status arrives,
        // in every mode - so an explicitly selected one cannot flash a spinner either.
        this.awaitingVerdict = Boolean(data?.deferReveal);
        if (this.awaitingVerdict) {
            this.verdictTimeout = window.setTimeout(() => this.clearVerdictWait(true), RENDER_STATUS_TIMEOUT_MS);
        }

        const contentType = response.headers.get('content-type');
        let mainType = 'other';
        if (contentType) {
            mainType = contentType.split('/')[0];
        }

        this.renderer.getIFrameEl()
            .setSrc(response.url)
            .setClass(mainType);
    }

    protected handlePreviewFailure(response?: Response, data?: Record<string, never>) {
        // previewAction was set to false in the beginning of loading

        const statusCode = response.status;
        if (statusCode > 0) {

            const messages: string[] = (data?.messages as string[])?.length ? data.messages : undefined;

            switch (statusCode) {
                case StatusCode.NOT_FOUND:
                case StatusCode.I_AM_A_TEAPOT:
                    this.setPreviewType(PREVIEW_TYPE.MISSING, messages || [this.getDefaultMessage()]);
                    break;
                default:
                    this.setPreviewType(PREVIEW_TYPE.FAILED, messages);
                    break;
            }
            this.hideMask();
            return;
        }

        this.setPreviewType(PREVIEW_TYPE.EMPTY);
        this.hideMask();
    }

    protected getDefaultMessage(): string {
        return i18n('field.preview.notAvailable');
    }

    protected extractPreviewData(response: Response): Record<string, never> {
        try {
            const data = response.headers.get(this.PREVIEW_HEADER_NAME);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            // no data
        }
        return {};
    }

    private async doRender(summary: ContentSummary, selectedMode: Extension, renderToken: number): Promise<RenderResult> {
        if (!selectedMode || !summary) {
            return new RenderResult();
        }
        const isAuto = selectedMode.getDescriptorKey().getName() === WIDGET_AUTO_DESCRIPTOR;
        const items = isAuto
            ? $autoModeWidgets.get().filter((item) => !this.failedExtensions.has(item.getDescriptorKey().toString()))
            : [selectedMode];
        let response: Response;
        let extension: Extension;
        let isOk: boolean;
        let data: Record<string, never>;
        if (isAuto) {
            // clear previous preview url for this mode
            this.previewHelper.setPreviewUrl(selectedMode);
        }
        for (extension of items) {
            const url = this.previewHelper.getUrl(summary, extension, this.mode) + '&auto=' + isAuto
                        + '&renderToken=' + renderToken;
            response = await fetch(url, {method: 'HEAD', credentials: 'include'});

            data = this.extractPreviewData(response);
            if (data.redirect) {
                // follow redirect manually to get data headers first
                try {
                    response = await fetch(data.redirect, {method: 'HEAD', credentials: 'include'});
                } catch (e) {
                    response = this.createErrorResponse(e, data.redirect);
                }
            }

            isOk = this.isResponseOk(response, isAuto);
            if (isOk) {
                break;
            }
        }
        if (isOk) {
            this.renderedExtension = extension;
            this.renderedInAutoMode = isAuto;
        }
        if (isAuto && isOk) {
            // don't save the final url, because they are different for different modes
            this.previewHelper.setPreviewUrl(selectedMode, extension.getFullUrl());
        }

        return new RenderResult(isOk, extension, response, data);
    }

    private isResponseOk(response: Response, isAuto: boolean) {
        return response.ok || !isAuto && response.status !== StatusCode.I_AM_A_TEAPOT;
    }

    private createErrorResponse(error: Error, url: string): Response {
        const resp = new Response(null, {
            status: StatusCode.NOT_FOUND,
            statusText: error.message || 'Endpoint not reachable'
        });
        // The url property cannot be set via the constructor, so we define it manually
        Object.defineProperty(resp, 'url', {value: url, writable: false, enumerable: true, configurable: false})
        return resp;
    }

    private applyImageStyles(frameWindow: Window) {
        const body = frameWindow.document.body;
        if (body) {
            body.style.display = 'flex';
            body.style.justifyContent = 'center';
            body.style.alignItems = 'center';
            // Apply theme-aware background color
            const isDark = getResolvedTheme() === 'dark';
            body.style.backgroundColor = isDark ? '#242829' : '#ffffff';
        }

        let img: HTMLImageElement | SVGElement = frameWindow.document.querySelector('svg');
        if (img) {
            img.style.margin = '0 auto';
            img.style.height = '100%';
        } else {
            img = frameWindow.document.querySelector('body > img');
        }
        if (img) {
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100%';
        }
    }

    protected handleExtensionEvent(event: ViewExtensionEvent) {
        if (!this.summary) {
            return;
        }

        const extension = event.getExtension();

        // Skip re-render already done by the selection path (#10838).
        if (this.getRenderKey(this.summary, extension) === this.lastRenderKey) {
            return;
        }

        void this.render(this.summary, extension);
    }

    private getRenderKey(summary?: ContentSummary, extension?: Extension): string {
        return `${summary?.getId() ?? ''}:${extension?.getDescriptorKey().toString() ?? ''}`;
    }

    protected handleRenderStatus(data: RenderStatusData) {
        if (!this.summary || data?.contentId !== this.summary.getContentId().toString()) {
            return; // stale: a different content is selected now
        }
        if (data?.renderToken != null && Number(data.renderToken) !== this.renderSeq) {
            return; // stale: a newer render has superseded this candidate
        }
        if (data?.status === 'ready') {
            this.clearVerdictWait(true);
            return;
        }
        if (!this.renderedInAutoMode || !this.renderedExtension) {
            // explicit selection: Content Studio owns the failure view
            this.showUnavailable(data?.message);
            return;
        }
        const failedKey = this.renderedExtension.getDescriptorKey().toString();
        if (this.failedExtensions.has(failedKey)) {
            return;
        }
        const hasOtherCandidates = $autoModeWidgets.get()
            .some((item) => {
                const key = item.getDescriptorKey().toString();
                return key !== failedKey && !this.failedExtensions.has(key);
            });
        if (!hasOtherCandidates) {
            // last candidate: Content Studio shows its own failure view, not the renderer's
            this.showUnavailable(data?.message);
            return;
        }
        this.failedExtensions.add(failedKey);
        void this.render(this.summary, this.lastSelectedMode);
    }

    private showUnavailable(message?: string) {
        this.clearVerdictWait(false);
        this.setPreviewType(PREVIEW_TYPE.FAILED, message ? [message] : undefined);
        this.hideMask();
    }

    private clearVerdictWait(reveal: boolean) {
        if (this.verdictTimeout) {
            window.clearTimeout(this.verdictTimeout);
            this.verdictTimeout = null;
        }
        this.awaitingVerdict = false;
        if (reveal) {
            this.hideMask();
        }
    }

    protected handleEmulatorEvent(device: EmulatorDevice) {
        if (this.messageView) {
            this.messageView.getEl().setWidth(device.getWidthWithUnits());
            this.messageView.getEl().setHeight(device.getHeightWithUnits());
        }

        // Keep no selection message intact,
        // Since no toolbar shown when no content is selected
        const subjects = [
            this.renderer.getIFrameEl().getHTMLElement(),
            this.messageView.getHTMLElement()
        ];

        const isFullscreen = device.equals(EmulatorDevice.getFullscreen())|| !device.isValid();

        subjects.forEach(s => {
            s.style.width = !isFullscreen ? device.getWidthWithUnits() : '';
            s.style.height = !isFullscreen ? device.getHeightWithUnits() : '';
        });

        this.renderer.getEl().toggleClass('emulated', !isFullscreen);
    }

    protected bindListeners() {
        ViewExtensionEvent.on(this.handleExtensionEvent.bind(this));
        EmulatedDeviceEvent.listen(this.handleEmulatorEvent.bind(this));
        IframeEventBus.get().onEvent(RENDER_STATUS_EVENT, (event) => {
            // the bus delivers the parsed message detail, not an IframeEvent
            this.handleRenderStatus(event as unknown as RenderStatusData);
        });

        const iframe = this.renderer.getIFrameEl();
        let unsubscribeTheme: () => void;
        iframe.onLoaded((event: UIEvent) => {
            if (this.previewType === PREVIEW_TYPE.EMPTY) {
                return;
            }
            // Ignore a load for a candidate a newer render has superseded; revealing it would
            // briefly flash the outgoing candidate before the next one renders.
            if (this.shownSeq !== this.renderSeq) {
                return;
            }
            // Subscribe to theme changes to update image background
            unsubscribeTheme = listenKeys($app, ['theme'], () => {
                if (iframe.getClass() === 'image') {
                    const frameWindow = iframe.getHTMLElement()['contentWindow'];
                    if (frameWindow) {
                        this.applyImageStyles(frameWindow);
                    }
                }
            });

            if (!this.awaitingVerdict) {
                this.hideMask();
            }

            const frameWindow = iframe.getHTMLElement()['contentWindow'];

            switch (iframe.getClass()) {
                case 'image':
                    this.applyImageStyles(frameWindow);
                    break;
                case 'text':
                    break;
                default:
                    break;
            }
        });
        iframe.unLoaded(() => unsubscribeTheme?.());
    }

    public showMask() {
        if (this.renderer.hasClass('empty-preview')) {
            return;
        }
        // The 'loading' class hides the iframe wrapper via CSS, so it must apply even when
        // the panel has no layout yet - e.g. the first render after a full page reload -
        // otherwise the iframe paints uncovered before the panel becomes visible. The spinner
        // needs a laid-out panel to position over, so it stays gated on visibility.
        this.renderer.addClass('loading');
        if (this.renderer.isVisible()) {
            this.renderer.getMask()?.show();
        }
    }

    public hideMask() {
        this.renderer.getMask()?.hide();
        this.renderer.removeClass('loading');
    }

    public onRenderableChanged(listener: (isRenderable: boolean, wasRenderable: boolean) => void) {
        this.renderableChangedListeners.push(listener);
    }

    public unRenderableChanged(listener: (isRenderable: boolean, wasRenderable: boolean) => void) {
        this.renderableChangedListeners = this.renderableChangedListeners.filter(l => l !== listener);
    }

    protected notifyRenderableChanged(isRenderable: boolean, wasRenderable: boolean) {
        this.renderableChangedListeners.forEach(listener => listener(isRenderable, wasRenderable));
    }
}

export interface ExtensionRenderer
    extends Element {

    getIFrameEl(): IFrameEl;

    getChildrenContainer(): DivEl;

    getPreviewAction(): Action;

    getMask(): Mask;
}

class RenderResult {
    private readonly renderable: boolean;
    private readonly extension: Extension;
    private readonly response: Response;
    private readonly data: Record<string, never>;

    constructor(renderable: boolean = false, extension?: Extension, response?: Response, data?: Record<string, never>) {
        this.renderable = renderable;
        this.extension = extension;
        this.response = response;
        this.data = data;
    }

    public isRenderable(): boolean {
        return this.renderable;
    }

    public getExtension(): Extension {
        return this.extension;
    }

    public getResponse(): Response {
        return this.response;
    }

    public getData(): Record<string, never> {
        return this.data;
    }
}
