import {ContextView} from './ContextView';
import {WidgetView} from './WidgetView';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';

export class ContextPanel
    extends api.ui.panel.Panel {

    private sizeChangedListeners: {() : void}[] = [];

    protected contextView: ContextView;

    private contextViewContainer: api.dom.DivEl;

    constructor(contextView: ContextView) {
        super('context-panel');
        this.contextView = contextView;
        this.setDoOffset(false);
        this.subscribeOnEvents();
        this.contextViewContainer = new api.dom.DivEl('context-view-container');
        this.appendChild(this.contextViewContainer);
    }

    public setActive() {
        this.contextViewContainer.appendChild(this.contextView);
    }

    protected subscribeOnEvents() {
        // must be implemented by children
    }

    public setItem(item: ContentSummaryAndCompareStatus): wemQ.Promise<any> {
        return this.contextView.setItem(item);
    }

    public isVisibleOrAboutToBeVisible(): boolean {
        throw new Error('Must be implemented by inheritors');
    }

    public getActiveWidget(): WidgetView {
        return this.contextView.getActiveWidget();
    }

    getItem(): ContentSummaryAndCompareStatus {
        return this.contextView.getItem();
    }

    public notifyPanelSizeChanged() {
        this.sizeChangedListeners.forEach((listener: ()=> void) => listener());
        this.contextView.notifyPanelSizeChanged();
    }

    public onPanelSizeChanged(listener: () => void) {
        this.sizeChangedListeners.push(listener);
    }

    public getType(): CONTEXT_PANEL_TYPE {
        throw new Error('Must be implemented by inheritors');
    }

    public isMobile(): boolean {
        return this.getType() === CONTEXT_PANEL_TYPE.MOBILE;
    }
}

export enum CONTEXT_PANEL_TYPE {

    DOCKED,
    FLOATING,
    MOBILE
}
