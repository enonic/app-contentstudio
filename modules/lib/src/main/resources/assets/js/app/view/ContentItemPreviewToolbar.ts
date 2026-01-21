import type Q from 'q';
import {ContentStatusToolbar} from '../ContentStatusToolbar';
import {PreviewModeDropdown} from './toolbar/PreviewModeDropdown';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {type ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
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

    private modeSelector: PreviewModeDropdown;
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

        this.modeSelector = new PreviewModeDropdown();
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

        this.modeSelector.onSelectionChanged(() => {
            this.stopListeningToIFrameClick();
        });

        this.modeSelector.onDropdownVisibilityChanged((isVisible: boolean) => {
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
            this.addContainer(this.modeSelector, this.modeSelector.getChildControls());

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

    public getModeSelector(): PreviewModeDropdown {
        return this.modeSelector;
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
