import type Q from 'q';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {type ContextView} from './ContextView';
import {type WidgetView} from './WidgetView';
import {type ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';

export class ContextPanel
    extends Panel {

    private sizeChangedListeners: (()  => void)[] = [];

    protected contextView: ContextView;

    private contextViewContainer: DivEl;

    constructor(contextView: ContextView) {
        super('context-panel');
        this.contextView = contextView;
        this.setDoOffset(false);
        this.subscribeOnEvents();
        this.contextViewContainer = new DivEl('context-view-container');
        this.appendChild(this.contextViewContainer);
        this.contextViewContainer.appendChild(this.contextView);
    }

    protected subscribeOnEvents() {
        // must be implemented by children
    }

    public setItem(item: ContentSummaryAndCompareStatus): Q.Promise<void> {
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
}
