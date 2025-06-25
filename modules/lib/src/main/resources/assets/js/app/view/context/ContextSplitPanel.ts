import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';
import {SplitPanel, SplitPanelAlignment, SplitPanelBuilder} from '@enonic/lib-admin-ui/ui/panel/SplitPanel';
import {SplitPanelSize} from '@enonic/lib-admin-ui/ui/panel/SplitPanelSize';
import {ResponsiveItem} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveItem';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {ResponsiveRange} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveRange';
import {ResponsiveRanges} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveRanges';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {InspectEvent} from '../../event/InspectEvent';
import {ContextPanelState} from './ContextPanelState';
import {ContextView} from './ContextView';
import {DockedContextPanel} from './DockedContextPanel';
import {Button} from '@enonic/lib-admin-ui/ui/button/Button';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export enum ContextPanelMode {
    DOCKED = 'docked',
    FLOATING = 'floating'
}

export class ContextSplitPanel
    extends SplitPanel {

    public static CONTEXT_MIN_WIDTH: number = 280;

    private contextPanelMode: ContextPanelMode;
    private contextPanelState: ContextPanelState = ContextPanelState.COLLAPSED;
    private debouncedResizeHandler: () => void = AppHelper.debounce(this.doHandleResizeEvent, 650, false);
    private mobileMode: boolean;
    private contextView: ContextView;
    private toggleButton?: Button;
    private dockedContextPanel: DockedContextPanel;
    private mobileModeChangedListeners: ((isMobile: boolean) => void)[] = [];
    private modeChangedListeners: ((mode: ContextPanelMode) => void)[] = [];
    private stateChangedListeners: ((state: ContextPanelState) => void)[] = [];
    protected floatModeSize: SplitPanelSize;
    protected dockedModeSize: SplitPanelSize;

    constructor(splitPanelBuilder: ContextSplitPanelBuilder) {
        super(splitPanelBuilder);

        this.addClass(`context-split-panel ${this.contextPanelState}`);

        this.contextView = splitPanelBuilder.contextView;
        this.toggleButton = splitPanelBuilder.toggleButton;
        this.dockedContextPanel = splitPanelBuilder.getSecondPanel();
        this.dockedModeSize = splitPanelBuilder.getSecondPanelSize();
        this.floatModeSize = SplitPanelSize.PIXELS(ContextSplitPanel.CONTEXT_MIN_WIDTH + this.getSplitterThickness() / 2);

        this.initListeners();
    }

    protected initListeners(): void {
        this.dockedContextPanel.onAdded(this.renderAfterDockedPanelReady.bind(this));

        InspectEvent.on((event: InspectEvent) => {
            if(event.isSetWidget()) {
                this.contextView.setActiveWidgetByType(event.getWidgetType());
            }
            if (event.isShowPanel() && this.isRendered() && !this.isExpanded()) {
                this.showContextPanel();
            }
        });

        this.toggleButton?.onClicked(() => {
            this.toggleContextPanel();
        });

        this.whenRendered(() => {
            setTimeout(() => {
                if (!this.requiresCollapsedContextPanel() && this.dockedContextPanel.getActiveWidget()) {
                    this.showContextPanel();
                }
            }, 100);
        });
    }

    private switchPanelModeIfNeeded(): void {
        const expectedMode: ContextPanelMode = this.getExpectedContextPanelMode();

        if (this.getMode() !== expectedMode) {
            if (expectedMode === ContextPanelMode.DOCKED) {
                this.setDockedMode();
            } else {
                this.setFloatingMode();
            }
        }
    }

    protected getExpectedContextPanelMode(): ContextPanelMode {
        const parentWidth: number = this.getParentElement().getEl().getWidthWithBorder();
        const leftPanelFloatingModeResponsiveRange: ResponsiveRange = this.getLeftPanelResponsiveRangeToSwitchToFloatingMode();

        // Calculate context panel with half width of the splitter, since context panel in floating mode
        // is bigger on that value.
        const contextPanelWidth: number = this.getActiveWidthPxOfSecondPanel();
        const halfSplitter: number = this.getSplitterThickness() / 2;
        const leftPanelExpectedWidth: number = parentWidth - (contextPanelWidth + halfSplitter);

        return leftPanelFloatingModeResponsiveRange.isFitOrSmaller(leftPanelExpectedWidth)
               ? ContextPanelMode.FLOATING
               : ContextPanelMode.DOCKED;
    }

    protected getLeftPanelResponsiveRangeToSwitchToFloatingMode(): ResponsiveRange {
        return ResponsiveRanges._960_1200;
    }

    private isContextPanelLessThanMin(): boolean {
        return this.getActiveWidthPxOfSecondPanel() < ContextSplitPanel.CONTEXT_MIN_WIDTH;
    }

    toggleContextPanel(): void {
        if (this.isExpanded()) {
            this.hideContextPanel();
        } else {
            this.showContextPanel();
        }
    }

    hideContextPanel(): void {
        this.foldSecondPanel();
        this.setState(ContextPanelState.COLLAPSED);
        this.resetToggleButtonActiveState();
    }

    showContextPanel(): void {
        this.switchPanelModeIfNeeded();

        if (this.isContextPanelLessThanMin()) {
            this.setActiveWidthPxOfSecondPanel(SplitPanelSize.PIXELS(ContextSplitPanel.CONTEXT_MIN_WIDTH));
        }

        this.showSecondPanel();
        this.setState(ContextPanelState.EXPANDED);
        this.resetToggleButtonActiveState();
    }

    private resetToggleButtonActiveState(): void {
        const isExpanded: boolean = this.contextPanelState !== ContextPanelState.COLLAPSED;
        this.toggleButton?.toggleClass('expanded', isExpanded);
        this.toggleButton?.setTitle(isExpanded ? i18n('tooltip.contextPanel.hide') : i18n('tooltip.contextPanel.show'), false);
    }

    private doHandleResizeEvent(): void {
        if (this.isCollapsed()) {
            return;
        }

        this.switchPanelModeIfNeeded();
    }

    private renderAfterDockedPanelReady(): void {
        this.hideContextPanel();
        this.subscribeContextPanelsOnEvents();
    }

    private requiresCollapsedContextPanel(): boolean {
        const totalWidth: number = Body.get().getEl().getWidthWithBorder();
        return ResponsiveRanges._1620_1920.isFitOrSmaller(totalWidth) || this.getExpectedContextPanelMode() === ContextPanelMode.FLOATING;
    }

    private subscribeContextPanelsOnEvents(): void {
        const responsiveHandler = (item: ResponsiveItem) => {
            this.debouncedResizeHandler();
            this.toggleMobileMode(item.isInRangeOrSmaller(ResponsiveRanges._540_720));
        };
        ResponsiveManager.onAvailableSizeChanged(this.getParentElement(), responsiveHandler);
        this.onRemoved(() => {
            ResponsiveManager.unAvailableSizeChanged(this.getParentElement());
        });
    }

    private toggleMobileMode(value: boolean): void {
        if (value !== this.mobileMode) {
            this.mobileMode = value;
            this.toggleClass('mobile-mode', value);
            this.notifyMobileModeChanged(value);
        }
    }

    setDockedMode(): void {
        this.setMode(ContextPanelMode.DOCKED);
        this.setActiveWidthPxOfSecondPanel(this.dockedModeSize);
        this.distribute(true);
    }

    setFloatingMode(): void {
        this.setMode(ContextPanelMode.FLOATING);
        this.setActiveWidthPxOfSecondPanel(this.floatModeSize);
        this.distribute(true);
    }

    setMode(value: ContextPanelMode): void {
        if (value === this.contextPanelMode) {
            return;
        }

        if (this.contextPanelMode) {
            this.removeClass(this.contextPanelMode);
        }

        this.contextPanelMode = value;
        this.addClass(this.contextPanelMode);
        this.notifyModeChanged();
    }

    public isDockedMode(): boolean {
        return this.contextPanelMode === ContextPanelMode.DOCKED;
    }

    public isFloatingMode(): boolean {
        return this.contextPanelMode === ContextPanelMode.FLOATING;
    }

    public getMode(): ContextPanelMode {
        return this.contextPanelMode;
    }

    setState(state: ContextPanelState): void {
        if (state !== this.contextPanelState) {
            this.removeClass(this.contextPanelState);
            this.contextPanelState = state;
            this.addClass(state);
            this.resetToggleButtonActiveState();
            this.notifyStateChanged();
        }
    }

    getState(): ContextPanelState {
        return this.contextPanelState;
    }

    isExpanded(): boolean {
        return this.contextPanelState === ContextPanelState.EXPANDED;
    }

    isCollapsed(): boolean {
        return this.contextPanelState === ContextPanelState.COLLAPSED;
    }

    onMobileModeChanged(listener: (isMobile: boolean) => void): void {
        this.mobileModeChangedListeners.push(listener);
    }

    unMobileModeChanged(listener: (isMobile: boolean) => void): void {
        this.mobileModeChangedListeners = this.mobileModeChangedListeners.filter(curr => curr !== listener);
    }

    private notifyMobileModeChanged(isMobile: boolean): void {
        this.mobileModeChangedListeners.forEach(curr => curr(isMobile));
    }

    isMobileMode(): boolean {
        return this.mobileMode;
    }

    onModeChanged(listener: (mode: ContextPanelMode) => void): void {
        this.modeChangedListeners.push(listener);
    }

    unModeChanged(listener: (mode: ContextPanelMode) => void): void {
        this.modeChangedListeners = this.modeChangedListeners.filter(curr => curr !== listener);
    }

    private notifyModeChanged(): void {
        this.modeChangedListeners.forEach((listener: (mode: ContextPanelMode) => void) => listener(this.contextPanelMode));
    }

    onStateChanged(listener: (state: ContextPanelState) => void): void {
        this.stateChangedListeners.push(listener);
    }

    unStateChanged(listener: (state: ContextPanelState) => void): void {
        this.stateChangedListeners = this.stateChangedListeners.filter(curr => curr !== listener);
    }

    private notifyStateChanged(): void {
        this.stateChangedListeners.forEach((curr: (state: ContextPanelState) => void) => curr(this.contextPanelState));
    }

    static create(firstPanel: Panel, secondPanel: DockedContextPanel): ContextSplitPanelBuilder {
        return new ContextSplitPanelBuilder(firstPanel, secondPanel);
    }
}

export class ContextSplitPanelBuilder
    extends SplitPanelBuilder {

    contextView: ContextView;

    toggleButton?: Button;

    constructor(firstPanel: Panel, secondPanel: DockedContextPanel) {
        super(firstPanel, secondPanel);

        this.setAlignment(SplitPanelAlignment.VERTICAL);
        this.setSecondPanelMinSize(SplitPanelSize.PIXELS(ContextSplitPanel.CONTEXT_MIN_WIDTH));
        this.setAnimationDelay(600);
        this.setSecondPanelShouldSlideRight(true);
    }

    setToggleButton(value: Button): this {
        this.toggleButton = value;
        return this;
    }

    setContextView(value: ContextView): this {
        this.contextView = value;
        return this;
    }

    setFirstPanelMinSize(size: SplitPanelSize): this {
        return super.setFirstPanelMinSize(size) as this;
    }

    setSecondPanelSize(size: SplitPanelSize): this {
        return super.setSecondPanelSize(size) as this;
    }

    getSecondPanel(): DockedContextPanel {
        return super.getSecondPanel() as DockedContextPanel;
    }

    build(): ContextSplitPanel {
        return new ContextSplitPanel(this);
    }
}
