import { DivEl } from '@enonic/lib-admin-ui/dom/DivEl';
import { type Element } from '@enonic/lib-admin-ui/dom/Element';
import { type IFrameEl } from '@enonic/lib-admin-ui/dom/IFrameEl';
import { type Extension } from '@enonic/lib-admin-ui/extension/Extension';
import { StatusCode } from '@enonic/lib-admin-ui/rest/StatusCode';
import { type Action } from '@enonic/lib-admin-ui/ui/Action';
import { type Mask } from '@enonic/lib-admin-ui/ui/mask/Mask';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { listenKeys, type StoreValue } from 'nanostores';
import Q from 'q';
import { PreviewLabelElement } from '../../v6/shared/ui/PreviewLabel';
import { $app, getResolvedTheme } from '../../v6/shared/app-state/app.store';
import { $autoModeWidgets, WIDGET_AUTO_DESCRIPTOR } from '../../v6/widgets/inspectors/model/liveViewWidgets.store';
import {
    $isLivePreviewRenderable,
    $previewResolution,
    clearPreview,
    isFrameRenderable,
    requestPreview,
    whenPreviewSettled,
} from '../../v6/widgets/preview-panel/model/previewResolution.store';
import { type PreviewRequest, type PreviewResult } from '../../v6/widgets/preview-panel/model/previewResolution.types';
import { EmulatedDeviceEvent } from '../../v6/shared/lib/dom/events/registry';
import { PreviewActionHelper } from '../action/PreviewActionHelper';
import { type ContentSummary } from '../content/ContentSummary';
import { ViewExtensionEvent } from '../event/ViewExtensionEvent';
import { RenderingMode } from '../rendering/RenderingMode';
import { EmulatorDevice } from './context/extension/emulator/EmulatorDevice';

export enum PREVIEW_TYPE {
    SUCCESS,
    EMPTY,
    FAILED,
    MISSING,
}

type RenderableListener = (isRenderable: boolean, wasRenderable: boolean) => void;

export type FailedPreviewResult = Exclude<PreviewResult, { kind: 'ready' }>;

// Presents the preview resolved by `previewResolution.service` in the renderer's iframe.
export class ExtensionRenderingHandler {
    protected readonly renderer: ExtensionRenderer;

    private previewType: PREVIEW_TYPE;

    private previewHelper: PreviewActionHelper;

    private emptyView: DivEl;

    protected messageView: DivEl;

    private messageLabel: PreviewLabelElement;

    private summary: ContentSummary;

    private lastRenderKey: string;

    protected mode: RenderingMode;

    private readonly renderableListeners = new Map<RenderableListener, () => void>();

    private shownRequestId: number | undefined;

    private appliedRequestId: number | undefined;

    private readonly unsubscribeResolution: () => void;

    constructor(renderer: ExtensionRenderer, previewHelper?: PreviewActionHelper) {
        this.renderer = renderer;
        this.mode = RenderingMode.INLINE;
        this.previewHelper = previewHelper || new PreviewActionHelper();
        this.emptyView = this.createEmptyView();
        this.messageView = this.createErrorView();
        this.setPreviewType(PREVIEW_TYPE.EMPTY);
        this.unsubscribeResolution = $previewResolution.subscribe((state) => this.handleResolutionChange(state));
    }

    public render(summary: ContentSummary, extension: Extension): Promise<boolean> {
        if (!extension || !summary) {
            clearPreview();
            this.setPreviewType(PREVIEW_TYPE.EMPTY);
            return Promise.resolve(false);
        }

        this.summary = summary;
        this.lastRenderKey = this.getRenderKey(summary, extension);

        requestPreview(this.createPreviewRequest(summary, extension));

        return whenPreviewSettled().then(isFrameRenderable);
    }

    public isItemRenderable(): Q.Promise<boolean> {
        return Q(whenPreviewSettled()).then(isFrameRenderable);
    }

    public layout() {
        this.bindListeners();
        this.renderer.getMask()?.addClass('preview-load-mask');
        this.renderer.getChildrenContainer().appendChildren(this.emptyView, this.messageView);
    }

    public empty() {
        clearPreview();
        this.setPreviewType(PREVIEW_TYPE.EMPTY);
    }

    public destroy(): void {
        this.unsubscribeResolution();
        this.renderableListeners.forEach((unsubscribe) => unsubscribe());
        this.renderableListeners.clear();
        clearPreview();
    }

    protected shouldShowFrame(_extension: Extension): boolean {
        return true;
    }

    private createPreviewRequest(summary: ContentSummary, extension: Extension): Omit<PreviewRequest, 'id'> {
        const auto = extension.getDescriptorKey().getName() === WIDGET_AUTO_DESCRIPTOR;
        const extensions = auto ? $autoModeWidgets.get() : [extension];
        const candidates = extensions.map((candidate) => ({
            extension: candidate,
            url: `${this.previewHelper.getUrl(summary, candidate, this.mode)}&auto=${auto}`,
        }));

        return { candidates, auto, showFrame: this.shouldShowFrame(extension) };
    }

    private handleResolutionChange({ request, pending, result }: StoreValue<typeof $previewResolution>): void {
        if (pending) {
            if (request.id === this.shownRequestId) return;
            this.shownRequestId = request.id;
            this.renderer.getPreviewAction()?.setEnabled(false);
            if (request.showFrame) {
                this.showMask();
            }
            return;
        }

        if (result == null) {
            this.hideMask();
            return;
        }

        if (result.requestId === this.appliedRequestId) return;
        this.appliedRequestId = result.requestId;

        if (result.kind === 'ready') {
            this.handlePreviewSuccess(result);
        } else {
            this.handlePreviewFailure(result);
        }
    }

    protected createEmptyView(): DivEl {
        return this.createMessageView(i18n('panel.noselection'), 'no-selection-message bg-surface-primary');
    }

    protected createErrorView(): DivEl {
        this.messageLabel = new PreviewLabelElement({
            messages: [this.getDefaultMessage()],
            showIcon: true,
            className: 'text-xl',
        });
        const wrapper = new DivEl('no-preview-message bg-surface-primary');
        wrapper.appendChild(this.messageLabel);
        return wrapper;
    }

    protected createMessageView(message: string, className?: string, showIcon?: boolean): DivEl {
        const wrapper = new DivEl(className);
        const label = new PreviewLabelElement({ messages: [message], showIcon, className: 'text-xl' });
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
                this.showPreviewMessages(
                    messages || [i18n('field.preview.failed'), i18n('field.preview.failed.description')],
                );
                break;
            }
            case PREVIEW_TYPE.MISSING: {
                this.renderer.addClass('message-preview');
                this.showPreviewMessages(
                    messages || [i18n('field.preview.failed'), i18n('field.preview.missing.description')],
                );
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
        this.messageLabel.setProps({ messages, showIcon: true });
    }

    protected handlePreviewSuccess(result: Extract<PreviewResult, { kind: 'ready' }>) {
        this.renderer.getPreviewAction()?.setEnabled(true);
        this.setPreviewType(PREVIEW_TYPE.SUCCESS);

        if (!result.showFrame) {
            this.hideMask();
            return;
        }

        this.renderer.getIFrameEl().setSrc(result.frameUrl).setClass(result.mediaType);
    }

    protected handlePreviewFailure(result: FailedPreviewResult) {
        // previewAction was disabled when the request started

        if (result.kind === 'error') {
            this.setPreviewType(PREVIEW_TYPE.FAILED);
            this.hideMask();
            return;
        }

        if (result.status > 0) {
            const messages: string[] = result.data.messages?.length ? result.data.messages : undefined;

            switch (result.status) {
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

    protected handleEmulatorEvent(device: EmulatorDevice) {
        if (this.messageView) {
            this.messageView.getEl().setWidth(device.getWidthWithUnits());
            this.messageView.getEl().setHeight(device.getHeightWithUnits());
        }

        // Keep no selection message intact,
        // Since no toolbar shown when no content is selected
        const subjects = [this.renderer.getIFrameEl().getHTMLElement(), this.messageView.getHTMLElement()];

        const isFullscreen = device.equals(EmulatorDevice.getFullscreen()) || !device.isValid();

        subjects.forEach((s) => {
            s.style.width = !isFullscreen ? device.getWidthWithUnits() : '';
            s.style.height = !isFullscreen ? device.getHeightWithUnits() : '';
        });

        this.renderer.getEl().toggleClass('emulated', !isFullscreen);
    }

    protected bindListeners() {
        ViewExtensionEvent.on(this.handleExtensionEvent.bind(this));
        EmulatedDeviceEvent.listen(this.handleEmulatorEvent.bind(this));

        const iframe = this.renderer.getIFrameEl();
        let unsubscribeTheme: () => void;
        iframe.onLoaded((event: UIEvent) => {
            if (this.previewType === PREVIEW_TYPE.EMPTY) {
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

            // A late load of the previous page must not lift the mask of a newer request.
            if (!$previewResolution.get().pending) {
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
        if (this.renderer.isVisible()) {
            this.renderer.getMask()?.show();
            this.renderer.addClass('loading');
        }
    }

    public hideMask() {
        this.renderer.getMask()?.hide();
        this.renderer.removeClass('loading');
    }

    public onRenderableChanged(listener: RenderableListener) {
        if (this.renderableListeners.has(listener)) return;
        const unsubscribe = $isLivePreviewRenderable.listen((isRenderable) => listener(isRenderable, !isRenderable));
        this.renderableListeners.set(listener, unsubscribe);
    }

    public unRenderableChanged(listener: RenderableListener) {
        this.renderableListeners.get(listener)?.();
        this.renderableListeners.delete(listener);
    }
}

export interface ExtensionRenderer extends Element {
    getIFrameEl(): IFrameEl;

    getChildrenContainer(): DivEl;

    getPreviewAction(): Action;

    getMask(): Mask;
}
