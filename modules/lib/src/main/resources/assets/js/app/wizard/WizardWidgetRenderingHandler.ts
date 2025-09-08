import {RenderingMode} from '../rendering/RenderingMode';
import {WidgetRenderingHandler, WidgetRenderer, PREVIEW_TYPE} from '../view/WidgetRenderingHandler';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ViewWidgetEvent} from '../event/ViewWidgetEvent';
import {ContentSummary} from '../content/ContentSummary';
import Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {AEl} from '@enonic/lib-admin-ui/dom/AEl';
import {PageNavigationMediator} from './PageNavigationMediator';
import {PageNavigationEvent} from './PageNavigationEvent';
import {PageNavigationEventType} from './PageNavigationEventType';
import {PageNavigationEventData} from './PageNavigationEventData';
import {ComponentPath} from '../page/region/ComponentPath';

export class WizardWidgetRenderingHandler
    extends WidgetRenderingHandler {

    private placeholderView: DivEl;
    private pageSettingsLink: AEl;
    private enabled: boolean;
    private hasControllersDeferred: Q.Deferred<boolean>;
    private hasPageDeferred: Q.Deferred<boolean>;

    constructor(renderer: WidgetRenderer) {
        super(renderer);
        this.mode = RenderingMode.EDIT;
    }

    protected createEmptyView(): DivEl {
        this.placeholderView = super.createMessageView(this.getDefaultMessage(), 'no-selection-message');

        this.pageSettingsLink = new AEl('page-settings-link');
        this.pageSettingsLink.setHtml(i18n('action.pageSettings.open'));
        this.pageSettingsLink.onClicked((e) => {
            PageNavigationMediator.get().notify(
                new PageNavigationEvent(PageNavigationEventType.INSPECT, new PageNavigationEventData(ComponentPath.root())));
        })
        this.setEnabled(this.enabled);

        this.placeholderView.appendChild(this.pageSettingsLink);

        return this.placeholderView;
    }

    protected getDefaultMessage(): string {
        return i18n('field.editing.notAvailable');
    }

    async render(summary: ContentSummary, widget): Promise<boolean> {
        this.hasControllersDeferred = Q.defer<boolean>();
        this.hasPageDeferred = Q.defer<boolean>();
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

    public reset() {
        // this.placeholderView?.deselectOptions();
    }

    public setEnabled(enabled: boolean) {
        this.enabled = enabled;
        this.pageSettingsLink.setVisible(enabled);
    }

    public hasControllers(): Q.Promise<boolean> {
        return this.hasControllersDeferred ? this.hasControllersDeferred.promise : Q.resolve(false);
    }

    public hasPage(): Q.Promise<boolean> {
        return this.hasPageDeferred ? this.hasPageDeferred.promise : Q.resolve(false);
    }


}
