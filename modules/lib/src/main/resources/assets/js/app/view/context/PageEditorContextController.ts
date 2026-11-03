import { getIsMobile } from '@enonic/ui';
import { $contextContent } from '../../../v6/entities/content';
import { getDetailsWidgetKey } from '../../../v6/shared/lib/widget/details';
import { getPageEditorWidgetKey } from '../../../v6/shared/lib/widget/pageEditor';
import {
    $activeWidgetId,
    activateDefaultWidget,
    setDefaultWidget,
} from '../../../v6/widgets/context-panel/model/contextWidgets.store';
import { PageEventsManager } from '../../wizard/PageEventsManager';
import { type PageNavigationEvent } from '../../wizard/PageNavigationEvent';
import { PageNavigationEventType } from '../../wizard/PageNavigationEventType';
import { type PageNavigationHandler } from '../../wizard/PageNavigationHandler';
import { PageNavigationMediator } from '../../wizard/PageNavigationMediator';

export class PageEditorContextController implements PageNavigationHandler {
    private isPageRenderable: boolean | undefined;

    private readonly renderableHandler = (renderable: boolean): void => {
        const wasRenderable = this.isPageRenderable;
        this.isPageRenderable = renderable;

        if (wasRenderable !== undefined && renderable !== wasRenderable) {
            this.refresh();
        }
    };

    constructor() {
        PageEventsManager.get().onRenderableChanged(this.renderableHandler);
        PageNavigationMediator.get().addPageNavigationHandler(this);
    }

    handle(event: PageNavigationEvent): void {
        const type = event.getType();
        if (type === PageNavigationEventType.INSPECT || (type === PageNavigationEventType.SELECT && !getIsMobile())) {
            this.activatePageEditor();
        }
    }

    destroy(): void {
        PageEventsManager.get().unRenderableChanged(this.renderableHandler);
        PageNavigationMediator.get().removePageNavigationItem(this);
    }

    private refresh(): void {
        const item = $contextContent.get();
        const shouldActivate = (this.isPageRenderable && !item?.getType()?.isShortcut()) || item?.isPage();

        if (shouldActivate) {
            this.activatePageEditor();
        } else {
            this.deactivatePageEditor();
        }
    }

    private activatePageEditor(): void {
        setDefaultWidget(getPageEditorWidgetKey());
        activateDefaultWidget();
    }

    private deactivatePageEditor(): void {
        const wasPageEditorActive = $activeWidgetId.get() === getPageEditorWidgetKey();

        setDefaultWidget(getDetailsWidgetKey());

        if (wasPageEditorActive) {
            activateDefaultWidget();
        }
    }
}
