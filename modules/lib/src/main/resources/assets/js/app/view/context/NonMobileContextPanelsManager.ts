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
import {ResponsiveRange} from 'lib-admin-ui/ui/responsive/ResponsiveRange';
import {Panel} from 'lib-admin-ui/ui/panel/Panel';
import {SplitPanel} from 'lib-admin-ui/ui/panel/SplitPanel';
import {Button} from 'lib-admin-ui/ui/button/Button';
import {Body} from 'lib-admin-ui/dom/Body';

export class NonMobileContextPanelsManager {

    private splitPanelWithContext: SplitPanel;

    private dockedContextPanel: DockedContextPanel;

    private floatingContextPanel: FloatingContextPanel;

    private resizeEventMonitorLocked: boolean = false;

    private toggleButton: Button = new NonMobileContextPanelToggleButton();

    private debouncedResizeHandler: () => void = AppHelper.debounce(this.doHandleResizeEvent, 300, false);

    private pageEditor: LiveFormPanel;

    private wizardPanel: Panel;

    constructor(builder: NonMobileContextPanelsManagerBuilder) {
        this.splitPanelWithContext = builder.getSplitPanelWithContext();
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
            this.splitPanelWithContext.distribute();
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
            } else if (!this.splitPanelWithContext.isSecondPanelHidden()) {
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
                this.splitPanelWithContext.removeClass('context-panel-expanded');
            }

            return;
        }
    }

    private needsModeSwitch() {
        return (this.needsSwitchToFloatingMode() || this.needsSwitchToDockedMode());
    }

    private contentBrowsePanelIsVisible(): boolean {
        return this.splitPanelWithContext.getParentElement().isVisible();
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
        this.splitPanelWithContext.addClass('sliding');

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
            this.splitPanelWithContext.showSecondPanel(false);
        } else {
            if (!this.splitPanelWithContext.isSecondPanelHidden()) {
                this.splitPanelWithContext.foldSecondPanel();
            }
        }

        setTimeout(() => {
            this.dockedContextPanel.removeClass('left-bordered');
            if (this.isExpanded()) {
                this.splitPanelWithContext.showSplitter();
                this.dockedContextPanel.notifyPanelSizeChanged();
            }
            this.splitPanelWithContext.removeClass('sliding');
        }, 600);
    }

    private switchToFloatingMode(canSetActivePanel: boolean = true, onResize: boolean = false) {
        if (!canSetActivePanel && !this.floatingPanelIsShown()) {
            return;
        }

        this.toggleButton.addClass('floating-mode');
        if (!this.splitPanelWithContext.isSecondPanelHidden()) {
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
        this.splitPanelWithContext.setActiveWidthPxOfSecondPanel(this.floatingContextPanel.getActualWidth());
        this.splitPanelWithContext.removeClass('sliding');
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
        this.splitPanelWithContext.foldSecondPanel();
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
        const halfSplitter: number = this.splitPanelWithContext.getSplitterThickness() / 2;
        let activePanelWidth = this.splitPanelWithContext.getActiveWidthPxOfSecondPanel();
        this.hideDockedContextPanel();
        this.floatingContextPanel.setWidthPx(activePanelWidth + halfSplitter);
    }

    private floatingToDockedSync() {
        const halfSplitter: number = this.splitPanelWithContext.getSplitterThickness() / 2;
        this.floatingContextPanel.slideOut();
        let activePanelWidth: number = this.floatingContextPanel.getActualWidth();
        this.splitPanelWithContext.setActiveWidthPxOfSecondPanel(activePanelWidth - halfSplitter);
    }

    private needsSwitchToFloatingMode(): boolean {
        return !this.splitPanelWithContext.isSecondPanelHidden() && this.requiresFloatingPanelDueToShortWidth();
    }

    private needsSwitchToDockedMode(): boolean {
        return this.splitPanelWithContext.isSecondPanelHidden() && this.isExpanded() && !this.requiresFloatingPanelDueToShortWidth();
    }

    private requiresAnimation(): boolean {
        return this.isExpanded()
               ? (!this.splitPanelWithContext.isSecondPanelHidden() || this.floatingPanelIsShown())
               : (this.splitPanelWithContext.isSecondPanelHidden() && !this.floatingPanelIsShown());
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
        const panelWidth: number = this.splitPanelWithContext.getParentElement().getEl().getWidthWithBorder();
        const maximumThreshold: ResponsiveRange = this.isPageEditorShown() ?
                                 (this.isWizardPanelMaximized() ? ResponsiveRanges._1380_1620 : ResponsiveRanges._540_720) :
                                 ResponsiveRanges._720_960;

        if (this.floatingPanelIsShown()) {
            return maximumThreshold.isFitOrSmaller(panelWidth - this.floatingContextPanel.getActualWidth());
        } else {
            const defaultContextPanelWidth: number = this.splitPanelWithContext.getActiveWidthPxOfSecondPanel();
            const halfSplitter: number = this.splitPanelWithContext.getSplitterThickness() / 2;
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
        const totalWidth: number = Body.get().getEl().getWidthWithBorder();
        return this.requiresFloatingPanelDueToShortWidth() || ResponsiveRanges._1620_1920.isFitOrSmaller(totalWidth);
    }

    ensureButtonHasCorrectState() {
        this.toggleButton.toggleClass('expanded',
            !this.splitPanelWithContext.isSecondPanelHidden() || this.floatingPanelIsShown());
        this.toggleButton.setTitle(this.isExpanded() ? i18n('tooltip.contextPanel.hide') : i18n('tooltip.contextPanel.show'), false);
        this.splitPanelWithContext.toggleClass('context-panel-expanded', this.isExpanded());
    }

    static create(): NonMobileContextPanelsManagerBuilder {
        return new NonMobileContextPanelsManagerBuilder();
    }
}

export class NonMobileContextPanelsManagerBuilder {

    private splitPanelWithContext: SplitPanel;

    private dockedContextPanel: DockedContextPanel;

    private floatingContextPanel: FloatingContextPanel;

    private pageEditor: LiveFormPanel;

    private wizardPanel: Panel;

    private isMobileMode: () => boolean;

    setSplitPanelWithContext(splitPanelWithContext: SplitPanel) {
        this.splitPanelWithContext = splitPanelWithContext;
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

    getSplitPanelWithContext(): SplitPanel {
        return this.splitPanelWithContext;
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
