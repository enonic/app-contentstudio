import {Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ContentItemPreviewToolbar} from '../../view/ContentItemPreviewToolbar';
import {LiveEditPageProxy} from './LiveEditPageProxy';
import {RenderingMode} from '../../rendering/RenderingMode';
import {ContentWizardActions} from '../action/ContentWizardActions';
import {PreviewActionHelper} from '../../action/PreviewActionHelper';
import {PreviewWidgetDropdown} from '../../view/toolbar/PreviewWidgetDropdown';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';


export interface FrameContainerConfig {
    proxy: LiveEditPageProxy;
    wizardActions: ContentWizardActions;
}


export class FrameContainer
    extends Panel {

    private toolbar: ContentItemPreviewToolbar;
    private proxy: LiveEditPageProxy;
    private wrapper: DivEl;

    constructor(config: FrameContainerConfig) {
        super('frame-container');
        this.setDoOffset(false);

        this.proxy = config.proxy;
        const helper = new PreviewActionHelper();
        this.toolbar = new ContentItemPreviewToolbar(helper, RenderingMode.EDIT);

        this.toolbar.setPreviewAction(config.wizardActions.getPreviewAction());

        this.wrapper = new DivEl('wrapper');
        this.wrapper.appendChild(this.proxy.getIFrame());

        this.appendChildren<Element>(this.toolbar, this.wrapper, this.proxy.getDragMask());
    }

    public getToolbar(): ContentItemPreviewToolbar {
        return this.toolbar;
    }

    public getWrapper(): DivEl {
        return this.wrapper;
    }

    public getWidgetSelector(): PreviewWidgetDropdown {
        return this.toolbar.getWidgetSelector();
    }
}
