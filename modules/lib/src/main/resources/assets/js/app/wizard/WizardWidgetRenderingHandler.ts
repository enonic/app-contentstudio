import {RenderingMode} from '../rendering/RenderingMode';
import {WidgetRenderingHandler, WidgetRenderer, PREVIEW_TYPE} from '../view/WidgetRenderingHandler';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {LiveEditPagePlaceholder} from '../wizard/page/LiveEditPagePlaceholder';
import {Content} from '../content/Content';
import {ContentType} from '../inputtype/schema/ContentType';
import {ContentSummary} from '../content/ContentSummary';
import {Widget} from '@enonic/lib-admin-ui/content/Widget';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ViewWidgetEvent} from '../event/ViewWidgetEvent';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import * as Q from 'q';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';

enum ErrorType {
    APP_MISSING = 0,
}

export class WizardWidgetRenderingHandler
    extends WidgetRenderingHandler {

    private errorMessages: { type: ErrorType, message: string }[] = [];
    private placeholderView: LiveEditPagePlaceholder;
    private readonly content: Content;
    private readonly contentType: ContentType;
    private enabled: boolean;
    private hasPage: boolean;
    private hasMissingApps: boolean;
    private hasAvailableControllers: boolean;
    private debouncedUpdateRenderingState: () => void;

    constructor(renderer: WidgetRenderer, content: Content, contentType: ContentType) {
        super(renderer);
        this.mode = RenderingMode.EDIT;
        this.content = content;
        this.contentType = contentType;
        this.debouncedUpdateRenderingState = AppHelper.debounce(this.updateRenderingState.bind(this), 500);
    }

    protected createEmptyView(): DivEl {
        this.placeholderView = new LiveEditPagePlaceholder(this.content.getContentId(), this.contentType);
        this.placeholderView.setEnabled(this.enabled);
        this.placeholderView.setHasControllersMode(this.hasAvailableControllers);
        this.placeholderView.addClass('no-selection-message');
        return this.placeholderView;
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
        this.placeholderView?.setEnabled(enabled);
    }

    setHasPage(hasPage: boolean) {
        console.info('setHasPage', hasPage);

        const isChanged = !ObjectHelper.isDefined(this.hasPage) || hasPage !== this.hasPage;
        this.hasPage = hasPage;

        if (isChanged) {
            this.debouncedUpdateRenderingState();
        }
    }

    setHasMissingApps(hasMissingApps: boolean) {
        console.info('setHasMissingApps', hasMissingApps);
        const isChanged = !ObjectHelper.isDefined(this.hasMissingApps) || this.hasMissingApps !== hasMissingApps;
        this.hasMissingApps = hasMissingApps;

        if (isChanged) {
            this.debouncedUpdateRenderingState();
        }
    }

    setHasAvailableControllers(hasAvailableControllers: boolean) {
        console.info('setHasAvailableControllers', hasAvailableControllers);

        const isChanged =
            !ObjectHelper.isDefined(this.hasAvailableControllers) || this.hasAvailableControllers !== hasAvailableControllers;

        this.hasAvailableControllers = hasAvailableControllers;
        this.placeholderView?.setHasControllersMode(hasAvailableControllers);

        if (isChanged) {
            this.debouncedUpdateRenderingState();
        }
    }

    async renderWithWidget(summary: ContentSummary, widget: Widget): Promise<boolean> {
        // this.placeholderView?.hide();
        this.clearPreviewErrors();

        return super.renderWithWidget(summary, widget);
    }


    protected handleWidgetEvent(event: ViewWidgetEvent) {
        // do nothing, we want to handle it in LiveFormPanel
    }

    protected handlePreviewFailure(response?: Response) {
        const isSiteEngine = this.isSiteEngineWidgetSelected();
        if (isSiteEngine && (!this.hasPage && this.hasAvailableControllers || this.hasMissingApps)) {
            // special handling for site engine to show controller dropdown
            // we have placeholder instead of empty view here
            super.setPreviewType(PREVIEW_TYPE.EMPTY);
            this.hideMask();
        } else {
            super.handlePreviewFailure(response);
        }
    }

    private isSiteEngineWidgetSelected() {
        const widgetName = this.renderer.getWidgetSelector()?.getSelectedWidget().getWidgetDescriptorKey().getName();
        return widgetName === 'preview-site-engine';
    }


    isItemRenderable(): Q.Promise<boolean> {
        return super.isItemRenderable().then((renderable) => {
            return renderable && this.hasPage && !this.hasMissingApps;
        });
    }

    /*********** from live form panel **************/
    //TODO: move errors to site-engine widget

    private hasErrorMessage(type: ErrorType): boolean {
        return this.errorMessages.some((errorMessage) => errorMessage.type === type);
    }

    private addErrorMessage(type: ErrorType, message: string): boolean {
        if (this.hasErrorMessage(type)) {
            return;
        }
        this.errorMessages.push({type, message});
        this.togglePreviewErrors();
    }

    private clearErrorMissingApps() {
        if (!this.errorMessages.length) {
            return;
        }
        this.errorMessages = this.errorMessages.filter((errorMessage) => errorMessage.type !== ErrorType.APP_MISSING);
        this.togglePreviewErrors();
    }

    clearPreviewErrors() {
        this.errorMessages = [];
        this.togglePreviewErrors();

        // this.placeholder?.hide();
        this.placeholderView?.deselectOptions();
    }

    private togglePreviewErrors() {
        this.renderer.whenRendered(() => {
            if (!this.errorMessages.length) {
                // this.togglePreviewPanel(false);
                this.setPreviewType(PREVIEW_TYPE.WIDGET);
                return;
            }
            const message = this.errorMessages.sort(
                (e1, e2) => e1.type - e2.type)[0].message;


            this.setPreviewType(PREVIEW_TYPE.FAILED, [i18n('field.preview.failed'), i18n(message)]);
        });
    }

    private updateRenderingState(): void {
        this.isItemRenderable().then((renderable) => {
            console.info('updateRenderingState', renderable, this.hasPage, this.hasMissingApps);
            if (renderable) {
                this.clearErrorMissingApps();
                this.setPreviewType(PREVIEW_TYPE.WIDGET);
                return;
            }

            if (!this.hasPage) {  // no page, OK, nothing to render, just show placeholder
                this.clearErrorMissingApps();
                this.placeholderView?.setHasControllersMode(this.hasAvailableControllers);

            } else if (this.hasMissingApps) { // some apps are missing, assuming error is because of that (actually maybe not but we can't know)
                this.addErrorMessage(ErrorType.APP_MISSING, 'field.preview.missing.description');

            } else { // some other error
                this.clearErrorMissingApps();
                this.placeholderView.setPageIsNotRenderableMode();

            }

            this.switchErrorPreviewTypeBasedOnSelectedWidget();
        })
    }

    private switchErrorPreviewTypeBasedOnSelectedWidget() {
        const isSiteEngine = this.isSiteEngineWidgetSelected();
        if (isSiteEngine) {
            this.setPreviewType(PREVIEW_TYPE.EMPTY);
        } else {
            this.setPreviewType(PREVIEW_TYPE.FAILED, [i18n('field.preview.notAvailable')]);
        }
    }

}
