import {ResponsiveManager} from 'lib-admin-ui/ui/responsive/ResponsiveManager';
import {ResponsiveItem} from 'lib-admin-ui/ui/responsive/ResponsiveItem';
import {SplitPanel, SplitPanelAlignment, SplitPanelBuilder} from 'lib-admin-ui/ui/panel/SplitPanel';
import {SplitPanelSize} from 'lib-admin-ui/ui/panel/SplitPanelSize';
import {Panel} from 'lib-admin-ui/ui/panel/Panel';
import {DockedContextPanel} from './DockedContextPanel';
import {ContextView} from './ContextView';
import {InspectEvent} from '../../event/InspectEvent';
import {ToggleContextPanelEvent} from './ToggleContextPanelEvent';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {ContextPanelState} from './ContextPanelState';
import {ResponsiveRanges} from 'lib-admin-ui/ui/responsive/ResponsiveRanges';
import {ResponsiveRange} from 'lib-admin-ui/ui/responsive/ResponsiveRange';
import {Body} from 'lib-admin-ui/dom/Body';
import {ContextPanelStateEvent} from './ContextPanelStateEvent';

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
    private dockedContextPanel: DockedContextPanel;
    private mobileModeChangedListeners: { (isMobile: boolean): void }[] = [];
    private modeChangedListeners: { (mode: ContextPanelMode): void }[] = [];
    private stateChangedListeners: { (state: ContextPanelState): void }[] = [];
    protected floatModeSize: SplitPanelSize;
    protected dockedModeSize: SplitPanelSize;

    constructor(splitPanelBuilder: ContextSplitPanelBuilder) {
        super(splitPanelBuilder);

        this.addClass(`context-split-panel ${this.contextPanelState}`);

        this.contextView = splitPanelBuilder.contextView;
        this.dockedContextPanel = splitPanelBuilder.getSecondPanel();
        this.dockedModeSize = splitPanelBuilder.getSecondPanelSize();
        this.floatModeSize = SplitPanelSize.Pixels(ContextSplitPanel.CONTEXT_MIN_WIDTH + this.getSplitterThickness() / 2);

        this.initListeners();
    }

    protected initListeners(): void {
        this.dockedContextPanel.onAdded(this.renderAfterDockedPanelReady.bind(this));

        InspectEvent.on((event: InspectEvent) => {
            if (event.isShowPanel() && this.isRendered() && !this.isExpanded()) {
                this.showContextPanel();
            }
        });

        ToggleContextPanelEvent.on(() => {
            if (this.isExpanded()) {
                this.hideContextPanel();
            } else {
                this.showContextPanel();
            }
        });

        this.whenRendered(() => {
            if (!this.requiresCollapsedContextPanel() && this.dockedContextPanel.getActiveWidget()) {
                this.showContextPanel();
            }
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
        return ResponsiveRanges._720_960;
    }

    private isContextPanelLessThanMin(): boolean {
        return this.getActiveWidthPxOfSecondPanel() < ContextSplitPanel.CONTEXT_MIN_WIDTH;
    }

    hideContextPanel(): void {
        this.foldSecondPanel();
        this.setState(ContextPanelState.COLLAPSED);
    }

    showContextPanel(): void {
        this.switchPanelModeIfNeeded();

        if (this.isContextPanelLessThanMin()) {
            this.setActiveWidthPxOfSecondPanel(SplitPanelSize.Pixels(ContextSplitPanel.CONTEXT_MIN_WIDTH));
        }

        this.showSecondPanel();
        this.setState(ContextPanelState.EXPANDED);
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

            new ContextPanelStateEvent(state).fire();
            this.notifyStateChanged();
        }
    }

    isExpanded(): boolean {
        return !this.isCollapsed();
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
        this.modeChangedListeners.forEach((listener: { (mode: ContextPanelMode): void }) => listener(this.contextPanelMode));
    }

    onStateChanged(listener: (state: ContextPanelState) => void): void {
        this.stateChangedListeners.push(listener);
    }

    unStateChanged(listener: (state: ContextPanelState) => void): void {
        this.stateChangedListeners = this.stateChangedListeners.filter(curr => curr !== listener);
    }

    private notifyStateChanged(): void {
        this.stateChangedListeners.forEach((curr: { (state: ContextPanelState): void }) => curr(this.contextPanelState));
    }

    static create(firstPanel: Panel, secondPanel: DockedContextPanel): ContextSplitPanelBuilder {
        return new ContextSplitPanelBuilder(firstPanel, secondPanel);
    }
}

export class ContextSplitPanelBuilder
    extends SplitPanelBuilder {

    contextView: ContextView;

    constructor(firstPanel: Panel, secondPanel: DockedContextPanel) {
        super(firstPanel, secondPanel);

        this.setAlignment(SplitPanelAlignment.VERTICAL);
        this.setSecondPanelMinSize(SplitPanelSize.Pixels(ContextSplitPanel.CONTEXT_MIN_WIDTH));
        this.setAnimationDelay(600);
        this.setSecondPanelShouldSlideRight(true);
    }

    setContextView(value: ContextView): ContextSplitPanelBuilder {
        this.contextView = value;
        return this;
    }

    setFirstPanelMinSize(size: SplitPanelSize): ContextSplitPanelBuilder {
        return <ContextSplitPanelBuilder>super.setFirstPanelMinSize(size);
    }

    setSecondPanelSize(size: SplitPanelSize): ContextSplitPanelBuilder {
        return <ContextSplitPanelBuilder>super.setSecondPanelSize(size);
    }

    getSecondPanel(): DockedContextPanel {
        return <DockedContextPanel>super.getSecondPanel();
    }

    build(): ContextSplitPanel {
        return new ContextSplitPanel(this);
    }
}
