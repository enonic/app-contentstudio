import {RenderingMode} from '../rendering/RenderingMode';
import {WidgetRenderingHandler, WidgetRenderer, PREVIEW_TYPE} from '../view/WidgetRenderingHandler';
import {LiveEditPagePlaceholder} from './page/LiveEditPagePlaceholder';
import {Content} from '../content/Content';
import {ContentType} from '../inputtype/schema/ContentType';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ViewWidgetEvent} from '../event/ViewWidgetEvent';

export class WizardWidgetRenderingHandler
    extends WidgetRenderingHandler {

    private placeholderView: LiveEditPagePlaceholder;
    private readonly content: Content;
    private readonly contentType: ContentType;
    private enabled: boolean;

    constructor(renderer: WidgetRenderer, content: Content, contentType: ContentType) {
        super(renderer);
        this.mode = RenderingMode.EDIT;
        this.content = content;
        this.contentType = contentType;
    }

    protected createEmptyView(): DivEl {
        this.placeholderView = new LiveEditPagePlaceholder(this.content.getContentId(), this.contentType);
        this.placeholderView.setEnabled(this.enabled);
        this.placeholderView.setHasControllersMode(true);
        this.placeholderView.addClass('no-selection-message');
        return this.placeholderView;
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
        this.placeholderView?.setEnabled(enabled);
    }

    protected handleWidgetEvent(event: ViewWidgetEvent) {
        // do nothing, we want to handle it in LiveFormPanel
    }

    protected handlePreviewSuccess(response?: Response) {
        const isSiteEngine = this.isSiteEngineWidgetSelected();
        if (isSiteEngine && response.status == 400) {
            console.info('Special case for site engine widget: 400 response, showing dropdown');
            // special handling for site engine to show controller dropdown
            // we have placeholder instead of empty view here
            super.setPreviewType(PREVIEW_TYPE.EMPTY);
            this.hideMask();
        } else {
            super.handlePreviewSuccess(response);
        }
    }

    private isSiteEngineWidgetSelected() {
        const widgetName = this.renderer.getWidgetSelector()?.getSelectedWidget().getWidgetDescriptorKey().getName();
        return widgetName === 'preview-site-engine';
    }
}
