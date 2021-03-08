import {i18n} from 'lib-admin-ui/util/Messages';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {ContextPanel} from './ContextPanel';
import {FloatingContextPanel} from './FloatingContextPanel';
import {DockedContextPanel} from './DockedContextPanel';
import {NonMobileContextPanelToggleButton} from './button/NonMobileContextPanelToggleButton';
import {ActiveContextPanelManager} from './ActiveContextPanelManager';
import {InspectEvent} from '../../event/InspectEvent';
import {LiveFormPanel} from '../../wizard/page/LiveFormPanel';
import {ResponsiveRanges} from 'lib-admin-ui/ui/responsive/ResponsiveRanges';
import {Panel} from 'lib-admin-ui/ui/panel/Panel';
import {SplitPanel} from 'lib-admin-ui/ui/panel/SplitPanel';
import {Button} from 'lib-admin-ui/ui/button/Button';

export class NonMobileContextPanelsManager {

    private splitPanelWithGridAndContext: SplitPanel;

    private dockedContextPanel: DockedContextPanel;

    private floatingContextPanel: FloatingContextPanel;

    private resizeEventMonitorLocked: boolean = false;

    private toggleButton: Button = new NonMobileContextPanelToggleButton();

    private debouncedResizeHandler: () => void = AppHelper.debounce(this.doHandleResizeEvent, 300, false);

    private pageEditor: LiveFormPanel;

    private wizardPanel: Panel;

    constructor(builder: NonMobileContextPanelsManagerBuilder) {

        this.splitPanelWithGridAndContext = builder.getSplitPanelWithGridAndContext();
        this.dockedContextPanel = builder.getDefaultContextPanel();
        this.floatingContextPanel = builder.getFloatingContextPanel();

        this.pageEditor = builder.getPageEditor();
        this.wizardPanel = builder.getWizardPanel();

        this.toggleButton.onClicked(() => {
            if (this.requiresAnimation()) {
                this.doPanelAnimation();
            }
        });

        const isMobileMode = builder.getIsMobileMode() || (() => false);

        InspectEvent.on((event: InspectEvent) => {
            if (event.isShowPanel() && !isMobileMode() && this.requiresAnimation() && !this.isExpanded()) {
                this.doPanelAnimation();
            }
        });

        this.dockedContextPanel.onShown(() => {
            this.splitPanelWithGridAndContext.distribute();
        });
    }

    handleResizeEvent() {
        this.debouncedResizeHandler();
    }

    private doHandleResizeEvent() {

        if (this.resizeEventMonitorLocked || !this.toggleButton.isRendered()) {
            return;
        }

        if (this.nonMobileContextPanelIsActive() && this.contentBrowsePanelIsVisible()) {
            this.resizeEventMonitorLocked = true;
            if (this.needsModeSwitch()) {
                this.doPanelAnimation(true, true);
            } else if (!this.splitPanelWithGridAndContext.isSecondPanelHidden()) {
                this.dockedContextPanel.notifyPanelSizeChanged();
            } else if (this.isFloatingContextPanelActive()) {
                this.floatingContextPanel.notifyPanelSizeChanged();
            }
            setTimeout(() => {
                this.resizeEventMonitorLocked = false;
            }, 600);

        } else {

            if (this.isExpanded() && !this.isFloatingContextPanelActive() && !this.nonMobileContextPanelIsActive()) {
                this.toggleButton.removeClass('expanded');
                this.splitPanelWithGridAndContext.removeClass('context-panel-expanded');
            }

            return;
        }
    }

    private needsModeSwitch() {
        return (this.needsSwitchToFloatingMode() || this.needsSwitchToDockedMode());
    }

    private contentBrowsePanelIsVisible(): boolean {
        return this.splitPanelWithGridAndContext.getParentElement().isVisible();
    }

    private isFloatingContextPanelActive(): boolean {
        return ActiveContextPanelManager.getActiveContextPanel() === this.floatingContextPanel;
    }

    private nonMobileContextPanelIsActive(): boolean {
        return ActiveContextPanelManager.getActiveContextPanel() === this.dockedContextPanel ||
               ActiveContextPanelManager.getActiveContextPanel() === this.floatingContextPanel;
    }

    public setActivePanel() {
        if (this.nonMobileContextPanelIsActive()) {
            return;
        }

        ActiveContextPanelManager.setActiveContextPanel(
            this.requiresFloatingPanelDueToShortWidth() ? this.floatingContextPanel : this.dockedContextPanel);
    }

    private doPanelAnimation(canSetActivePanel: boolean = true, onResize: boolean = false) {

        this.splitPanelWithGridAndContext.addClass('sliding');

        if (this.requiresFloatingPanelDueToShortWidth()) {
            this.switchToFloatingMode(canSetActivePanel, onResize);
        } else {
            this.switchToDockedMode(canSetActivePanel, onResize);
        }

        this.ensureButtonHasCorrectState();
    }

    private switchToDockedMode(canSetActivePanel: boolean = true, onResize?: boolean) {
        this.toggleButton.removeClass('floating-mode');
        if (this.floatingPanelIsShown()) {
            this.floatingToDockedSync();
        }

        if (canSetActivePanel) {
            ActiveContextPanelManager.setActiveContextPanel(this.dockedContextPanel);
        }

        this.dockedContextPanel.addClass('left-bordered');

        if (!this.isExpanded() || onResize) {
            this.splitPanelWithGridAndContext.showSecondPanel(false);
        } else {
            if (!this.splitPanelWithGridAndContext.isSecondPanelHidden()) {
                this.splitPanelWithGridAndContext.foldSecondPanel();
            }
        }

        setTimeout(() => {
            this.dockedContextPanel.removeClass('left-bordered');
            if (this.isExpanded()) {
                this.splitPanelWithGridAndContext.showSplitter();
                this.dockedContextPanel.notifyPanelSizeChanged();
            }
            this.splitPanelWithGridAndContext.removeClass('sliding');
        }, 600);
    }

    private switchToFloatingMode(canSetActivePanel: boolean = true, onResize: boolean = false) {
        if (!canSetActivePanel && !this.floatingPanelIsShown()) {
            return;
        }

        this.toggleButton.addClass('floating-mode');
        if (!this.splitPanelWithGridAndContext.isSecondPanelHidden()) {
            this.dockedToFloatingSync();
        }

        if (canSetActivePanel) {
            ActiveContextPanelManager.setActiveContextPanel(this.floatingContextPanel);
        }

        if (!this.isExpanded() || onResize) {
            this.floatingContextPanel.resetWidgetsWidth();
            this.floatingContextPanel.slideIn();
            this.floatingContextPanel.notifyPanelSizeChanged();
        } else {
            this.floatingContextPanel.slideOut();
        }
        this.splitPanelWithGridAndContext.setActiveWidthPxOfSecondPanel(this.floatingContextPanel.getActualWidth());
        this.splitPanelWithGridAndContext.removeClass('sliding');
    }

    hideActivePanel(onResize: boolean = false) {
        if (this.isFloatingContextPanelActive()) {
            this.toggleButton.removeClass('floating-mode');
            this.floatingContextPanel.slideOut();
        } else {
            this.hideDockedContextPanel();
        }

        setTimeout(() => {
            this.ensureButtonHasCorrectState();
        }, this.isExpanded() ? 300 : 0);
    }

    hideDockedContextPanel() {
        this.splitPanelWithGridAndContext.foldSecondPanel();
    }

    getToggleButton(): Button {
        return this.toggleButton;
    }

    getActivePanel(): ContextPanel {
        return this.requiresFloatingPanelDueToShortWidth() ? this.floatingContextPanel : this.dockedContextPanel;
    }

    private isExpanded(): boolean {
        return this.toggleButton.hasClass('expanded');
    }

    private dockedToFloatingSync() {
        // Add half splitter, since in docked mode, this value will be subtracted by split panel hanlders,
        // when showing hidden panel
        const halfSplitter: number = this.splitPanelWithGridAndContext.getSplitterThickness() / 2;
        let activePanelWidth = this.splitPanelWithGridAndContext.getActiveWidthPxOfSecondPanel();
        this.hideDockedContextPanel();
        this.floatingContextPanel.setWidthPx(activePanelWidth + halfSplitter);
    }

    private floatingToDockedSync() {
        const halfSplitter: number = this.splitPanelWithGridAndContext.getSplitterThickness() / 2;
        this.floatingContextPanel.slideOut();
        let activePanelWidth: number = this.floatingContextPanel.getActualWidth();
        this.splitPanelWithGridAndContext.setActiveWidthPxOfSecondPanel(activePanelWidth - halfSplitter);
    }

    private needsSwitchToFloatingMode(): boolean {
        return !this.splitPanelWithGridAndContext.isSecondPanelHidden() && this.requiresFloatingPanelDueToShortWidth();
    }

    private needsSwitchToDockedMode(): boolean {
        return this.splitPanelWithGridAndContext.isSecondPanelHidden() && this.isExpanded() && !this.requiresFloatingPanelDueToShortWidth();
    }

    private requiresAnimation(): boolean {
        return this.isExpanded()
               ? (!this.splitPanelWithGridAndContext.isSecondPanelHidden() || this.floatingPanelIsShown())
               : (this.splitPanelWithGridAndContext.isSecondPanelHidden() && !this.floatingPanelIsShown());
    }

    private floatingPanelIsShown(): boolean {
        if (!this.nonMobileContextPanelIsActive()) {
            return false;
        }
        let right = this.floatingContextPanel.getHTMLElement().style.right;
        if (right && right.indexOf('px') > -1) {
            right = right.substring(0, right.indexOf('px'));
            return Number(right) >= 0;
        }
        return false;
    }

    private requiresFloatingPanelDueToShortWidth(): boolean {
        const panelWidth = this.splitPanelWithGridAndContext.getEl().getWidthWithBorder();

        const maximumThreshold = this.isPageEditorShown() ?
                                 (this.isWizardPanelMaximized() ? ResponsiveRanges._1380_1620 : ResponsiveRanges._540_720) :
                                 ResponsiveRanges._960_1200;

        if (this.floatingPanelIsShown()) {
            return maximumThreshold.isFitOrSmaller(panelWidth - this.floatingContextPanel.getActualWidth());
        } else {
            const defaultContextPanelWidth = this.splitPanelWithGridAndContext.getActiveWidthPxOfSecondPanel();
            const halfSplitter: number = this.splitPanelWithGridAndContext.getSplitterThickness() / 2;
            // Calculate context panel with half width of the splitter, since context panel in floating mode
            // is bigger on that value.
            return maximumThreshold.isFitOrSmaller(panelWidth - (defaultContextPanelWidth + halfSplitter));
        }
    }

    private isPageEditorShown(): boolean {
        return this.pageEditor && this.pageEditor.isShown();
    }

    private isWizardPanelMaximized(): boolean {
        return this.wizardPanel && !this.wizardPanel.hasClass('minimized');
    }

    requiresCollapsedContextPanel(): boolean {
        let splitPanelWidth = this.splitPanelWithGridAndContext.getEl().getWidthWithBorder();
        return this.requiresFloatingPanelDueToShortWidth() || ResponsiveRanges._1620_1920.isFitOrSmaller(splitPanelWidth);
    }

    ensureButtonHasCorrectState() {
        this.toggleButton.toggleClass('expanded',
            !this.splitPanelWithGridAndContext.isSecondPanelHidden() || this.floatingPanelIsShown());
        this.toggleButton.setTitle(this.isExpanded() ? i18n('tooltip.contextPanel.hide') : i18n('tooltip.contextPanel.show'), false);
        this.splitPanelWithGridAndContext.toggleClass('context-panel-expanded', this.isExpanded());
    }

    static create(): NonMobileContextPanelsManagerBuilder {
        return new NonMobileContextPanelsManagerBuilder();
    }
}

export class NonMobileContextPanelsManagerBuilder {

    private splitPanelWithGridAndContext: SplitPanel;

    private dockedContextPanel: DockedContextPanel;

    private floatingContextPanel: FloatingContextPanel;

    private pageEditor: LiveFormPanel;

    private wizardPanel: Panel;

    private isMobileMode: () => boolean;

    setSplitPanelWithGridAndContext(splitPanelWithGridAndContext: SplitPanel) {
        this.splitPanelWithGridAndContext = splitPanelWithGridAndContext;
    }

    setDefaultContextPanel(dockedContextPanel: DockedContextPanel) {
        this.dockedContextPanel = dockedContextPanel;
    }

    setFloatingContextPanel(floatingContextPanel: FloatingContextPanel) {
        this.floatingContextPanel = floatingContextPanel;
    }

    setPageEditor(pageEditor: LiveFormPanel) {
        this.pageEditor = pageEditor;
    }

    setWizardPanel(wizardPanel: Panel) {
        this.wizardPanel = wizardPanel;
    }

    setIsMobileMode(isMobileMode: () => boolean) {
        this.isMobileMode = isMobileMode;
    }

    getSplitPanelWithGridAndContext(): SplitPanel {
        return this.splitPanelWithGridAndContext;
    }

    getDefaultContextPanel(): DockedContextPanel {
        return this.dockedContextPanel;
    }

    getFloatingContextPanel(): FloatingContextPanel {
        return this.floatingContextPanel;
    }

    getPageEditor(): LiveFormPanel {
        return this.pageEditor;
    }

    getWizardPanel(): Panel {
        return this.wizardPanel;
    }

    getIsMobileMode(): () => boolean {
        return this.isMobileMode;
    }

    build(): NonMobileContextPanelsManager {
        return new NonMobileContextPanelsManager(this);
    }
}
