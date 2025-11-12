import {Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {LiveEditPageProxy} from './LiveEditPageProxy';
import {RenderingMode} from '../../rendering/RenderingMode';
import {ContentWizardActions} from '../action/ContentWizardActions';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {PreviewToolbarElement} from '../../../v6/features/layout/AppShell/previewToolbar/PreviewToolbar';

export interface FrameContainerConfig {
    proxy: LiveEditPageProxy;
    wizardActions: ContentWizardActions;
}

export class FrameContainer extends Panel {
    private readonly toolbar: PreviewToolbarElement;
    private readonly proxy: LiveEditPageProxy;
    private readonly wrapper: DivEl;

    constructor(config: FrameContainerConfig) {
        super('frame-container');
        this.setDoOffset(false);

        this.proxy = config.proxy;

        this.toolbar = new PreviewToolbarElement({
            mode: RenderingMode.EDIT,
            previewAction: config.wizardActions.getPreviewAction(),
        });

        this.wrapper = new DivEl('wrapper');

        this.wrapper.appendChild(this.proxy.getIFrame());

        this.appendChildren<Element>(this.toolbar, this.wrapper, this.proxy.getDragMask());
    }

    public getToolbar(): PreviewToolbarElement {
        return this.toolbar;
    }

    public getWrapper(): DivEl {
        return this.wrapper;
    }
}
