import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {LoadMask} from '@enonic/lib-admin-ui/ui/mask/LoadMask';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {cn} from '@enonic/ui';
import Q from 'q';
import {PreviewLabelElement} from '../../../v6/features/shared/PreviewLabel';
import {setActiveWidgetId as setActiveExtensionId} from '../../../v6/features/store/contextWidgets.store';
import WidgetsSelectorElement from '../../../v6/features/views/context/widget/WidgetsSelector';
import {CompareStatus} from '../../content/CompareStatus';
import type {ContentId} from '../../content/ContentId';
import type {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {ContentServerEventsHandler} from '../../event/ContentServerEventsHandler';
import {type ExtensionView, type InternalExtensionType} from './ExtensionView';
import {ReloadActiveExtensionEvent} from './ReloadActiveExtensionEvent';

export class ContextView
    extends DivEl {

    private widgets: ExtensionView[] = [];
    private contextContainer: DivEl;
    private widgetsSelector: WidgetsSelectorElement;

    private loadMask: LoadMask;
    private divForNoSelection: DivEl;

    private item: ContentSummaryAndCompareStatus;

    private activeWidget: ExtensionView;
    private defaultWidget: ExtensionView;

    private sizeChangedListeners: (() => void)[] = [];

    public static debug: boolean = false;

    constructor() {
        super('context-panel-view bg-surface-neutral');

        this.contextContainer = new DivEl(cn('context-container p-5 pb-7.5'));

        this.loadMask = new LoadMask(this);
        this.loadMask.addClass('context-panel-mask');
        this.appendChild(this.loadMask);

        this.initDivForNoSelection();
        this.initWidgetsSelector();

        this.appendChild(this.contextContainer);
        this.appendChild(this.divForNoSelection);

        this.subscribeToEvents();

        this.layout();
    }

    setWidgets(widgets: ExtensionView[], defaultWidget?: ExtensionView): void {
        this.widgets.forEach(w => w.remove());
        this.widgets = [];

        widgets.forEach(w => {
            this.widgets.push(w);
            this.contextContainer.appendChild(w);
        });

        if (defaultWidget) {
            this.defaultWidget = defaultWidget;
            this.setActiveExtension(defaultWidget);
        }

        this.refreshSelector();
    }

    addWidget(widget: ExtensionView): void {
        this.widgets.push(widget);
        this.contextContainer.appendChild(widget);
        this.refreshSelector();
    }

    insertWidget(widget: ExtensionView, index: number): void {
        this.widgets.splice(index, 0, widget);
        this.contextContainer.insertChild(widget, index);
        this.refreshSelector();
    }

    removeWidgetByKey(key: string): void {
        const widget = this.getWidgetByKey(key);
        if (!widget) return;

        this.widgets = this.widgets.filter(w => w !== widget);
        widget.remove();

        if (this.isActiveWidget(key)) {
            this.activateDefaultWidget();
        }

        this.refreshSelector();
    }

    replaceWidgetByKey(key: string, widget: ExtensionView): void {
        const index = this.widgets.findIndex(w => w.getExtensionKey() === key);
        if (index < 0) return;

        const wasActive = this.isActiveWidget(key);

        this.widgets[index].replaceWith(widget);
        this.widgets[index] = widget;

        if (wasActive) {
            this.resetActiveExtension();
            widget.setActive();
        }

        this.refreshSelector();
    }

    getWidgetByKey(key: string): ExtensionView | null {
        return this.widgets.find(w => w.getExtensionKey() === key) ?? null;
    }

    getWidgets(): ExtensionView[] {
        return [...this.widgets];
    }

    setDefaultWidget(widget: ExtensionView): void {
        this.defaultWidget = widget;
    }

    activateDefaultWidget(): void {
        this.defaultWidget?.setActive();
    }

    setActiveExtension(widget: ExtensionView): void {
        if (this.activeWidget) {
            this.activeWidget.setInactive();
        }

        this.activeWidget = widget;
        this.activeWidget.addClass('active');

        setActiveExtensionId(this.activeWidget.getExtensionKey());

        this.toggleClass('default-extension', this.defaultWidget?.isActive() ?? false);
        this.toggleClass('internal', widget.isInternal());

        this.widgetsSelector?.updateState(this.activeWidget);
    }

    setActiveExtensionByType(type: InternalExtensionType): void {
        const widget = this.widgets.find(w => w.getType() === type);
        if (!widget) return;
        this.setActiveExtension(widget);
    }

    getActiveExtension(): ExtensionView {
        return this.activeWidget;
    }

    resetActiveExtension(): void {
        if (this.activeWidget) {
            this.activeWidget.removeClass('active');
        }
        this.activeWidget = null;
        setActiveExtensionId(undefined);
    }

    updateActiveExtension(): Q.Promise<void> {
        if (!this.activeWidget) {
            return Q();
        }

        return this.activeWidget.updateExtensionItemViews().then(() => {
            this.activeWidget.slideIn();
        }).catch(DefaultErrorHandler.handle);
    }

    setItem(item: ContentSummaryAndCompareStatus): Q.Promise<void> {
        if (ContextView.debug) {
            console.debug('ContextView.setItem: ', item);
        }
        const itemSelected = item != null;
        const selectionChanged = !ObjectHelper.equals(this.item, item);

        this.item = item;

        const activeWidgetVisible = this.activeWidget != null && this.isVisible();

        this.layout(!itemSelected);
        if (activeWidgetVisible && selectionChanged && (this.activeWidget.isExternal() || itemSelected)) {
            return this.updateActiveExtension();
        }

        return Q();
    }

    getItem(): ContentSummaryAndCompareStatus {
        return this.item;
    }

    showLoadMask(): void {
        this.loadMask.show();
    }

    hideLoadMask(): void {
        this.loadMask.hide();
    }

    onPanelSizeChanged(listener: () => void): void {
        this.sizeChangedListeners.push(listener);
    }

    notifyPanelSizeChanged(): void {
        this.sizeChangedListeners.forEach(listener => listener());
    }

    isVisible(): boolean {
        return super.isVisible() && this.getEl().getWidth() > 0;
    }

    getContextContainer(): DivEl {
        return this.contextContainer;
    }

    private initDivForNoSelection(): void {
        this.divForNoSelection = new DivEl('no-selection-message bg-surface-primary');
        const label = new PreviewLabelElement({messages: [i18n('field.contextPanel.empty')], className: 'h-full text-base'});
        this.divForNoSelection.appendChild(label);
        this.appendChild(this.divForNoSelection);
    }

    private initWidgetsSelector(): void {
        this.widgetsSelector = new WidgetsSelectorElement({});
        this.appendChild(this.widgetsSelector);
        this.widgetsSelector.updateState(this.activeWidget);
    }

    private subscribeToEvents(): void {
        const contentServerEventsHandler = ContentServerEventsHandler.getInstance();

        contentServerEventsHandler.onContentPermissionsUpdated((contentIds: ContentId[]) => {
            const itemSelected = this.item != null;
            const activeWidgetVisible = this.activeWidget != null && this.isVisible();

            if (activeWidgetVisible && this.activeWidget.isInternal() && itemSelected &&
                contentIds.some(id => id.equals(this.item.getContentId()))) {
                this.updateActiveExtension();
            }
        });

        contentServerEventsHandler.onContentPublished((contents: ContentSummaryAndCompareStatus[]) => {
            if (!this.item) return;

            const itemId = this.item.getId();

            contents
                .filter(content => content.getId() === itemId)
                .forEach(content => {
                    const isSameContent = this.item.equals(content);
                    const wasModified = this.item.getCompareStatus() !== CompareStatus.NEW;

                    if (!isSameContent && wasModified) {
                        this.setItem(content);
                    }
                });
        });

        ReloadActiveExtensionEvent.on(() => {
            this.activeWidget?.updateExtensionItemViews().catch(DefaultErrorHandler.handle);
        });
    }

    private isActiveWidget(key: string): boolean {
        return this.activeWidget != null && this.activeWidget.getExtensionKey() === key;
    }

    private refreshSelector(): void {
        this.widgetsSelector.updateExtensionsSelector(this.widgets);
        this.widgetsSelector.updateState(this.activeWidget);
    }

    private layout(empty: boolean = true): void {
        this.toggleClass('no-selection', empty);
    }
}
