import {ContextPanel} from './ContextPanel';
import {FloatingContextPanel} from './FloatingContextPanel';
import {DockedContextPanel} from './DockedContextPanel';
import {NonMobileContextPanelToggleButton} from './button/NonMobileContextPanelToggleButton';
import {ActiveContextPanelManager} from './ActiveContextPanelManager';
import {InspectEvent} from '../../event/InspectEvent';
import ResponsiveRanges = api.ui.responsive.ResponsiveRanges;

export class NonMobileContextPanelsManager {

    private splitPanelWithGridAndContext: api.ui.panel.SplitPanel;
    private dockedContextPanel: DockedContextPanel;
    private floatingContextPanel: FloatingContextPanel;
    private resizeEventMonitorLocked: boolean = false;
    private toggleButton: api.dom.ButtonEl = new NonMobileContextPanelToggleButton();
    private debouncedResizeHandler: () => void = api.util.AppHelper.debounce(this.doHandleResizeEvent, 300, false);

    constructor(builder: NonMobileContextPanelsManagerBuilder) {

        this.splitPanelWithGridAndContext = builder.getSplitPanelWithGridAndContext();
        this.dockedContextPanel = builder.getDefaultContextPanel();
        this.floatingContextPanel = builder.getFloatingContextPanel();

        this.toggleButton.onClicked(() => {
            if (this.requiresAnimation()) {
                this.doPanelAnimation();
            }
        });

        InspectEvent.on(() => {
            if (this.requiresAnimation() && !this.isExpanded()) {
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

        setTimeout(() => {
            this.ensureButtonHasCorrectState();
        }, this.isExpanded() ? 300 : 0);
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

    getToggleButton(): api.dom.ButtonEl {
        return this.toggleButton;
    }

    getActivePanel(): ContextPanel {
        return this.requiresFloatingPanelDueToShortWidth() ? this.floatingContextPanel : this.dockedContextPanel;
    }

    private isExpanded(): boolean {
        return this.toggleButton.hasClass('expanded');
    }

    private dockedToFloatingSync() {
        let activePanelWidth = this.splitPanelWithGridAndContext.getActiveWidthPxOfSecondPanel();
        this.hideDockedContextPanel();
        this.floatingContextPanel.setWidthPx(activePanelWidth);
    }

    private floatingToDockedSync() {
        this.floatingContextPanel.slideOut();
        let activePanelWidth: number = this.floatingContextPanel.getActualWidth();
        this.splitPanelWithGridAndContext.setActiveWidthPxOfSecondPanel(activePanelWidth);
    }

    private needsSwitchToFloatingMode(): boolean {
        return this.requiresFloatingPanelDueToShortWidth() && !this.splitPanelWithGridAndContext.isSecondPanelHidden();
    }

    private needsSwitchToDockedMode(): boolean {
        return !this.requiresFloatingPanelDueToShortWidth() && this.splitPanelWithGridAndContext.isSecondPanelHidden() && this.isExpanded();
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
        const splitPanelWidth = this.splitPanelWithGridAndContext.getEl().getWidthWithBorder();
        if (this.floatingPanelIsShown()) {
            return (splitPanelWidth - this.floatingContextPanel.getActualWidth()) < 720;
        } else {
            const defaultContextPanelWidth = this.splitPanelWithGridAndContext.getActiveWidthPxOfSecondPanel();
            const splitterThickness: number = this.splitPanelWithGridAndContext.getSplitterThickness();
            return (splitPanelWidth - defaultContextPanelWidth - splitterThickness) < 720;
        }
    }

    requiresCollapsedContextPanel(): boolean {
        let splitPanelWidth = this.splitPanelWithGridAndContext.getEl().getWidthWithBorder();
        return this.requiresFloatingPanelDueToShortWidth() || ResponsiveRanges._1620_1920.isFitOrSmaller(splitPanelWidth);
    }

    ensureButtonHasCorrectState() {
        this.toggleButton.toggleClass('expanded',
            !this.splitPanelWithGridAndContext.isSecondPanelHidden() || this.floatingPanelIsShown());
        this.splitPanelWithGridAndContext.toggleClass('context-panel-expanded', this.isExpanded());
    }

    static create(): NonMobileContextPanelsManagerBuilder {
        return new NonMobileContextPanelsManagerBuilder();
    }
}

export class NonMobileContextPanelsManagerBuilder {
    private splitPanelWithGridAndContext: api.ui.panel.SplitPanel;
    private dockedContextPanel: DockedContextPanel;
    private floatingContextPanel: FloatingContextPanel;

    setSplitPanelWithGridAndContext(splitPanelWithGridAndContext: api.ui.panel.SplitPanel) {
        this.splitPanelWithGridAndContext = splitPanelWithGridAndContext;
    }

    setDefaultContextPanel(dockedContextPanel: DockedContextPanel) {
        this.dockedContextPanel = dockedContextPanel;
    }

    setFloatingContextPanel(floatingContextPanel: FloatingContextPanel) {
        this.floatingContextPanel = floatingContextPanel;
    }

    getSplitPanelWithGridAndContext(): api.ui.panel.SplitPanel {
        return this.splitPanelWithGridAndContext;
    }

    getDefaultContextPanel(): DockedContextPanel {
        return this.dockedContextPanel;
    }

    getFloatingContextPanel(): FloatingContextPanel {
        return this.floatingContextPanel;
    }

    build(): NonMobileContextPanelsManager {
        return new NonMobileContextPanelsManager(this);
    }
}
