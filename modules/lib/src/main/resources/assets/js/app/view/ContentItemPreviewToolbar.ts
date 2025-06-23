import * as Q from 'q';
import {ContentStatusToolbar} from '../ContentStatusToolbar';
import {ActionButton} from '@enonic/lib-admin-ui/ui/button/ActionButton';
import {PreviewWidgetDropdown} from './toolbar/PreviewWidgetDropdown';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {PreviewActionHelper} from '../action/PreviewActionHelper';
import {EmulatorDropdown} from './toolbar/EmulatorDropdown';
import {AriaRole} from '@enonic/lib-admin-ui/ui/WCAG';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {BrowserHelper} from '@enonic/lib-admin-ui/BrowserHelper';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {RenderingMode} from '../rendering/RenderingMode';

export class ContentItemPreviewToolbar
    extends ContentStatusToolbar {

    ariaLabel: string = i18n('wcag.preview.toolbar.label');

    private widgetSelector: PreviewWidgetDropdown;
    private emulatorSelector: EmulatorDropdown;
    private previewButton: ActionButton;
    private readonly previewHelper: PreviewActionHelper;
    private readonly mode: RenderingMode;
    private intervalMonitor: number | null = null;

    constructor(previewHelper: PreviewActionHelper, mode: RenderingMode = RenderingMode.PREVIEW) {
        super({className: 'content-item-preview-toolbar'});
        this.previewHelper = previewHelper;
        this.mode = mode;

        this.initListeners();
    }

    protected initElements(): void {
        super.initElements();

        this.widgetSelector = new PreviewWidgetDropdown();
        this.emulatorSelector = new EmulatorDropdown();

        this.previewButton = new ActionButton(new WidgetPreviewAction(this));
        this.previewButton.addClass('icon-newtab');
    }

    protected initListeners(): void {
        super.initListeners();

        this.widgetSelector.onSelectionChanged(() => {
            this.stopListeningToIFrameClick();
        });

        this.widgetSelector.onDropdownVisibilityChanged((isVisible: boolean) => {
            if (!isVisible) {
                this.stopListeningToIFrameClick();
                return;
            }

            this.startListeningToIFrameClick();
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then(rendered => {

            this.addContainer(this.emulatorSelector, this.emulatorSelector.getChildControls());
            this.addContainer(this.widgetSelector, this.widgetSelector.getChildControls());

            const previewWrapper = new DivEl('preview-button-wrapper');
            previewWrapper.appendChildren(this.previewButton);
            this.addContainer(previewWrapper, [this.previewButton]);

            return rendered;
        });
    }

    getMode(): RenderingMode {
        return this.mode;
    }

    setItem(item: ContentSummaryAndCompareStatus) {
        ResponsiveManager.fireResizeEvent();

        super.setItem(item);
    }

    public getWidgetSelector(): PreviewWidgetDropdown {
        return this.widgetSelector;
    }

    public getPreviewAction(): WidgetPreviewAction {
        return this.previewButton.getAction() as WidgetPreviewAction;
    }

    public setPreviewAction(action: Action) {
        this.previewButton.setAction(action);
    }

    public getPreviewActionHelper(): PreviewActionHelper {
        return this.previewHelper;
    }

    protected foldOrExpand(): void {
        //
    }

    private startListeningToIFrameClick() {
        this.intervalMonitor = setInterval(() => {
            const elem = document.activeElement;
            if (elem?.tagName == 'IFRAME') {
                this.stopListeningToIFrameClick();
                Body.get().getEl().dispatchEvent('mousedown');
            }
        }, 100);
    }

    private stopListeningToIFrameClick() {
        if (this.intervalMonitor !== null) {
            clearInterval(this.intervalMonitor);
            this.intervalMonitor = null;
        }
    }
}

export class WidgetPreviewAction
    extends Action {
    private toolbar: ContentItemPreviewToolbar;

    constructor(toolbar: ContentItemPreviewToolbar) {
        super(i18n('action.preview.open'), BrowserHelper.isOSX() ? 'alt+space' : 'mod+alt+space', true);
        this.toolbar = toolbar;
        this.onExecuted(this.handleExecuted.bind(this));

        this.setWcagAttributes({
            role: AriaRole.BUTTON,
            tabbable: true,
            ariaLabel: i18n('action.preview.open')
        });
    }

    protected handleExecuted() {
        const contentSummary = this.toolbar.getItem().getContentSummary();
        const selectedWidget = this.toolbar.getWidgetSelector().getSelectedWidget();
        const mode = this.toolbar.getMode();
        this.toolbar.getPreviewActionHelper().openWindow(contentSummary, selectedWidget, mode);
    }
}
