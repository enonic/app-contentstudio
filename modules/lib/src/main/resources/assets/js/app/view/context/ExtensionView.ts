import {type Extension} from '@enonic/lib-admin-ui/extension/Extension';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import Q from 'q';
import {type ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {type ContextView} from './ContextView';
import {ExtensionItemView} from './ExtensionItemView';

export enum InternalExtensionType {
    INFO,
    HISTORY,
    DEPENDENCIES,
    COMPONENTS,
    LAYERS
}

export class ExtensionView
    extends DivEl {

    private readonly extensionName: string;

    private readonly extensionDescription: string;

    private readonly extensionIconClass: string;

    private readonly extensionItemViews: ExtensionItemView[];

    private contextView: ContextView;

    private readonly extension: Extension;

    private containerWidth: number = 0;

    private url: string = '';

    private readonly type: InternalExtensionType;

    private content: ContentSummaryAndCompareStatus;

    private activationListeners: (() => void)[] = [];

    public static debug: boolean = false;

    constructor(builder: ExtensionViewBuilder) {
        super('extension-view ' + (builder.extension ? 'external-extension' : 'internal-extension'));

        const noDescription = i18n('field.contextPanel.noDescription');

        this.contextView = builder.contextView;
        this.extensionName = builder.name;
        this.extensionIconClass = builder.iconClass;
        this.extensionDescription = (builder.extension ? builder.extension.getDescription() : builder.description) || noDescription;
        this.extensionItemViews = builder.extensionItemViews;
        this.extension = builder.extension;
        this.type = builder.type;
        if (!this.extensionItemViews.length) {
            this.createDefaultWidgetItemView();
        }

        if (!StringHelper.isBlank(builder.extensionClass)) {
            this.addClass(builder.extensionClass);
        }

        this.layout();

        this.applyConfig();

        this.onActivated(() => {
            this.updateExtensionItemViews().catch(DefaultErrorHandler.handle);
        });
    }

    resetContainerWidth() {
        this.containerWidth = 0;
    }

    private applyConfig() {
        if (this.isUrlBased()) {
            const config = this.extension.getConfig();
            if (config && config.hasOwnProperty('render-on-resize') && config['render-on-resize'] === 'true') {
                this.handleRerenderOnResize();
            }
        }
    }

    private handleRerenderOnResize() {
        const updateWidgetItemViewsHandler = () => {
            const containerWidth = this.contextView.getEl().getWidth();
            if (this.contextView.getItem() && containerWidth !== this.containerWidth) {
                this.updateExtensionItemViews().catch(DefaultErrorHandler.handle);
            }
        };
        this.contextView.onPanelSizeChanged(() => {
            if (this.isActive()) {
                updateWidgetItemViewsHandler();
            } else {
                const onActivatedHandler = () => {
                    updateWidgetItemViewsHandler();
                    this.unActivated(onActivatedHandler);
                };
                this.onActivated(onActivatedHandler);
            }
        });
    }

    private getExtensionUrl() {
        return this.extension.getFullUrl();
    }

    private updateCustomExtensionItemViews(): Q.Promise<void>[] {
        const promises = [];

        this.url = this.getExtensionUrl();
        this.extensionItemViews.forEach((widgetItemView: ExtensionItemView) => {
            const contentId = this.content ? this.content.getContentId().toString() : null;
            promises.push(widgetItemView.fetchExtensionContents(this.url, contentId));
        });

        return promises;
    }

    public updateExtensionItemViews(): Q.Promise<void[]> {
        const content = this.contextView.getItem();
        let promises = [];

        const isValidForContent = !this.isInternal() || !!content;

        if (this.isActive() && isValidForContent) {
            this.content = content;

            if (this.isUrlBased()) {
                this.contextView.showLoadMask();
                promises = promises.concat(this.updateCustomExtensionItemViews());
            } else {
                this.extensionItemViews.forEach((widgetItemView: ExtensionItemView) => {
                    promises.push(widgetItemView.setContentAndUpdateView(content));
                });
            }
        }

        this.containerWidth = this.contextView.getEl().getWidth();
        return Q.all(promises)
            .then((result) => {
                // Container reload during app redeploy can leave the view stuck collapsed/hidden.
                // Restore visibility deterministically after a successful refresh.
                if (this.isActive()) {
                    this.show();
                    this.extensionItemViews[0]?.show();
                    this.getEl().setMaxHeight('none');
                }
                return result;
            })
            .finally(() => this.contextView.hideLoadMask());
    }

    private createDefaultWidgetItemView() {
        this.extensionItemViews.push(new ExtensionItemView());
        if (this.contextView.getItem()) {
            this.updateExtensionItemViews().catch(DefaultErrorHandler.handle);
        }
    }

    private layout(): Q.Promise<void[]> {

        this.slideOut();

        const layoutTasks: Q.Promise<void>[] = [];

        this.extensionItemViews.forEach((itemView: ExtensionItemView) => {
            this.appendChild(itemView);
            layoutTasks.push(itemView.layout());
        });

        return Q.all(layoutTasks);
    }

    getExtensionName(): string {
        return this.extensionName;
    }

    getExtensionDescription(): string {
        return this.extensionDescription;
    }

    getExtensionIconClass(): string {
        return this.extensionIconClass;
    }

    getExtensionKey(): string {
        return this.extension ? this.extension.getDescriptorKey().getApplicationKey().getName() : null;
    }

    getExtensionIconUrl(): string {
        return this.extension ? this.extension.getFullIconUrl() : null;
    }

    isInternal(): boolean {
        return this.extension == null;
    }

    isExternal(): boolean {
        return this.extension != null;
    }

    slideOut() {
        this.getEl().setMaxHeightPx(this.getEl().getHeight()); // enables transition
        this.getEl().setMaxHeightPx(0);
    }

    slideIn() {
        this.show();
        if (this.hasDynamicHeight()) {
            this.redoLayout();
        } else {
            this.getEl().setMaxHeightPx(this.getParentElement().getEl().getHeight());
            this.extensionItemViews[0]?.show();
        }

        // End state must always be expanded; don't rely on timers that may be interrupted by container reloads.
        this.getEl().setMaxHeight('none');
    }

    setActive() {
        if (ExtensionView.debug) {
            console.debug('ExtensionView.setActive: ', this.getExtensionName());
        }
        if (this.isActive()) {
            return;
        }
        this.contextView.setActiveExtension(this);
        this.notifyActivated();
        this.slideIn();
    }

    setInactive() {
        if (ExtensionView.debug) {
            console.debug('ExtensionView.setInactive: ', this.getExtensionName());
        }

        if (this.isExternal()) {
            this.extensionItemViews.forEach((itemView: ExtensionItemView) => {
                itemView.cleanupWidget();
                itemView.removeChildren();
            });
        }

        this.contextView.resetActiveExtension();
        this.slideOut();
    }

    isActive() {
        return this.contextView.getActiveExtension() === this;
    }

    getType(): InternalExtensionType {
        return this.type;
    }

    hasType(): boolean {
        return this.type != null;
    }

    hasKey(): boolean {
        return this.getExtensionKey() != null;
    }

    compareByType(extensionView: ExtensionView): boolean {
        return extensionView != null && (
            this === extensionView ||
            (this.getType() === extensionView.getType() && this.hasType() && extensionView.hasType()) ||
            (this.getExtensionKey() === extensionView.getExtensionKey() && this.hasKey() && extensionView.hasKey())
        );
    }

    private hasDynamicHeight(): boolean {
        return this.isUrlBased() && this.isActive();
    }

    private redoLayout() {
        const firstItemView = this.extensionItemViews[0];
        if (!firstItemView) {
            return;
        }
        this.getEl().setHeight('');
        firstItemView.hide();
        // Use plain timeouts only; "added" events may not fire when the host reconnects existing DOM nodes.
        setTimeout(() => firstItemView.show(), 200);
    }

    private isUrlBased(): boolean {
        return !!this.extension && !!this.getExtensionUrl();
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

    public static create(): ExtensionViewBuilder {
        return new ExtensionViewBuilder();
    }
}

export class ExtensionViewBuilder {

    name: string;

    description: string;

    contextView: ContextView;

    extensionItemViews: ExtensionItemView[] = [];

    extension: Extension;

    extensionClass: string;

    iconClass: string;

    type: InternalExtensionType;

    public setName(name: string): ExtensionViewBuilder {
        this.name = name;
        return this;
    }

    public setDescription(description: string): ExtensionViewBuilder {
        this.description = description;
        return this;
    }

    public setContextView(contextView: ContextView): ExtensionViewBuilder {
        this.contextView = contextView;
        return this;
    }

    public addExtensionItemView(extensionItemView: ExtensionItemView): ExtensionViewBuilder {
        this.extensionItemViews.push(extensionItemView);
        return this;
    }

    public setExtension(extension: Extension): ExtensionViewBuilder {
        this.extension = extension;
        return this;
    }

    public setExtensionItemViews(extensionItemViews: ExtensionItemView[]): ExtensionViewBuilder {
        this.extensionItemViews = extensionItemViews;
        return this;
    }

    public setExtensionClass(extensionClass: string) {
        this.extensionClass = extensionClass;
        return this;
    }

    public setIconClass(iconClass: string) {
        this.iconClass = iconClass;
        return this;
    }

    public setType(type: InternalExtensionType) {
        this.type = type;
        return this;
    }

    build(): ExtensionView {
        return new ExtensionView(this);
    }
}
