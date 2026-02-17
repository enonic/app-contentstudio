import {RenderingMode} from '../rendering/RenderingMode';
import {WidgetRenderingHandler, type WidgetRenderer, PREVIEW_TYPE} from '../view/WidgetRenderingHandler';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {type ViewWidgetEvent} from '../event/ViewWidgetEvent';
import {type ContentSummary} from '../content/ContentSummary';
import Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {PageNavigationMediator} from './PageNavigationMediator';
import {PageNavigationEvent} from './PageNavigationEvent';
import {PageNavigationEventType} from './PageNavigationEventType';
import {PageNavigationEventData} from './PageNavigationEventData';
import {ComponentPath} from '../page/region/ComponentPath';
import {ItemViewContextMenu} from '../../page-editor/ItemViewContextMenu';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {PageViewContextMenuTitle} from '../../page-editor/PageViewContextMenuTitle';
import {type ItemViewContextMenuTitle} from '../../page-editor/ItemViewContextMenuTitle';

export class WizardWidgetRenderingHandler
    extends WidgetRenderingHandler {

    private hasControllersDeferred: Q.Deferred<boolean>;
    private hasPageDeferred: Q.Deferred<boolean>;
    private contextMenu: ItemViewContextMenu;
    private contextMenuTitle: ItemViewContextMenuTitle;
    private shader: DivEl;

    constructor(renderer: WidgetRenderer) {
        super(renderer);
        this.mode = RenderingMode.EDIT;
        this.contextMenu = this.initContextMenu();
        this.shader = new DivEl('shader');
        this.contextMenu.onShown((e) => this.shader.addClass('visible'));
        this.contextMenu.onHidden((e) => this.shader.removeClass('visible'));
    }

    protected createEmptyView(): DivEl {
        const placeholderView = super.createMessageView(this.getDefaultMessage(), 'no-selection-message');

        const handler = this.clickHandler.bind(this)

        placeholderView.onClicked(handler);
        placeholderView.onContextMenu(handler);

        return placeholderView;
    }

    protected createErrorView(): DivEl {
        const errorView = super.createErrorView();

        const handler = this.clickHandler.bind(this)

        errorView.onClicked(handler);
        errorView.onContextMenu(handler);

        return errorView;
    }

    private clickHandler(event: MouseEvent): void {
        event.stopPropagation();
        event.preventDefault();
        const isMenuVisible = this.contextMenu.isVisible();
        if (isMenuVisible) {
            this.contextMenu.hide();
        } else {
            this.contextMenu.showAt(event.pageX, event.pageY);
        }
    };

    private initContextMenu(): ItemViewContextMenu {
        const unlockAction = new Action(i18n('action.page.settings'));
        unlockAction.onExecuted(() => {
            PageNavigationMediator.get().notify(
                new PageNavigationEvent(PageNavigationEventType.INSPECT, new PageNavigationEventData(ComponentPath.root())));
        });

        this.contextMenuTitle = new PageViewContextMenuTitle('');

        const contextMenu = new ItemViewContextMenu(this.contextMenuTitle, [unlockAction]);
        contextMenu.onTouchEnd((event: TouchEvent) => {
            event.stopPropagation();
        });

        return contextMenu;
    }

    layout() {
        super.layout();
        this.renderer.getChildrenContainer().appendChild(this.shader);
    }

    async render(summary: ContentSummary, widget): Promise<boolean> {
        this.hasControllersDeferred = Q.defer<boolean>();
        this.hasPageDeferred = Q.defer<boolean>();
        this.contextMenuTitle.setMainName(summary.getDisplayName());
        return super.render(summary, widget);
    }

    protected extractWidgetData(response: Response): Record<string, never> {
        const data = super.extractWidgetData(response);
        this.hasControllersDeferred.resolve(data?.hasControllers);
        this.hasPageDeferred.resolve(data?.hasPage);
        return data;
    }

    protected handlePreviewFailure(response?: Response, data?: Record<string, never>) {
        if (data?.hasControllers && !data.hasPage) {
            // special handling for site engine to link to page settings
            super.setPreviewType(PREVIEW_TYPE.EMPTY);
            this.hideMask();
        } else {
            super.handlePreviewFailure(response, data);
        }
    }

    protected handleWidgetEvent(event: ViewWidgetEvent) {
        // do nothing, we want to handle it in LiveFormPanel
    }

    public hasControllers(): Q.Promise<boolean> {
        return this.hasControllersDeferred ? this.hasControllersDeferred.promise : Q.resolve(false);
    }

    public hasPage(): Q.Promise<boolean> {
        return this.hasPageDeferred ? this.hasPageDeferred.promise : Q.resolve(false);
    }


}
