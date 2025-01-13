import {Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ContentItemPreviewToolbar} from '../../view/ContentItemPreviewToolbar';
import {LiveEditPageProxy} from './LiveEditPageProxy';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {RenderingMode} from '../../rendering/RenderingMode';
import {ContentWizardActions} from '../action/ContentWizardActions';
import {Widget} from '@enonic/lib-admin-ui/content/Widget';


export interface FrameContainerConfig {
    proxy: LiveEditPageProxy;
    wizardActions: ContentWizardActions;
}


export class FrameContainer
    extends Panel {

    private toolbar: ContentItemPreviewToolbar;
    private proxy: LiveEditPageProxy;
    private wizardActions: ContentWizardActions;

    constructor(config: FrameContainerConfig) {
        super('frame-container');
        this.setDoOffset(false);

        this.proxy = config.proxy;
        this.wizardActions = config.wizardActions;
        this.toolbar = new ContentItemPreviewToolbar(RenderingMode.EDIT);

        this.toolbar.setPreviewAction(this.wizardActions.getPreviewAction());

        const iFrame = this.proxy.getIFrame();
        const dragMask = this.proxy.getDragMask();

        this.appendChildren<Element>(this.toolbar, iFrame, dragMask);
    }

    public setItem(item: ContentSummaryAndCompareStatus) {
        this.toolbar.setItem(item);
    }

    public getSelectedWidget(): Widget {
        return this.toolbar.getWidgetSelector().getSelectedWidget();
    }
}
