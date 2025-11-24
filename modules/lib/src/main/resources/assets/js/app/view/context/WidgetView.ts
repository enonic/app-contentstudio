import {Widget} from '@enonic/lib-admin-ui/content/Widget';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import Q from 'q';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {ContextView} from './ContextView';
import {WidgetItemView, WidgetItemViewInterface} from './WidgetItemView';
import {LucideIcon} from 'lucide-react';

export enum InternalWidgetType {
    INFO,
    HISTORY,
    DEPENDENCIES,
    COMPONENTS,
    LAYERS
}

export class WidgetView
    extends DivEl {

    private widgetName: string;

    private widgetDescription: string;

    private widgetIconClass: string;

    private widgetIcon: LucideIcon;

    private widgetItemViews: WidgetItemViewInterface[];

    private contextView: ContextView;

    private widget: Widget;

    private containerWidth: number = 0;

    private url: string = '';

    private type: InternalWidgetType;

    private content: ContentSummaryAndCompareStatus;

    private activationListeners: (() => void)[] = [];

    public static debug: boolean = false;

    constructor(builder: WidgetViewBuilder) {
        super('widget-view ' + (builder.widget ? 'external-widget' : 'internal-widget'));

        const noDescription = i18n('field.contextPanel.noDescription');

        this.contextView = builder.contextView;
        this.widgetName = builder.name;
        this.widgetIconClass = builder.iconClass;
        this.widgetIcon = builder.icon;
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
            this.updateWidgetItemViews().catch(DefaultErrorHandler.handle);
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
                this.updateWidgetItemViews().catch(DefaultErrorHandler.handle);
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
        return this.widget.getFullUrl();
    }

    private updateCustomWidgetItemViews(): Q.Promise<void>[] {
        let promises = [];

        this.url = this.getWidgetUrl();
        this.widgetItemViews.forEach((widgetItemView: WidgetItemView) => {
            const contentId = this.content ? this.content.getContentId().toString() : null;
            promises.push(widgetItemView.fetchWidgetContents(this.url, contentId));
        });

        return promises;
    }

    public updateWidgetItemViews(): Q.Promise<void[]> {
        const content = this.contextView.getItem();
        let promises = [];

        const isValidForContent = !this.isInternal() || !!content;

        if (this.isActive() && isValidForContent) {
            this.content = content;

            if (this.isUrlBased()) {
                this.contextView.showLoadMask();
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
            this.updateWidgetItemViews().catch(DefaultErrorHandler.handle);
        }
    }

    private layout(): Q.Promise<void[]> {

        this.slideOut();

        let layoutTasks: Q.Promise<void>[] = [];

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

    getWidgetIcon(): LucideIcon {
        return this.widgetIcon;
    }

    getWidgetKey(): string {
        return this.widget ? this.widget.getWidgetDescriptorKey().getApplicationKey().getName() : null;
    }

    getWidgetIconUrl(): string {
        return this.widget ? this.widget.getFullIconUrl() : null;
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

        if (this.isExternal()) {
            this.widgetItemViews.forEach((itemView: WidgetItemView) => itemView.removeChildren());
        }

        this.contextView.resetActiveWidget();
        this.slideOut();
    }

    isActive() {
        return this.contextView.getActiveWidget() === this;
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
        return !!this.widget && !!this.getWidgetUrl();
    }

    notifyActivated() {
        this.activationListeners.forEach((listener: () => void) => listener());
    }

    onActivated(listener: () => void) {
        this.activationListeners.push(listener);
    }

    unActivated(listener: () => void) {
        this.activationListeners = this.activationListeners.filter((currentListener: () => void) => {
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

    widgetItemViews: WidgetItemViewInterface[] = [];

    widget: Widget;

    widgetClass: string;

    icon: LucideIcon;

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

    public setWidgetItemViews(widgetItemViews: WidgetItemViewInterface[]): WidgetViewBuilder {
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

    public setIcon(icon: LucideIcon) {
        this.icon = icon;
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
