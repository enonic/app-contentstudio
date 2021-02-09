import * as Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {ContextView} from './ContextView';
import {WidgetItemView} from './WidgetItemView';
import {UriHelper} from '../../rendering/UriHelper';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {Widget} from 'lib-admin-ui/content/Widget';

export enum InternalWidgetType {
    INFO,
    HISTORY,
    DEPENDENCIES,
    EMULATOR,
    COMPONENTS,
    LAYERS
}

export class WidgetView
    extends DivEl {

    private widgetName: string;

    private widgetDescription: string;

    private widgetIconClass: string;

    private widgetItemViews: WidgetItemView[];

    private contextView: ContextView;

    private widget: Widget;

    private containerWidth: number = 0;

    private url: string = '';

    private type: InternalWidgetType;

    private content: ContentSummaryAndCompareStatus;

    private activationListeners: { (): void }[] = [];

    public static debug: boolean = false;

    constructor(builder: WidgetViewBuilder) {
        super('widget-view ' + (builder.widget ? 'external-widget' : 'internal-widget'));

        const noDescription = i18n('field.contextPanel.noDescription');

        this.contextView = builder.contextView;
        this.widgetName = builder.name;
        this.widgetIconClass = builder.iconClass;
        this.widgetDescription = (builder.widget ? builder.widget.getDescription() : builder.description) || noDescription;
        this.widgetItemViews = builder.widgetItemViews;
        this.widget = builder.widget;
        this.type = builder.type;
        if (!this.widgetItemViews.length) {
            this.createDefaultWidgetItemView();
        }

        if (!StringHelper.isBlank(builder.widgetClass)) {
            this.addClass(builder.widgetClass);
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
            if (config && config.hasOwnProperty('render-on-resize') && config['render-on-resize'] === 'true') {
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

    private updateCustomWidgetItemViews(): Q.Promise<any>[] {
        let promises = [];

        this.url = this.getWidgetUrl();
        this.widgetItemViews.forEach((widgetItemView: WidgetItemView) => {
            const contentId = this.content ? this.content.getContentId().toString() : null;
            promises.push(widgetItemView.fetchWidgetContents(this.url, contentId));
        });

        return promises;
    }

    public updateWidgetItemViews(): Q.Promise<any> {
        const content = this.contextView.getItem();
        let promises = [];

        const isValidForContent = !this.isInternal() || !!content;

        if (this.isActive() && isValidForContent) {
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
        return Q.all(promises).finally(() => this.contextView.hideLoadMask());
    }

    private createDefaultWidgetItemView() {
        this.widgetItemViews.push(new WidgetItemView());
        if (this.contextView.getItem()) {
            this.updateWidgetItemViews();
        }
    }

    private layout(): Q.Promise<any> {

        this.slideOut();

        let layoutTasks: Q.Promise<any>[] = [];

        this.widgetItemViews.forEach((itemView: WidgetItemView) => {
            this.appendChild(itemView);
            layoutTasks.push(itemView.layout());
        });

        return Q.all(layoutTasks);
    }

    getWidgetName(): string {
        return this.widgetName;
    }

    getWidgetDescription(): string {
        return this.widgetDescription;
    }

    getWidgetIconClass(): string {
        return this.widgetIconClass;
    }

    getWidgetKey(): string {
        return this.widget ? this.widget.getWidgetDescriptorKey().getApplicationKey().getName() : null;
    }

    getWidgetIconUrl(): string {
        return this.widget ? this.widget.getIconUrl() : null;
    }

    isInternal(): boolean {
        return this.widget == null;
    }

    isExternal(): boolean {
        return this.widget != null;
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

        this.widgetItemViews.forEach((itemView: WidgetItemView) => {
            itemView.reset();
        });
        this.contextView.resetActiveWidget();
        this.slideOut();
    }

    isActive() {
        return this.contextView.getActiveWidget() === this;
    }

    isEmulator(): boolean {
        return this.type === InternalWidgetType.EMULATOR;
    }

    getType(): InternalWidgetType {
        return this.type;
    }

    hasType(): boolean {
        return this.type != null;
    }

    hasKey(): boolean {
        return this.getWidgetKey() != null;
    }

    compareByType(widgetView: WidgetView): boolean {
        return widgetView != null && (
            this === widgetView ||
            (this.getType() === widgetView.getType() && this.hasType() && widgetView.hasType()) ||
            (this.getWidgetKey() === widgetView.getWidgetKey() && this.hasKey() && widgetView.hasKey())
        );
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

    description: string;

    contextView: ContextView;

    widgetItemViews: WidgetItemView[] = [];

    widget: Widget;

    widgetClass: string;

    iconClass: string;

    type: InternalWidgetType;

    public setName(name: string): WidgetViewBuilder {
        this.name = name;
        return this;
    }

    public setDescription(description: string): WidgetViewBuilder {
        this.description = description;
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

    public setWidgetClass(widgetClass: string) {
        this.widgetClass = widgetClass;
        return this;
    }

    public setIconClass(iconClass: string) {
        this.iconClass = iconClass;
        return this;
    }

    public setType(type: InternalWidgetType) {
        this.type = type;
        return this;
    }

    build(): WidgetView {
        return new WidgetView(this);
    }
}
