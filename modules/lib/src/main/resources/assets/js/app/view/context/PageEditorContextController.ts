import {type ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {InspectEvent} from '../../event/InspectEvent';
import {PageEventsManager} from '../../wizard/PageEventsManager';
import {type PageNavigationEvent} from '../../wizard/PageNavigationEvent';
import {PageNavigationEventType} from '../../wizard/PageNavigationEventType';
import {type PageNavigationHandler} from '../../wizard/PageNavigationHandler';
import {PageNavigationMediator} from '../../wizard/PageNavigationMediator';
import {type ContextView} from './ContextView';
import {type ExtensionView} from './ExtensionView';

export class PageEditorContextController implements PageNavigationHandler {

    private readonly contextView: ContextView;
    private readonly pageEditorWidget: ExtensionView;
    private readonly fallbackWidget: ExtensionView;
    private readonly versionsWidget: ExtensionView;

    private getItem: () => ContentSummaryAndCompareStatus | null;

    private isPageRenderable: boolean | undefined;

    private pageEditorIsDefault: boolean = false;

    constructor(params: {
        contextView: ContextView;
        pageEditorWidget: ExtensionView;
        fallbackWidget: ExtensionView;
        versionsWidget: ExtensionView;
        getItem: () => ContentSummaryAndCompareStatus | null;
    }) {
        this.contextView = params.contextView;
        this.pageEditorWidget = params.pageEditorWidget;
        this.fallbackWidget = params.fallbackWidget;
        this.versionsWidget = params.versionsWidget;
        this.getItem = params.getItem;

        this.subscribe();
    }

    handle(event: PageNavigationEvent): void {
        const type = event.getType();
        if (type === PageNavigationEventType.SELECT || type === PageNavigationEventType.INSPECT) {
            this.activatePageEditor();
        }
    }

    private refresh(): void {
        const item = this.getItem();
        const shouldActivate = (this.isPageRenderable && !item?.getType()?.isShortcut())
            || item?.getContentSummary()?.isPage();

        if (shouldActivate) {
            this.activatePageEditor();
        } else {
            this.deactivatePageEditor();
        }
    }

    private subscribe(): void {
        const inspectHandler = (event: InspectEvent) => {
            const isVersionsActive = this.contextView.getActiveExtension() === this.versionsWidget;

            if (event.isShowExtension() && !isVersionsActive && this.pageEditorIsDefault) {
                this.contextView.activateDefaultWidget();
            }
        };

        const renderableHandler = (renderable: boolean) => {
            const wasRenderable = this.isPageRenderable;
            this.isPageRenderable = renderable;

            if (wasRenderable !== undefined && renderable !== wasRenderable) {
                this.refresh();
            }
        };

        InspectEvent.on(inspectHandler);
        PageEventsManager.get().onRenderableChanged(renderableHandler);
        PageNavigationMediator.get().addPageNavigationHandler(this);

        this.contextView.onRemoved(() => {
            InspectEvent.un(inspectHandler);
            PageEventsManager.get().unRenderableChanged(renderableHandler);
            PageNavigationMediator.get().removePageNavigationItem(this);
        });
    }

    private activatePageEditor(): void {
        this.contextView.setDefaultWidget(this.pageEditorWidget);
        this.pageEditorIsDefault = true;
        this.contextView.activateDefaultWidget();
    }

    private deactivatePageEditor(): void {
        const wasPageEditorActive = this.pageEditorWidget.compareByType(this.contextView.getActiveExtension());

        this.contextView.setDefaultWidget(this.fallbackWidget);
        this.pageEditorIsDefault = false;

        if (wasPageEditorActive) {
            this.contextView.activateDefaultWidget();
        }
    }
}
