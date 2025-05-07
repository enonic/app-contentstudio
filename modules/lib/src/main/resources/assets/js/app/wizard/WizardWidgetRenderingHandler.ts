import {RenderingMode} from '../rendering/RenderingMode';
import {WidgetRenderingHandler, WidgetRenderer, PREVIEW_TYPE} from '../view/WidgetRenderingHandler';
import {LiveEditPagePlaceholder} from './page/LiveEditPagePlaceholder';
import {Content} from '../content/Content';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ViewWidgetEvent} from '../event/ViewWidgetEvent';
import {ContentType} from '../inputtype/schema/ContentType';
import {ContentSummary} from '../content/ContentSummary';
import * as Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export class WizardWidgetRenderingHandler
    extends WidgetRenderingHandler {

    private placeholderView: LiveEditPagePlaceholder;
    private enabled: boolean;
    private hasControllersDeferred: Q.Deferred<boolean>;
    private hasPageDeferred: Q.Deferred<boolean>;

    constructor(renderer: WidgetRenderer, content: Content, contentType: ContentType) {
        super(renderer);
        this.mode = RenderingMode.EDIT;

        this.placeholderView.setContentType(contentType);
        this.placeholderView.setContentId(content.getContentId());
    }

    protected createEmptyView(): DivEl {
        this.placeholderView = new LiveEditPagePlaceholder();
        this.placeholderView.setEnabled(this.enabled);
        this.placeholderView.addClass('no-selection-message');
        return this.placeholderView;
    }

    protected getDefaultMessage(): string {
        return i18n('field.editing.notAvailable');
    }

    async renderWithWidget(summary: ContentSummary, widget): Promise<boolean> {
        this.hasControllersDeferred = Q.defer<boolean>();
        this.hasPageDeferred = Q.defer<boolean>();
        return super.renderWithWidget(summary, widget);
    }

    protected extractWidgetData(response: Response): Record<string, never> {
        const data = super.extractWidgetData(response);
        this.hasControllersDeferred.resolve(data?.hasControllers);
        this.hasPageDeferred.resolve(data?.hasPage);
        return data;
    }

    protected handlePreviewFailure(response?: Response, data?: Record<string, never>) {
        if (data?.hasControllers && !data.hasPage) {
            // special handling for site engine to show controller dropdown
            console.info('Special case for site engine widget: showing dropdown');
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
        this.placeholderView?.deselectOptions();
    }

    public refreshPlaceholder() {
        this.placeholderView?.setReloadNeeded();
    }

    public setEnabled(enabled: boolean) {
        this.enabled = enabled;
        this.placeholderView?.setEnabled(enabled);
    }

    public hasControllers(): Q.Promise<boolean> {
        return this.hasControllersDeferred ? this.hasControllersDeferred.promise : Q.resolve(false);
    }

    public hasPage(): Q.Promise<boolean> {
        return this.hasPageDeferred ? this.hasPageDeferred.promise : Q.resolve(false);
    }


}
