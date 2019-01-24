import {ContextView} from './ContextView';
import {WidgetItemView} from './WidgetItemView';
import {UriHelper} from '../../rendering/UriHelper';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import Widget = api.content.Widget;

export class WidgetView extends api.dom.DivEl {

    private widgetName: string;

    private widgetItemViews: WidgetItemView[];

    private contextView: ContextView;

    private widget: Widget;

    private containerWidth: number = 0;

    private url: string = '';

    private content: ContentSummaryAndCompareStatus;

    private activationListeners: { (): void }[] = [];

    public static debug: boolean = false;

    constructor(builder: WidgetViewBuilder) {
        super('widget-view ' + (builder.widget ? 'external-widget' : 'internal-widget'));

        this.contextView = builder.contextView;
        this.widgetName = builder.name;
        this.widgetItemViews = builder.widgetItemViews;
        this.widget = builder.widget;
        if (!this.widgetItemViews.length) {
            this.createDefaultWidgetItemView();
        }

        this.layout();

        this.applyConfig();

        this.onActivated(() => {
            this.updateWidgetItemViews();
        });
    }

    resetContainerWidth() {
        this.containerWidth = 0;
    }

    private applyConfig() {
        if (this.isUrlBased()) {
            let config = this.widget.getConfig();
            if (!!config && config.hasOwnProperty('render-on-resize') && config['render-on-resize'] === 'true') {
                this.handleRerenderOnResize();
            }
        }
    }

    private handleRerenderOnResize() {
        let updateWidgetItemViewsHandler = () => {
            let containerWidth = this.contextView.getEl().getWidth();
            if (this.contextView.getItem() && containerWidth !== this.containerWidth) {
                this.updateWidgetItemViews();
            }
        };
        this.contextView.onPanelSizeChanged(() => {
            if (this.isActive()) {
                updateWidgetItemViewsHandler();
            } else {
                let onActivatedHandler = () => {
                    updateWidgetItemViewsHandler();
                    this.unActivated(onActivatedHandler);
                };
                this.onActivated(onActivatedHandler);
            }
        });
    }

    private getWidgetUrl() {
        return UriHelper.getAdminUri(this.widget.getUrl(), '/');
    }

    private updateCustomWidgetItemViews(): wemQ.Promise<any>[] {
        let promises = [];

        this.url = this.getWidgetUrl();
        this.widgetItemViews.forEach((widgetItemView: WidgetItemView) => {
            promises.push(widgetItemView.setUrl(this.url, this.content.getContentId().toString()));
        });

        return promises;
    }

    public updateWidgetItemViews(): wemQ.Promise<any> {
        let content = this.contextView.getItem();
        let promises = [];

        if (this.isActive() && this.contextView.getItem()) {
            this.contextView.showLoadMask();
            this.content = content;

            if (this.isUrlBased()) {
                promises = promises.concat(this.updateCustomWidgetItemViews());
            } else {
                this.widgetItemViews.forEach((widgetItemView: WidgetItemView) => {
                    promises.push(widgetItemView.setContentAndUpdateView(content));
                });
            }
        }

        this.containerWidth = this.contextView.getEl().getWidth();
        return wemQ.all(promises).finally(() => this.contextView.hideLoadMask());
    }

    private createDefaultWidgetItemView() {
        this.widgetItemViews.push(new WidgetItemView());
        if (this.contextView.getItem()) {
            this.updateWidgetItemViews();
        }
    }

    private layout(): wemQ.Promise<any> {

        this.slideOut();

        let layoutTasks: wemQ.Promise<any>[] = [];

        this.widgetItemViews.forEach((itemView: WidgetItemView) => {
            this.appendChild(itemView);
            layoutTasks.push(itemView.layout());
        });

        return wemQ.all(layoutTasks);
    }

    getWidgetName(): string {
        return this.widgetName;
    }

    getWidgetKey(): string {
        return this.widget ? this.widget.getWidgetDescriptorKey().getApplicationKey().getName() : null;
    }

    getWidgetDescription(): string {
        return this.widget ? this.widget.getDescription() : null;
    }

    getWidgetIconUrl(): string {
        return this.widget ? this.widget.getIconUrl() : null;
    }

    slideOut() {
        this.getEl().setMaxHeightPx(this.getEl().getHeight()); // enables transition
        this.getEl().setMaxHeightPx(0);
    }

    slideIn() {
        if (this.hasDynamicHeight()) {
            this.redoLayout();
        } else {
            this.getEl().setMaxHeightPx(this.getParentElement().getEl().getHeight());
        }

        setTimeout(() => {
            this.getEl().setMaxHeight('none');
        }, 100);
    }

    setActive() {
        if (WidgetView.debug) {
            console.debug('WidgetView.setActive: ', this.getWidgetName());
        }
        if (this.isActive()) {
            return;
        }
        this.contextView.setActiveWidget(this);
        this.notifyActivated();
        this.slideIn();
    }

    setInactive() {
        if (WidgetView.debug) {
            console.debug('WidgetView.setInactive: ', this.getWidgetName());
        }
        this.contextView.resetActiveWidget();
        this.slideOut();
    }

    isActive() {
        return this.contextView.getActiveWidget() === this;
    }

    private hasDynamicHeight(): boolean {
        return this.isUrlBased() && this.isActive();
    }

    private redoLayout() {
        let firstItemView = this.widgetItemViews[0];
        if (!firstItemView) {
            return;
        }
        this.getEl().setHeight('');
        firstItemView.hide();
        setTimeout(() => {
            firstItemView.show();
        }, 200);
    }

    private isUrlBased(): boolean {
        return !!this.widget && !!this.widget.getUrl();
    }

    notifyActivated() {
        this.activationListeners.forEach((listener: ()=> void) => listener());
    }

    onActivated(listener: () => void) {
        this.activationListeners.push(listener);
    }

    unActivated(listener: ()=>void) {
        this.activationListeners = this.activationListeners.filter((currentListener: ()=>void) => {
            return currentListener !== listener;
        });
    }

    public static create(): WidgetViewBuilder {
        return new WidgetViewBuilder();
    }
}

export class WidgetViewBuilder {

    name: string;

    contextView: ContextView;

    widgetItemViews: WidgetItemView[] = [];

    widget: Widget;

    public setName(name: string): WidgetViewBuilder {
        this.name = name;
        return this;
    }

    public setContextView(contextView: ContextView): WidgetViewBuilder {
        this.contextView = contextView;
        return this;
    }

    public addWidgetItemView(widgetItemView: WidgetItemView): WidgetViewBuilder {
        this.widgetItemViews.push(widgetItemView);
        return this;
    }

    public setWidget(widget: Widget): WidgetViewBuilder {
        this.widget = widget;
        return this;
    }

    public setWidgetItemViews(widgetItemViews: WidgetItemView[]): WidgetViewBuilder {
        this.widgetItemViews = widgetItemViews;
        return this;
    }

    build(): WidgetView {
        return new WidgetView(this);
    }
}
