import * as Q from 'q';
import {ContentStatusToolbar} from '../ContentStatusToolbar';
import {PreviewWidgetDropdown} from './toolbar/PreviewWidgetDropdown';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {EmulatorDropdown} from './toolbar/EmulatorDropdown';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {RenderingMode} from '../rendering/RenderingMode';
import {Button} from '@enonic/lib-admin-ui/ui/button/Button';
import {StyleHelper} from '@enonic/lib-admin-ui/StyleHelper';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';

export class ContentItemPreviewToolbar
    extends ContentStatusToolbar {

    ariaLabel: string = i18n('wcag.preview.toolbar.label');

    private widgetSelector: PreviewWidgetDropdown;
    private emulatorSelector: EmulatorDropdown;
    private readonly mode: RenderingMode;
    private intervalMonitor: number | null = null;
    private refreshButton: Button;
    private refreshAction: (() => void) | null = null;

    constructor(mode: RenderingMode = RenderingMode.PREVIEW) {
        super({className: 'content-item-preview-toolbar'});
        this.mode = mode;

        this.initListeners();
    }

    protected initElements(): void {
        super.initElements();

        this.widgetSelector = new PreviewWidgetDropdown();
        this.emulatorSelector = new EmulatorDropdown();
        this.refreshButton = new Button();
        this.refreshButton
            .setTitle(i18n('action.refresh'))
            .setAriaLabel(i18n('action.refresh'))
            .addClass(StyleHelper.getCommonIconCls('loop'));
    }

    setRefreshAction(fn: () => void): void {
        this.refreshAction = fn;
    }

    protected initListeners(): void {
        super.initListeners();

        this.refreshButton.onClicked(() => this.refreshAction?.());

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

            const refreshWrapper = new DivEl('refresh-button-wrapper');
            refreshWrapper.appendChild(this.refreshButton);
            this.appendChild(refreshWrapper);

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
